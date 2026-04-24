import { log } from './logger.ts';
import { IconManager } from './icons.ts';
import type { CacheProvider, CachedProviderPricing } from './cache-provider.ts';
import { PricingWebFetcher, type PricingRequestContext } from './pricing-web-fetcher.ts';
import { PricingLlmExtractor } from './pricing-llm-extractor.ts';

export interface ModelPricing {
  name: string;
  inputPrice?: string;
  inputPriceLines?: Array<{ text: string }>;
  cacheHitPrice?: string;
  cacheHitPriceLines?: Array<{ text: string }>;
  outputPrice?: string;
  outputPriceLines?: Array<{ text: string }>;
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
  private isLoading: boolean = false;
  private lastErrorByProviderId: Map<string, string | null> = new Map();
  private webFetcher: PricingWebFetcher;
  private llmExtractor: PricingLlmExtractor;

  constructor(
    private config: PricingConfig,
    private iconManager: IconManager,
    private cacheProvider?: CacheProvider,
    private onProviderEvent?: (event: PricingProviderEvent) => void | Promise<void>
  ) {
    this.webFetcher = new PricingWebFetcher(config);
    this.llmExtractor = new PricingLlmExtractor(config);
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
    const context: PricingRequestContext = { reason, forceRefresh };
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

  private async fetchProviderPricing(
    provider: { id: string; name: string; pricingUrl: string },
    context: PricingRequestContext
  ): Promise<ProviderPricing> {
    const webContent = await this.webFetcher.fetchWithRetry(provider.pricingUrl, context);
    const models = await this.llmExtractor.extractWithRetry(webContent, provider.name, context);

    return {
      id: provider.id,
      name: provider.name,
      models,
      lastUpdated: new Date(),
      iconHtml: this.iconManager.generateIconHtml(provider.name) || ''
    };
  }
}
