import { ProviderConfig, getEnvVar } from './config.ts';
import { log } from './logger.ts';
import { HttpClient } from './http-client.ts';
import { DEFAULT_RETRY_COUNT, DEFAULT_RETRY_INTERVAL_MS, ERROR_MESSAGES } from './constants.ts';
import type { CacheProvider, CachedProviderStatus } from './cache-provider.ts';

export interface ModelData {
  name: string;
  id: string;
}

export interface ProviderStatus {
  id: string;
  name: string;
  enabled: boolean;
  lastCheck: Date | null;
  lastSuccess: Date | null;
  models: ModelData[];
  error: string | null;
  modelCount: number;
  retryCount: number;
  nextRetryAt: Date | null;
  isRetrying: boolean;
}

export class ProviderManager {
  private providers: Map<string, ProviderStatus> = new Map();
  private readonly MAX_RETRY_COUNT = DEFAULT_RETRY_COUNT;
  private readonly RETRY_INTERVAL_MS = DEFAULT_RETRY_INTERVAL_MS;
  private httpClient: HttpClient;

  constructor(
    private configs: ProviderConfig[],
    private cacheProvider?: CacheProvider
  ) {
    this.httpClient = new HttpClient();
    this.initializeProviders();

    const enabledCount = Array.from(this.providers.values()).filter(p => p.enabled).length;
    log.info('Provider manager initialized', {
      total: configs.length,
      enabled: enabledCount,
      disabled: configs.length - enabledCount
    });
  }

  private initializeProviders() {
    for (const config of this.configs) {
      this.providers.set(config.id, {
        id: config.id,
        name: config.name,
        enabled: config.enabled,
        lastCheck: null,
        lastSuccess: null,
        models: [],
        error: null,
        modelCount: 0,
        retryCount: 0,
        nextRetryAt: null,
        isRetrying: false
      });
    }
  }

  applyCachedProviderStatuses(cached: Record<string, CachedProviderStatus> | undefined): void {
    if (!cached) return;

    for (const [providerId, cachedStatus] of Object.entries(cached)) {
      const status = this.providers.get(providerId);
      if (!status) continue;

      if (Array.isArray(cachedStatus.models)) {
        status.models = cachedStatus.models;
        status.modelCount = cachedStatus.models.length;
      }

      if (cachedStatus.lastCheck) {
        const d = new Date(cachedStatus.lastCheck);
        if (!isNaN(d.getTime())) status.lastCheck = d;
      }

      if (cachedStatus.lastSuccess) {
        const d = new Date(cachedStatus.lastSuccess);
        if (!isNaN(d.getTime())) status.lastSuccess = d;
      }
    }
  }



  async fetchModels(providerId: string): Promise<ModelData[]> {
    const config = this.configs.find(c => c.id === providerId);
    const status = this.providers.get(providerId);

    if (!config || !status || !config.enabled) {
      throw new Error(ERROR_MESSAGES.PROVIDER_NOT_FOUND(providerId));
    }

    if (status.nextRetryAt && new Date() < status.nextRetryAt) {
      const remainingTime = Math.ceil((status.nextRetryAt.getTime() - Date.now()) / 1000);
      log.debug('Skipping fetch - retry cooldown active', {
        providerId,
        remainingTime: `${remainingTime}s`,
        retryCount: status.retryCount
      });
      throw new Error(ERROR_MESSAGES.RETRY_COOLDOWN(remainingTime));
    }

    return await this.attemptFetchWithRetry(providerId, config, status);
  }

  private async attemptFetchWithRetry(providerId: string, config: ProviderConfig, status: ProviderStatus): Promise<ModelData[]> {
    const maxAttempts = this.MAX_RETRY_COUNT + 1;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        status.lastCheck = new Date();

        if (attempt > 1) {
          status.isRetrying = true;
          log.info('Retrying model fetch', {
            providerId,
            attempt,
            maxAttempts,
            retryCount: status.retryCount
          });
        }

        const models = await this.performFetch(providerId, config);

        status.error = null;
        status.retryCount = 0;
        status.nextRetryAt = null;
        status.isRetrying = false;
        status.models = models;
        status.modelCount = models.length;
        status.lastSuccess = new Date();

        log.debug('Models fetched successfully', {
          providerId,
          modelCount: models.length,
          attempt,
          durationMs: Date.now() - status.lastCheck.getTime()
        });

        if (this.cacheProvider) {
          await this.cacheProvider.saveProviderStatus(providerId, {
            models,
            lastCheck: status.lastCheck?.toISOString(),
            lastSuccess: status.lastSuccess?.toISOString()
          });
        }

        return models;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxAttempts) {
          status.retryCount = attempt;
          status.nextRetryAt = new Date(Date.now() + this.RETRY_INTERVAL_MS);
          status.isRetrying = false;

          log.warn('Model fetch failed, scheduling retry', {
            providerId,
            attempt,
            maxAttempts,
            nextRetryAt: status.nextRetryAt.toISOString(),
            error: lastError.message
          });

          continue;
        } else {
          status.error = lastError.message;
          status.retryCount = this.MAX_RETRY_COUNT;
          status.nextRetryAt = null;
          status.isRetrying = false;

          log.error('All retry attempts failed', lastError.message, {
            providerId,
            totalAttempts: maxAttempts,
            finalError: lastError.message
          });

          throw lastError;
        }
      }
    }

    throw lastError || new Error('Unknown error during fetch attempts');
  }

  private async performFetch(providerId: string, config: ProviderConfig): Promise<ModelData[]> {
    const headers = this.buildHeaders(config);
    const url = this.buildUrl(config);

    const data = await this.httpClient.fetchJson(url, {
      method: config.method,
      headers
    });

    return this.parseModels(data, config);
  }

  private buildHeaders(config: ProviderConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ModelSentry/1.0'
    };

    if (config.auth.type === 'header' && config.auth.headerName && config.auth.apiKeyEnvVar) {
      const apiKey = getEnvVar(config.auth.apiKeyEnvVar);
      if (apiKey) {
        const prefix = config.auth.valuePrefix || '';
        headers[config.auth.headerName] = prefix + apiKey;
      }
    } else if (config.auth.type === 'custom_headers' && config.auth.customHeaders) {
      for (const [headerName, headerConfig] of Object.entries(config.auth.customHeaders)) {
        if (headerConfig.envVar) {
          const value = getEnvVar(headerConfig.envVar);
          if (value) headers[headerName] = value;
        } else if (headerConfig.value) {
          headers[headerName] = headerConfig.value;
        }
      }
    }

    return headers;
  }

  private buildUrl(config: ProviderConfig): string {
    let url = config.url;

    if (config.auth.type === 'query' && config.auth.keyParamName && config.auth.apiKeyEnvVar) {
      const apiKey = getEnvVar(config.auth.apiKeyEnvVar);
      if (apiKey) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}${config.auth.keyParamName}=${encodeURIComponent(apiKey)}`;
      }
    }

    return url;
  }

  private parseModels(data: any, config: ProviderConfig): ModelData[] {
    try {
      let modelList = data;

      if (config.parsing.modelListPath) {
        const pathParts = config.parsing.modelListPath.split('.');
        for (const part of pathParts) {
          modelList = modelList?.[part];
        }
      }

      if (!Array.isArray(modelList)) {
        throw new Error('Model list is not an array');
      }

      return modelList.map((item: any) => {
        const pathParts = config.parsing.modelNamePath.split('.');
        let modelName = item;

        for (const part of pathParts) {
          modelName = modelName?.[part];
        }

        if (typeof modelName !== 'string') {
          throw new Error(`Model name is not a string: ${JSON.stringify(modelName)}`);
        }

        if (config.parsing.modelNameRegex) {
          const match = modelName.match(new RegExp(config.parsing.modelNameRegex));
          if (match && match[1]) {
            modelName = match[1];
          }
        }

        return {
          name: modelName,
          id: modelName
        };
      });
    } catch (error) {
      throw new Error(ERROR_MESSAGES.PARSE_ERROR(error instanceof Error ? error.message : String(error)));
    }
  }

  getProviderStatus(providerId: string): ProviderStatus | undefined {
    return this.providers.get(providerId);
  }

  getAllProviderStatuses(): ProviderStatus[] {
    return Array.from(this.providers.values());
  }

  getEnabledProviders(): ProviderConfig[] {
    return this.configs.filter(config => {
      const status = this.providers.get(config.id);
      return status?.enabled || false;
    });
  }
}
