import { afterEach, describe, expect, test } from 'bun:test';
import { PricingWebFetcher } from './pricing-web-fetcher.ts';
import type { PricingConfig } from './pricing.ts';
import { FIRECRAWL_SCRAPE_URL, JINA_READER_BASE_URL } from './constants.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function createConfig(overrides: Partial<PricingConfig> = {}): PricingConfig {
  return {
    llmApiKey: 'llm-key',
    llmBaseUrl: 'https://example.com/chat/completions',
    llmModel: 'test-model',
    retryAttempts: 0,
    retryIntervalMinutes: 0,
    requestTimeoutSeconds: 5,
    providers: [],
    ...overrides
  };
}

function mockFetchSequence(handlers: Array<(url: string, init?: RequestInit) => Promise<Response> | Response>): void {
  let call = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const handler = handlers[Math.min(call, handlers.length - 1)];
    call += 1;
    return handler(url, init);
  }) as typeof fetch;
}

describe('PricingWebFetcher', () => {
  test('uses public jina reader without api key', async () => {
    const targetUrl = 'https://example.com/pricing';
    let seenUrl = '';

    mockFetchSequence([
      (url) => {
        seenUrl = url;
        return new Response('# Pricing\n\n$1', { status: 200 });
      }
    ]);

    const fetcher = new PricingWebFetcher(createConfig());
    const content = await fetcher.fetchWithRetry(targetUrl, { reason: 'test', forceRefresh: true });

    expect(content).toBe('# Pricing\n\n$1');
    expect(seenUrl).toBe(`${JINA_READER_BASE_URL}${targetUrl}`);
  });

  test('falls back to firecrawl keyless when jina is rate limited', async () => {
    const targetUrl = 'https://example.com/pricing';
    const calls: string[] = [];

    mockFetchSequence([
      (url) => {
        calls.push(url);
        return new Response('rate limited', { status: 429, statusText: 'Too Many Requests' });
      },
      (url, init) => {
        calls.push(url);
        expect(init?.method).toBe('POST');
        expect(init?.headers).not.toHaveProperty('Authorization');
        return new Response(JSON.stringify({
          success: true,
          data: { markdown: '# From Firecrawl' }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    ]);

    const fetcher = new PricingWebFetcher(createConfig());
    const content = await fetcher.fetchWithRetry(targetUrl, { reason: 'test', forceRefresh: true });

    expect(content).toBe('# From Firecrawl');
    expect(calls[0]).toBe(`${JINA_READER_BASE_URL}${targetUrl}`);
    expect(calls[1]).toBe(FIRECRAWL_SCRAPE_URL);
  });

  test('round-robins free sources across successive requests', async () => {
    const targetUrl = 'https://example.com/pricing';
    const sources: string[] = [];

    mockFetchSequence([
      (url) => {
        sources.push(url.startsWith(JINA_READER_BASE_URL) ? 'jina' : url === FIRECRAWL_SCRAPE_URL ? 'firecrawl' : 'other');
        if (url.startsWith(JINA_READER_BASE_URL)) {
          return new Response('# jina-1', { status: 200 });
        }
        return new Response(JSON.stringify({ success: true, data: { markdown: '# fc-1' } }), { status: 200 });
      },
      (url) => {
        sources.push(url.startsWith(JINA_READER_BASE_URL) ? 'jina' : url === FIRECRAWL_SCRAPE_URL ? 'firecrawl' : 'other');
        if (url === FIRECRAWL_SCRAPE_URL) {
          return new Response(JSON.stringify({ success: true, data: { markdown: '# fc-2' } }), { status: 200 });
        }
        return new Response('# jina-2', { status: 200 });
      }
    ]);

    const fetcher = new PricingWebFetcher(createConfig());
    const first = await fetcher.fetchWithRetry(targetUrl, { reason: 'test', forceRefresh: true });
    const second = await fetcher.fetchWithRetry(targetUrl, { reason: 'test', forceRefresh: true });

    expect(first).toBe('# jina-1');
    expect(second).toBe('# fc-2');
    expect(sources).toEqual(['jina', 'firecrawl']);
  });

  test('falls back to direct fetch when free sources fail', async () => {
    const targetUrl = 'https://example.com/pricing';
    const calls: string[] = [];

    mockFetchSequence([
      (url) => {
        calls.push(url);
        return new Response('jina down', { status: 503 });
      },
      (url) => {
        calls.push(url);
        return new Response('firecrawl down', { status: 503 });
      },
      (url) => {
        calls.push(url);
        return new Response('<html>direct</html>', { status: 200 });
      }
    ]);

    const fetcher = new PricingWebFetcher(createConfig());
    const content = await fetcher.fetchWithRetry(targetUrl, { reason: 'test', forceRefresh: true });

    expect(content).toBe('<html>direct</html>');
    expect(calls).toEqual([
      `${JINA_READER_BASE_URL}${targetUrl}`,
      FIRECRAWL_SCRAPE_URL,
      targetUrl
    ]);
  });
});
