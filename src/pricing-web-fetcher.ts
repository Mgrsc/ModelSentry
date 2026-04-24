import { log } from './logger.ts';
import { DEFAULT_USER_AGENT, JINA_READER_BASE_URL } from './constants.ts';
import { delay } from './utils.ts';
import type { PricingConfig } from './pricing.ts';

export interface PricingRequestContext {
  reason: string;
  forceRefresh: boolean;
}

type HttpStatusError = Error & { status?: number };

export class PricingWebFetcher {
  private readonly minRequestIntervalMs = 6000;
  private rateLimitChain: Promise<void> = Promise.resolve();
  private lastRequestTime = 0;

  constructor(private config: PricingConfig) {}

  async fetchWithRetry(url: string, context: PricingRequestContext): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts + 1; attempt++) {
      try {
        log.debug('Fetching web content', { url, attempt, maxAttempts: this.config.retryAttempts + 1, ...context });

        const content = await this.fetch(url, context);

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

  private async fetch(url: string, context: PricingRequestContext): Promise<string> {
    const controller = new AbortController();
    const timeout = (this.config.requestTimeoutSeconds ?? 120) * 1000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const jinaUrl = `${JINA_READER_BASE_URL}${url}`;
      const hasApiKey = this.config.jinaApiKey.trim().length > 0;

      if (hasApiKey) {
        try {
          return await this.fetchJinaWithApiKey(jinaUrl, controller.signal);
        } catch (error) {
          const normalized = this.normalizeJinaError(error, timeout, 'Jina Reader API');
          log.warn('Jina API-key request failed, falling back to public r.jina.ai', {
            url,
            error: normalized.message,
            ...(typeof normalized.status === 'number' ? { status: normalized.status } : {}),
            ...context
          });
        }
      }

      try {
        return await this.fetchJinaPublic(jinaUrl, controller.signal);
      } catch (error) {
        const normalized = this.normalizeJinaError(error, timeout, 'Public r.jina.ai');
        log.warn('Public r.jina.ai request failed, falling back to direct fetch', {
          url,
          error: normalized.message,
          ...(typeof normalized.status === 'number' ? { status: normalized.status } : {}),
          ...context
        });
        return await this.fetchDirect(url, timeout);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchJinaWithApiKey(jinaUrl: string, signal: AbortSignal): Promise<string> {
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
      const error = new Error(`Jina Reader API failed: ${response.status} ${response.statusText}`) as HttpStatusError;
      error.status = response.status;
      throw error;
    }

    return await response.text();
  }

  private async fetchJinaPublic(jinaUrl: string, signal: AbortSignal): Promise<string> {
    await this.applyRateLimit();

    const response = await fetch(jinaUrl, {
      headers: {
        'User-Agent': DEFAULT_USER_AGENT
      },
      signal
    });

    if (!response.ok) {
      const error = new Error(`Public r.jina.ai failed: ${response.status} ${response.statusText}`) as HttpStatusError;
      error.status = response.status;
      throw error;
    }

    return await response.text();
  }

  private normalizeJinaError(error: unknown, timeoutMs: number, source: string): HttpStatusError {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Error(`Request to ${source} timed out after ${timeoutMs / 1000} seconds.`);
    }

    return error instanceof Error ? error : new Error(String(error));
  }

  private async fetchDirect(url: string, timeout: number): Promise<string> {
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
      .catch(() => {})
      .then(async () => {
        const now = Date.now();
        const wait = Math.max(0, this.lastRequestTime + this.minRequestIntervalMs - now);
        if (wait > 0) {
          await delay(wait);
        }
        this.lastRequestTime = Date.now();
      });

    return this.rateLimitChain;
  }
}
