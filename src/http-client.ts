import { log } from './logger.ts';
import { sanitizeUrl } from './utils.ts';
import { DEFAULT_USER_AGENT, DEFAULT_CONTENT_TYPE, ERROR_MESSAGES } from './constants.ts';

export interface HttpClientOptions {
  headers?: Record<string, string>;
  method?: string;
  body?: string;
  timeoutMs?: number;
}

export class HttpClient {
  private defaultHeaders: Record<string, string>;

  constructor(defaultHeaders: Record<string, string> = {}) {
    this.defaultHeaders = {
      'Content-Type': DEFAULT_CONTENT_TYPE,
      'User-Agent': DEFAULT_USER_AGENT,
      ...defaultHeaders
    };
  }

  async fetch(url: string, options: HttpClientOptions = {}): Promise<Response> {
    const headers = { ...this.defaultHeaders, ...options.headers };
    const method = options.method || 'GET';
    const timeoutMs = options.timeoutMs || 30000;

    log.request(`HTTP ${method}`, {
      url: sanitizeUrl(url),
      timeout: `${timeoutMs}ms`
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.body,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.HTTP_ERROR(response.status, response.statusText));
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR(timeoutMs / 1000));
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async fetchJson<T = any>(url: string, options: HttpClientOptions = {}): Promise<T> {
    const response = await this.fetch(url, options);
    return await response.json();
  }
}
