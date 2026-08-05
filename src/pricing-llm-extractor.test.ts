import { afterEach, describe, expect, test } from 'bun:test';
import { PricingLlmExtractor } from './pricing-llm-extractor.ts';
import type { PricingConfig } from './pricing.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('PricingLlmExtractor', () => {
  test('parses detailed input prices and cache hit prices', async () => {
    mockLlmResponse({
      models: [
        {
          provider: 'Anthropic',
          model_name: 'Claude Opus 4.7',
          input_price_details: '$5 / MTok (Base Input), $6.25 / MTok (5m Cache Writes), $10 / MTok (1h Cache Writes)',
          cache_hit_price: '$0.50 / MTok (Cache Hits & Refreshes)',
          output_price: '$25 / MTok'
        },
        {
          provider: 'Google',
          model_name: 'gemini-3.1-pro-preview',
          input_price_details: '$2.00 / 1M (Base Input)',
          cache_hit_price: 'N/A',
          output_price: '$12.00 / 1M'
        },
        {
          provider: 'OpenAI',
          model_name: 'gpt-5.4',
          input_price_details: '$2.50 / 1M (Short context Input), $5.00 / 1M (Long context Input)',
          cache_hit_price: '$0.25 / 1M (Short context Cached Input), $0.50 / 1M (Long context Cached Input)',
          output_price: '$15.00 / 1M (Short context Output), $22.50 / 1M (Long context Output)'
        }
      ]
    });

    const extractor = new PricingLlmExtractor(createConfig());

    const models = await extractor.extractWithRetry('pricing page', 'Anthropic', {
      reason: 'test',
      forceRefresh: true
    });

    expect(models).toEqual([
      {
        name: 'Claude Opus 4.7',
        inputPrice: '$5 / MTok (Base Input)',
        inputPriceLines: [
          { text: '$5 / MTok (Base Input)' },
          { text: '$6.25 / MTok (5m Cache Writes)' },
          { text: '$10 / MTok (1h Cache Writes)' }
        ],
        cacheHitPrice: '$0.50 / MTok (Cache Hits & Refreshes)',
        cacheHitPriceLines: [
          { text: '$0.50 / MTok (Cache Hits & Refreshes)' }
        ],
        outputPrice: '$25 / MTok',
        outputPriceLines: [
          { text: '$25 / MTok' }
        ]
      },
      {
        name: 'gemini-3.1-pro-preview',
        inputPrice: '$2.00 / 1M (Base Input)',
        inputPriceLines: [
          { text: '$2.00 / 1M (Base Input)' }
        ],
        cacheHitPrice: 'N/A',
        cacheHitPriceLines: [
          { text: 'N/A' }
        ],
        outputPrice: '$12.00 / 1M',
        outputPriceLines: [
          { text: '$12.00 / 1M' }
        ]
      },
      {
        name: 'gpt-5.4',
        inputPrice: '$2.50 / 1M (Short context Input)',
        inputPriceLines: [
          { text: '$2.50 / 1M (Short context Input)' },
          { text: '$5.00 / 1M (Long context Input)' }
        ],
        cacheHitPrice: '$0.25 / 1M (Short context Cached Input)',
        cacheHitPriceLines: [
          { text: '$0.25 / 1M (Short context Cached Input)' },
          { text: '$0.50 / 1M (Long context Cached Input)' }
        ],
        outputPrice: '$15.00 / 1M (Short context Output)',
        outputPriceLines: [
          { text: '$15.00 / 1M (Short context Output)' },
          { text: '$22.50 / 1M (Long context Output)' }
        ]
      }
    ]);
  });

  test('keeps legacy numeric pricing responses compatible', async () => {
    mockLlmResponse({
      models: [
        {
          model_name: 'gpt-4o <-> gpt-4o-2024-11-20',
          input_price: 5,
          output_price: 15
        }
      ]
    });

    const extractor = new PricingLlmExtractor(createConfig());

    const models = await extractor.extractWithRetry('pricing page', 'OpenAI', {
      reason: 'test',
      forceRefresh: true
    });

    expect(models).toEqual([
      {
        name: 'gpt-4o<span class="model-alias">↳ gpt-4o-2024-11-20</span>',
        inputPrice: '$5.00',
        outputPrice: '$15.00'
      }
    ]);
  });
});

function mockLlmResponse(content: unknown): void {
  globalThis.fetch = (() => Promise.resolve(new Response(JSON.stringify({
    choices: [
      {
        message: {
          content: JSON.stringify(content)
        }
      }
    ]
  })))) as unknown as typeof fetch;
}

function createConfig(): PricingConfig {
  return {
    llmApiKey: 'llm-key',
    llmBaseUrl: 'https://example.com/chat/completions',
    llmModel: 'test-model',
    retryAttempts: 0,
    retryIntervalMinutes: 0,
    requestTimeoutSeconds: 1,
    providers: []
  };
}
