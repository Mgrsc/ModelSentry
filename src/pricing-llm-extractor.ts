import { log } from './logger.ts';
import { delay, formatPrice, parsePrice } from './utils.ts';
import type { ModelPricing, PricingConfig } from './pricing.ts';
import type { PricingRequestContext } from './pricing-web-fetcher.ts';

interface LlmResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface RawPricingModel {
  provider?: unknown;
  model_name?: unknown;
  name?: unknown;
  input_price_details?: unknown;
  inputPriceDetails?: unknown;
  cache_hit_price?: unknown;
  cacheHitPrice?: unknown;
  input_price?: unknown;
  inputPrice?: unknown;
  output_price?: unknown;
  outputPrice?: unknown;
}

export class PricingLlmExtractor {
  private readonly llmMaxRetries = 2;
  private systemPrompt = '';

  constructor(private config: PricingConfig) {
    this.loadSystemPrompt();
  }

  async extractWithRetry(content: string, providerName: string, context: PricingRequestContext): Promise<ModelPricing[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts + 1; attempt++) {
      try {
        log.debug('Extracting pricing with LLM', { providerName, attempt, maxAttempts: this.config.retryAttempts + 1, ...context });

        const models = await this.extract(content, providerName);

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

  private async loadSystemPrompt(): Promise<void> {
    try {
      const promptFile = Bun.file('resources/prompts/pricing_system_prompt.txt');
      this.systemPrompt = await promptFile.text();
    } catch (error) {
      log.warn('Failed to load system prompt file, using default', { error: error instanceof Error ? error.message : String(error) });
      this.systemPrompt = 'You are a helpful assistant that extracts pricing data from webpages and returns structured JSON.';
    }
  }

  private async extract(content: string, providerName: string): Promise<ModelPricing[]> {
    if (!this.systemPrompt) {
      await this.loadSystemPrompt();
    }

    const timeout = (this.config.requestTimeoutSeconds ?? 120) * 1000;
    const maxAttempts = this.llmMaxRetries + 1;
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

Extract pricing information for each model. Return a JSON object with a "models" array.
Each model object must include "provider", "model_name", "input_price_details", "cache_hit_price", and "output_price".
Use strings with the original billing unit converted to per million tokens when applicable.
If a field has multiple prices, join them with ", " and include a short label in parentheses for each price.
Example: {"models":[{"provider":"OpenAI","model_name":"gpt-5.4","input_price_details":"$2.50 / 1M (Short context Input), $5.00 / 1M (Long context Input)","cache_hit_price":"$0.25 / 1M (Short context Cached Input), $0.50 / 1M (Long context Cached Input)","output_price":"$15.00 / 1M (Short context Output), $22.50 / 1M (Long context Output)"}]}`;

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

        return this.parseLlmResponse(responseText, providerName, attempt);
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

  private parseLlmResponse(responseText: string, providerName: string, attempt: number): ModelPricing[] {
    try {
      const result = JSON.parse(responseText) as LlmResponse;
      const contentText = result.choices?.[0]?.message?.content;

      if (!contentText) {
        throw new Error('Missing choices[0].message.content');
      }

      log.debug('Extracted content from LLM response', {
        providerName,
        contentLength: contentText.length,
        fullContent: contentText
      });

      const jsonData = JSON.parse(contentText) as { models?: RawPricingModel[] };

      if (!Array.isArray(jsonData.models)) {
        throw new Error('Invalid JSON structure: expected object with "models" array');
      }

      const models = jsonData.models
        .map((model) => this.toModelPricing(model))
        .filter((model): model is ModelPricing => model !== null);

      if (models.length === 0) {
        log.warn('No valid models with prices found in LLM response', {
          providerName,
          rawModelsCount: jsonData.models.length,
          rawModels: JSON.stringify(jsonData.models),
          responsePreview: contentText.substring(0, 200)
        });
        return [];
      }

      log.debug('Parsed and validated pricing models', {
        providerName,
        totalFound: jsonData.models.length,
        validModels: models.length,
        modelNames: models.map((model) => model.name.replace(/<[^>]*>/g, '')).join(', ')
      });

      log.debug('Parsed pricing models', {
        providerName,
        totalFound: jsonData.models.length,
        validModels: models.length,
        models: models.map((model) => ({
          name: model.name.replace(/<[^>]*>/g, ''),
          inputPrice: model.inputPrice,
          outputPrice: model.outputPrice
        }))
      });

      return models;
    } catch (error) {
      const parseError = error instanceof Error ? error : new Error(String(error));
      log.error('Failed to parse LLM response', parseError.message, {
        providerName,
        attempt,
        responsePreview: responseText.substring(0, 200)
      });
      throw new Error('LLM response parsing failed: ' + parseError.message);
    }
  }

  private toModelPricing(model: RawPricingModel): ModelPricing | null {
    const modelName = typeof model.model_name === 'string'
      ? model.model_name
      : typeof model.name === 'string'
        ? model.name
        : null;

    if (!modelName) {
      return null;
    }

    const detailedPricing = this.toDetailedModelPricing(model, modelName);
    if (detailedPricing) return detailedPricing;

    return this.toLegacyModelPricing(model, modelName);
  }

  private toDetailedModelPricing(model: RawPricingModel, modelName: string): ModelPricing | null {
    const inputPriceDetails = this.toDisplayText(model.input_price_details ?? model.inputPriceDetails);
    const outputPrice = this.toDisplayText(model.output_price ?? model.outputPrice);

    if (!inputPriceDetails || !outputPrice) {
      return null;
    }

    const inputPriceLines = this.toDisplayLines(inputPriceDetails);
    const cacheHitPriceLines = this.toDisplayLines(this.toDisplayText(model.cache_hit_price ?? model.cacheHitPrice) || 'N/A');
    const outputPriceLines = this.toDisplayLines(outputPrice);

    if (!inputPriceLines.length || !outputPriceLines.length) {
      return null;
    }

    return {
      name: this.toModelNameHtml(modelName),
      inputPrice: inputPriceLines[0].text,
      inputPriceLines,
      cacheHitPrice: cacheHitPriceLines[0].text,
      cacheHitPriceLines,
      outputPrice: outputPriceLines[0].text,
      outputPriceLines
    };
  }

  private toLegacyModelPricing(model: RawPricingModel, modelName: string): ModelPricing | null {
    const inputPrice = parsePrice(model.input_price ?? model.inputPrice);
    const outputPrice = parsePrice(model.output_price ?? model.outputPrice);

    if (inputPrice === null || outputPrice === null || inputPrice < 0 || outputPrice < 0) {
      return null;
    }

    return {
      name: this.toModelNameHtml(modelName),
      inputPrice: formatPrice(inputPrice),
      outputPrice: formatPrice(outputPrice)
    };
  }

  private toDisplayText(value: unknown): string | null {
    if (typeof value === 'number') {
      if (value < 0) return null;
      return formatPrice(value);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || null;
    }
    return null;
  }

  private toDisplayLines(value: string): Array<{ text: string }> {
    return value
      .split(',')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
  }

  private toModelNameHtml(modelName: string): string {
    const nameParts = modelName.split('<->');
    const modelNameHtml = nameParts.length > 1
      ? `${escapeHtml(nameParts[0].trim())}<span class="model-alias">↳ ${nameParts.slice(1).map((name) => escapeHtml(name.trim())).join(', ')}</span>`
      : escapeHtml(modelName);

    return modelNameHtml;
  }

  private getLlmRetryDelay(attempt: number): number {
    const baseDelay = 1000;
    return Math.min(5000, baseDelay * Math.pow(2, attempt - 1));
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
