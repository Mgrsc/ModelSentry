import { log } from './logger.ts';
import { DEFAULT_USER_AGENT, FIRECRAWL_SCRAPE_URL, JINA_READER_BASE_URL } from './constants.ts';
import { delay } from './utils.ts';
import type { PricingConfig } from './pricing.ts';

export interface PricingRequestContext {
  reason: string;
  forceRefresh: boolean;
}

type HttpStatusError = Error & { status?: number };
type FreeSourceId = 'jina' | 'firecrawl';

interface FreeSource {
  id: FreeSourceId;
  minIntervalMs: number;
  cooldownOnRateLimitMs: number;
}

const FREE_SOURCES: FreeSource[] = [
  { id: 'jina', minIntervalMs: 3500, cooldownOnRateLimitMs: 60_000 },
  { id: 'firecrawl', minIntervalMs: 6500, cooldownOnRateLimitMs: 60_000 }
];

export class PricingWebFetcher {
  private nextSourceIndex = 0;
  private readonly rateLimitChains = new Map<FreeSourceId, Promise<void>>();
  private readonly lastRequestTime = new Map<FreeSourceId, number>();
  private readonly cooldownUntil = new Map<FreeSourceId, number>();

  constructor(private config: PricingConfig) {
    for (const source of FREE_SOURCES) {
      this.rateLimitChains.set(source.id, Promise.resolve());
      this.lastRequestTime.set(source.id, 0);
      this.cooldownUntil.set(source.id, 0);
    }
  }

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
      const order = this.buildSourceOrder();
      let lastError: Error | null = null;

      for (const source of order) {
        if (this.isInCooldown(source.id)) {
          log.debug('Skipping free source due to cooldown', { source: source.id, url, ...context });
          continue;
        }

        try {
          const content = await this.fetchFromSource(source, url, controller.signal);
          log.debug('Web content fetched from free source', { source: source.id, url, ...context });
          return content;
        } catch (error) {
          const normalized = this.normalizeError(error, timeout, source.id);
          lastError = normalized;

          if (typeof normalized.status === 'number' && normalized.status === 429) {
            this.markCooldown(source.id, source.cooldownOnRateLimitMs);
          }

          log.warn('Free source fetch failed, trying next source', {
            source: source.id,
            url,
            error: normalized.message,
            ...(typeof normalized.status === 'number' ? { status: normalized.status } : {}),
            ...context
          });
        }
      }

      log.warn('All free sources failed, falling back to direct fetch', {
        url,
        error: lastError?.message,
        ...context
      });
      return await this.fetchDirect(url, timeout);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildSourceOrder(): FreeSource[] {
    const start = this.nextSourceIndex % FREE_SOURCES.length;
    this.nextSourceIndex = (start + 1) % FREE_SOURCES.length;
    return [...FREE_SOURCES.slice(start), ...FREE_SOURCES.slice(0, start)];
  }

  private async fetchFromSource(source: FreeSource, url: string, signal: AbortSignal): Promise<string> {
    if (source.id === 'jina') {
      return this.fetchJinaPublic(url, signal, source.minIntervalMs);
    }
    return this.fetchFirecrawlKeyless(url, signal, source.minIntervalMs);
  }

  private async fetchJinaPublic(url: string, signal: AbortSignal, minIntervalMs: number): Promise<string> {
    await this.applyRateLimit('jina', minIntervalMs);

    const response = await fetch(`${JINA_READER_BASE_URL}${url}`, {
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        'X-Retain-Images': 'none',
        'X-Return-Format': 'markdown'
      },
      signal
    });

    if (!response.ok) {
      const error = new Error(`Public r.jina.ai failed: ${response.status} ${response.statusText}`) as HttpStatusError;
      error.status = response.status;
      throw error;
    }

    const text = await response.text();
    if (!text.trim()) {
      throw new Error('Public r.jina.ai returned empty content');
    }

    return text;
  }

  private async fetchFirecrawlKeyless(url: string, signal: AbortSignal, minIntervalMs: number): Promise<string> {
    await this.applyRateLimit('firecrawl', minIntervalMs);

    const response = await fetch(FIRECRAWL_SCRAPE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': DEFAULT_USER_AGENT
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true
      }),
      signal
    });

    if (!response.ok) {
      const error = new Error(`Firecrawl keyless scrape failed: ${response.status} ${response.statusText}`) as HttpStatusError;
      error.status = response.status;
      throw error;
    }

    const payload = await response.json() as {
      success?: boolean;
      data?: { markdown?: string };
      markdown?: string;
      error?: string;
    };

    const markdown = payload.data?.markdown ?? payload.markdown;
    if (!markdown || !markdown.trim()) {
      const detail = payload.error || 'empty markdown';
      throw new Error(`Firecrawl keyless scrape returned no content: ${detail}`);
    }

    return markdown;
  }

  private normalizeError(error: unknown, timeoutMs: number, source: string): HttpStatusError {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Error(`Request to ${source} timed out after ${timeoutMs / 1000} seconds.`);
    }

    return error instanceof Error ? error : new Error(String(error));
  }

  private async fetchDirect(url: string, timeout: number): Promise<string> {
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

  private isInCooldown(sourceId: FreeSourceId): boolean {
    return Date.now() < (this.cooldownUntil.get(sourceId) || 0);
  }

  private markCooldown(sourceId: FreeSourceId, durationMs: number): void {
    this.cooldownUntil.set(sourceId, Date.now() + durationMs);
  }

  private async applyRateLimit(sourceId: FreeSourceId, minIntervalMs: number): Promise<void> {
    const previous = this.rateLimitChains.get(sourceId) || Promise.resolve();
    const next = previous
      .catch(() => {})
      .then(async () => {
        const now = Date.now();
        const last = this.lastRequestTime.get(sourceId) || 0;
        const wait = Math.max(0, last + minIntervalMs - now);
        if (wait > 0) {
          await delay(wait);
        }
        this.lastRequestTime.set(sourceId, Date.now());
      });

    this.rateLimitChains.set(sourceId, next);
    return next;
  }
}
