import { log } from './logger.ts';
import { RatioCalculator } from './ratio-calculator.ts';
import { IconManager } from './icons.ts';
import { DEFAULT_USER_AGENT, JINA_READER_BASE_URL } from './constants.ts';
import { delay, parsePrice } from './utils.ts';
import type { CacheProvider, CachedProviderPricing } from './cache-provider.ts';

export interface ModelPricing {
  name: string;
  modelRatio: number | string;
  completionRatio: number | string;
  inputPrice?: string;
  outputPrice?: string;
}

export interface ProviderPricing {
  id: string;
  name: string;
  models: ModelPricing[];
  lastUpdated: Date;
  error?: string;
  iconHtml?: string;
  pricingUrl?: string;
}

export interface PricingConfig {
  jinaApiKey: string;
  llmApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
  retryAttempts: number;
  retryIntervalMinutes: number;
  requestTimeoutSeconds?: number;
  providers: {
    id: string;
    name: string;
    pricingUrl: string;
  }[];
}

export interface PricingFetchOptions {
  forceRefresh?: boolean;
  reason?: string;
  providerIds?: string[];
}

export interface PricingProviderEvent {
  providerId: string;
  providerName: string;
  pricingUrl: string;
  reason?: string;
  type: 'error' | 'recovered';
  error?: string;
}

export class PricingManager {
  private cache: Map<string, ProviderPricing> = new Map();
  private readonly JINA_READER_BASE = JINA_READER_BASE_URL;
  private readonly LLM_MAX_RETRIES = 2;
  private readonly MIN_REQUEST_INTERVAL_MS = 6000;
  private systemPrompt: string = '';
  private ratioCalculator: RatioCalculator;
  private isLoading: boolean = false;
  private rateLimitChain: Promise<void> = Promise.resolve();
  private lastRequestTime = 0;
  private lastErrorByProviderId: Map<string, string | null> = new Map();

  constructor(
    private config: PricingConfig,
    private iconManager: IconManager,
    private cacheProvider?: CacheProvider,
    private onProviderEvent?: (event: PricingProviderEvent) => void | Promise<void>
  ) {
    this.loadSystemPrompt();
    this.ratioCalculator = new RatioCalculator();
  }

  applyCachedPricing(cached: Record<string, CachedProviderPricing> | undefined): void {
    if (!cached) return;

    for (const provider of this.config.providers) {
      const entry = cached[provider.id];
      if (!entry) continue;

      const lastUpdated = new Date(entry.lastUpdated);
      this.cache.set(provider.id, {
        id: provider.id,
        name: entry.name || provider.name,
        models: Array.isArray(entry.models) ? entry.models : [],
        lastUpdated: isNaN(lastUpdated.getTime()) ? new Date(0) : lastUpdated,
        error: entry.error,
        iconHtml: entry.iconHtml,
        pricingUrl: provider.pricingUrl
      });
    }
  }

  private async loadSystemPrompt(): Promise<void> {
    try {
      const promptFile = Bun.file('resources/prompts/pricing_system_prompt.txt');
      this.systemPrompt = await promptFile.text();
    } catch (error) {
      log.warn('Failed to load system prompt file, using default', { error: error instanceof Error ? error.message : String(error) });
      this.systemPrompt = 'You are a helpful assistant that extracts pricing data from webpages and returns structured JSON.';
    }
  }

  public isCurrentlyLoading(): boolean {
    return this.isLoading;
  }

  async getPricingData(options: PricingFetchOptions = {}): Promise<ProviderPricing[]> {
    if (this.isLoading) {
      log.info('Pricing data fetch already in progress.');
      return Array.from(this.cache.values());
    }
    this.isLoading = true;
    const forceRefresh = !!options.forceRefresh;
    const reason = options.reason || 'manual';
    const context = { reason, forceRefresh };
    log.info('Getting pricing data concurrently for all providers', context);

    const targetProviders = options.providerIds?.length
      ? this.config.providers.filter(p => options.providerIds!.includes(p.id))
      : this.config.providers;

    if (!forceRefresh) {
      const results = targetProviders.map(provider => {
        const cached = this.cache.get(provider.id);
        if (cached) {
          return { ...cached, pricingUrl: provider.pricingUrl };
        }
        return {
          id: provider.id,
          name: provider.name,
          models: [],
          lastUpdated: new Date(0),
          error: '尚未获取价格数据（点击“刷新价格”或等待该提供商模型发生变动后自动刷新）',
          iconHtml: this.iconManager.generateIconHtml(provider.name) || '',
          pricingUrl: provider.pricingUrl
        } satisfies ProviderPricing;
      });

      this.isLoading = false;
      return results;
    }

    const pricingPromises = targetProviders.map(async (provider) => {
      try {
        log.info('Fetching fresh pricing data', { provider: provider.name, ...context });
        const pricing = await this.fetchProviderPricing(provider, context);
        pricing.pricingUrl = provider.pricingUrl;

        this.cache.set(provider.id, pricing);
        if (this.cacheProvider) {
          await this.cacheProvider.savePricing(provider.id, {
            id: provider.id,
            name: pricing.name,
            models: pricing.models,
            lastUpdated: pricing.lastUpdated.toISOString(),
            error: pricing.error,
            iconHtml: pricing.iconHtml
          });
        }
        await this.handleProviderRecovery(provider, reason);
        return pricing;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error('Failed to fetch pricing for provider', errorMessage, {
          provider: provider.name
        });

        await this.handleProviderError(provider, errorMessage, reason);

        const cached = this.cache.get(provider.id);
        if (cached) {
          return { ...cached, pricingUrl: provider.pricingUrl, error: `Failed to update: ${errorMessage}` };
        }

        return {
          id: provider.id,
          name: provider.name,
          models: [],
          lastUpdated: new Date(),
          error: errorMessage,
          pricingUrl: provider.pricingUrl
        };
      }
    });

    const results = await Promise.all(pricingPromises);

    this.isLoading = false;
    log.info('Finished fetching all provider pricing data.');
    return results;
  }

  async refreshProviders(providerIds: string[], reason = 'manual-refresh'): Promise<ProviderPricing[]> {
    if (!providerIds.length) {
      return [];
    }
    return await this.getPricingData({ providerIds, forceRefresh: true, reason });
  }

  private async emitProviderEvent(event: PricingProviderEvent): Promise<void> {
    if (!this.onProviderEvent) return;
    try {
      await this.onProviderEvent(event);
    } catch (error) {
      log.warn('Pricing provider event handler failed', {
        providerId: event.providerId,
        type: event.type,
        reason: event.reason,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleProviderError(
    provider: { id: string; name: string; pricingUrl: string },
    errorMessage: string,
    reason: string
  ): Promise<void> {
    const lastError = this.lastErrorByProviderId.get(provider.id);
    if (lastError === errorMessage) return;

    this.lastErrorByProviderId.set(provider.id, errorMessage);
    await this.emitProviderEvent({
      providerId: provider.id,
      providerName: provider.name,
      pricingUrl: provider.pricingUrl,
      reason,
      type: 'error',
      error: errorMessage
    });
  }

  private async handleProviderRecovery(
    provider: { id: string; name: string; pricingUrl: string },
    reason: string
  ): Promise<void> {
    const lastError = this.lastErrorByProviderId.get(provider.id);
    if (!lastError) return;

    this.lastErrorByProviderId.set(provider.id, null);
    await this.emitProviderEvent({
      providerId: provider.id,
      providerName: provider.name,
      pricingUrl: provider.pricingUrl,
      reason,
      type: 'recovered'
    });
  }

  private async fetchProviderPricing(provider: { id: string; name: string; pricingUrl: string }, context: any): Promise<ProviderPricing> {
    const webContent = await this.fetchWebContentWithRetry(provider.pricingUrl, context);

    const models = await this.extractPricingWithLLMRetry(webContent, provider.name, context);

    return {
      id: provider.id,
      name: provider.name,
      models,
      lastUpdated: new Date(),
        iconHtml: this.iconManager.generateIconHtml(provider.name) || ''
    };
  }

  private async fetchWebContentWithRetry(url: string, context: any): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts + 1; attempt++) {
      try {
        log.debug('Fetching web content', { url, attempt, maxAttempts: this.config.retryAttempts + 1, ...context });

        const content = await this.fetchWebContent(url, context);

        if (attempt > 1) {
          log.info('Web content fetch succeeded after retry', { url, attempt });
        }

        return content;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt <= this.config.retryAttempts) {
          const waitTime = this.config.retryIntervalMinutes * 60 * 1000;
          log.warn('Web content fetch failed, retrying', {
            url,
            attempt,
            maxAttempts: this.config.retryAttempts + 1,
            waitTime: `${this.config.retryIntervalMinutes}min`,
            error: lastError.message
          });
          await delay(waitTime);
        }
      }
    }

    throw lastError || new Error('Failed to fetch web content after all retries');
  }

  private async fetchWebContent(url: string, context: any): Promise<string> {
    const controller = new AbortController();
    const timeout = (this.config.requestTimeoutSeconds ?? 120) * 1000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const jinaUrl = `${this.JINA_READER_BASE}${url}`;
      const hasApiKey = typeof this.config.jinaApiKey === 'string' && this.config.jinaApiKey.trim().length > 0;

      if (hasApiKey) {
        try {
          return await this.fetchJinaContentWithApiKey(jinaUrl, controller.signal);
        } catch (error) {
          const normalized = this.normalizeJinaError(error, timeout, 'Jina Reader API');
          log.warn('Jina API-key request failed, falling back to public r.jina.ai', {
            url,
            error: normalized.message,
            ...(typeof (normalized as any).status === 'number' ? { status: (normalized as any).status } : {}),
            ...context
          });
        }
      }

      try {
        return await this.fetchJinaContentPublic(jinaUrl, controller.signal);
      } catch (error) {
        const normalized = this.normalizeJinaError(error, timeout, 'Public r.jina.ai');
        log.warn('Public r.jina.ai request failed, falling back to direct fetch', {
          url,
          error: normalized.message,
          ...(typeof (normalized as any).status === 'number' ? { status: (normalized as any).status } : {}),
          ...context
        });
        return await this.fetchDirectContent(url, timeout, context);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchJinaContentWithApiKey(jinaUrl: string, signal: AbortSignal): Promise<string> {
    await this.applyRateLimit();

    const response = await fetch(jinaUrl, {
      headers: {
        'Authorization': `Bearer ${this.config.jinaApiKey}`,
        'X-Proxy': 'auto',
        'X-Remove-Selector': 'header, .class, #id',
        'X-Retain-Images': 'none',
        'X-Return-Format': 'markdown'
      },
      signal
    });

    if (!response.ok) {
      const error = new Error(`Jina Reader API failed: ${response.status} ${response.statusText}`);
      (error as any).status = response.status;
      throw error;
    }

    return await response.text();
  }

  private async fetchJinaContentPublic(jinaUrl: string, signal: AbortSignal): Promise<string> {
    await this.applyRateLimit();

    const response = await fetch(jinaUrl, {
      headers: {
        'User-Agent': DEFAULT_USER_AGENT
      },
      signal
    });

    if (!response.ok) {
      const error = new Error(`Public r.jina.ai failed: ${response.status} ${response.statusText}`);
      (error as any).status = response.status;
      throw error;
    }

    return await response.text();
  }

  private normalizeJinaError(error: unknown, timeoutMs: number, source: string): Error {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Error(`Request to ${source} timed out after ${timeoutMs / 1000} seconds.`);
    }

    return error instanceof Error ? error : new Error(String(error));
  }

  private async fetchDirectContent(url: string, timeout: number, context: any): Promise<string> {
    await this.applyRateLimit();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Direct fetch failed: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Direct request timed out after ${timeout / 1000} seconds.`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async applyRateLimit(): Promise<void> {
    this.rateLimitChain = this.rateLimitChain
      .catch(() => {}) // ensure the chain is not stuck on rejection
      .then(async () => {
        const now = Date.now();
        const wait = Math.max(0, this.lastRequestTime + this.MIN_REQUEST_INTERVAL_MS - now);
        if (wait > 0) {
          await delay(wait);
        }
        this.lastRequestTime = Date.now();
      });

    return this.rateLimitChain;
  }

  private async extractPricingWithLLMRetry(content: string, providerName: string, context: any): Promise<ModelPricing[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts + 1; attempt++) {
      try {
        log.debug('Extracting pricing with LLM', { providerName, attempt, maxAttempts: this.config.retryAttempts + 1, ...context });

        const models = await this.extractPricingWithLLM(content, providerName, context);

        if (attempt > 1) {
          log.info('LLM extraction succeeded after retry', { providerName, attempt, modelsFound: models.length });
        }

        return models;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt <= this.config.retryAttempts) {
          const waitTime = this.config.retryIntervalMinutes * 60 * 1000;
          log.warn('LLM extraction failed, retrying', {
            providerName,
            attempt,
            maxAttempts: this.config.retryAttempts + 1,
            waitTime: `${this.config.retryIntervalMinutes}min`,
            error: lastError.message
          });
          await delay(waitTime);
        }
      }
    }

    log.error('LLM extraction failed after all retries', lastError?.message || 'Unknown error', { providerName });
    return [];
  }

  private async extractPricingWithLLM(content: string, providerName: string, context: any): Promise<ModelPricing[]> {
    if (!this.systemPrompt) {
      await this.loadSystemPrompt();
    }

    const timeout = (this.config.requestTimeoutSeconds ?? 120) * 1000;
    const maxAttempts = this.LLM_MAX_RETRIES + 1;
    let lastError: Error | null = null;

    log.debug('Starting LLM extraction', {
      providerName,
      contentLength: content.length,
      contentPreview: content.substring(0, 300),
      llmModel: this.config.llmModel,
      llmBaseUrl: this.config.llmBaseUrl
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const prompt = `Provider: ${providerName}

Webpage content:
${content}

Extract pricing information for each model. From the content, find the input price and output price per million tokens.
Return the result as a JSON object with a "models" key, which is an array of objects.
Each object in the array should have the following keys: "model_name" (string), "input_price" (number), "output_price" (number).
Example: {"models": [{"model_name": "gpt-4o", "input_price": 5.0, "output_price": 15.0}]}`;

        log.debug('Sending request to LLM', {
          providerName,
          attempt,
          promptLength: prompt.length,
          systemPromptLength: this.systemPrompt.length
        });

        const response = await fetch(this.config.llmBaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.llmApiKey}`
          },
          body: JSON.stringify({
            model: this.config.llmModel,
            messages: [
              { role: 'system', content: this.systemPrompt },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`LLM API failed: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();

        log.debug('Received LLM response', {
          providerName,
          attempt,
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 500)
        });

        try {
          const result = JSON.parse(responseText);
          const content_text = result.choices[0].message.content;

          log.debug('Extracted content from LLM response', {
            providerName,
            contentLength: content_text?.length,
            fullContent: content_text
          });

          const jsonData = JSON.parse(content_text);

          if (!jsonData.models || !Array.isArray(jsonData.models)) {
            throw new Error('Invalid JSON structure: expected object with "models" array');
          }

          const priceInputs = jsonData.models
            .map((model: any) => ({
              model_name: model.model_name || model.name,
              input_price: parsePrice(model.input_price || model.inputPrice),
              output_price: parsePrice(model.output_price || model.outputPrice),
            }))
            .filter((model: any): model is { model_name: string; input_price: number; output_price: number } =>
              !!model.model_name &&
              typeof model.input_price === 'number' &&
              typeof model.output_price === 'number'
            );

          if (priceInputs.length === 0) {
            log.warn('No valid models with prices found in LLM response', {
              providerName,
              rawModelsCount: jsonData.models?.length,
              rawModels: JSON.stringify(jsonData.models),
              responsePreview: content_text?.substring(0, 200)
            });
            return [];
          }

          log.debug('Parsed and validated pricing models', {
            providerName,
            totalFound: jsonData.models.length,
            validModels: priceInputs.length,
            modelNames: priceInputs.map((m: any) => m.model_name).join(', ')
          });

          const ratioOutputs = this.ratioCalculator.calculate(priceInputs);

          const validModels: ModelPricing[] = ratioOutputs.map(output => {
            const nameParts = output.model_name.split('<->');
            const modelNameHtml = nameParts.length > 1
              ? `${nameParts[0].trim()}<span class="model-alias">↳ ${nameParts.slice(1).map(s => s.trim()).join(', ')}</span>`
              : output.model_name;

            return {
              name: modelNameHtml,
              inputPrice: output.inputPrice,
              outputPrice: output.outputPrice,
              modelRatio: output.model_ratio,
              completionRatio: output.completion_ratio ?? 'N/A',
            };
          });

          log.debug('Parsed and calculated pricing models', {
            providerName,
            totalFound: jsonData.models.length,
            validModels: validModels.length,
            models: validModels.map(m => ({
              name: m.name.replace(/<[^>]*>/g, ''),
              inputPrice: m.inputPrice,
              outputPrice: m.outputPrice,
              modelRatio: m.modelRatio,
              completionRatio: m.completionRatio
            }))
          });

          return validModels;
        } catch (error) {
          const parseError = error instanceof Error ? error : new Error(String(error));
          log.error('Failed to parse LLM response', parseError.message, {
            providerName,
            attempt,
            responsePreview: responseText?.substring(0, 200)
          });
          throw new Error('LLM response parsing failed: ' + parseError.message);
        }
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        lastError = normalizedError.name === 'AbortError'
          ? new Error(`Request to LLM API timed out after ${timeout / 1000} seconds.`)
          : normalizedError;

        if (attempt < maxAttempts) {
          log.warn('LLM request attempt failed, retrying', {
            providerName,
            attempt,
            maxAttempts,
            error: lastError.message
          });
          await delay(this.getLlmRetryDelay(attempt));
          continue;
        }

        throw lastError;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError || new Error('LLM request failed without specific error.');
  }

  private getLlmRetryDelay(attempt: number): number {
    const baseDelay = 1000;
    return Math.min(5000, baseDelay * Math.pow(2, attempt - 1));
  }

}
