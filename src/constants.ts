export const DEFAULT_CHECK_INTERVAL_SECONDS = 1800;
export const DEFAULT_RETRY_COUNT = 2;
export const DEFAULT_RETRY_INTERVAL_MS = 2 * 60 * 1000;
export const GRACE_PERIOD_MS = 2 * 60 * 1000;
export const NEW_MODEL_HIGHLIGHT_HOURS = 24;

export const DEFAULT_USER_AGENT = 'ModelSentry/1.0';
export const DEFAULT_CONTENT_TYPE = 'application/json';

export const DEFAULT_SERVER_PORT = 3000;

export const JINA_READER_BASE_URL = 'https://r.jina.ai/';

export const DEFAULT_ICON_SETTINGS = {
  enabled: true,
  cdnSource: 'npmmirror' as const,
  format: 'svg' as const,
  theme: 'light' as const,
  size: 32,
  fallbackIcon: 'openai',
} as const;

export const DEFAULT_FRONTEND_SETTINGS = {
  title: 'ModelSentry - AI 模型监控',
  faviconUrl: '/static/favicon.ico',
  backgroundImageUrl: '/static/background.jpg',
  backgroundOpacity: 0.7,
  modelCopySeparator: ',',
} as const;

export const DEFAULT_CACHE_SETTINGS = {
  backend: 'memory' as const,
  filePath: 'data/modelsentry-cache.json',
} as const;

export const ERROR_MESSAGES = {
  INVALID_CHECK_INTERVAL: 'checkIntervalSeconds must be at least 60 seconds',
  NO_PROVIDERS: 'At least one provider must be configured',
  PROVIDER_NOT_FOUND: (id: string) => `Provider ${id} not found or disabled`,
  RETRY_COOLDOWN: (seconds: number) => `Retry cooldown active, next retry in ${seconds}s`,
  HTTP_ERROR: (status: number, statusText: string) => `HTTP ${status}: ${statusText}`,
  PARSE_ERROR: (error: string) => `Failed to parse models: ${error}`,
  TIMEOUT_ERROR: (seconds: number) => `Request timed out after ${seconds} seconds`,
  PORT_IN_USE: (port: number) => `Failed to start server. Is port ${port} in use?`,
} as const;

export const CONFIG_PATHS = {
  CORE: 'config/config.json',
  PROVIDERS: 'config/providers.json',
  NOTIFICATIONS: 'config/notifications.json',
  PRICING: 'config/pricing.json',
  LEGACY: 'config.json',
} as const;

export const TEMPLATE_PATHS = {
  INDEX: 'src/templates/index.html',
  PRICING: 'src/templates/pricing.html',
  PRICING_LOADING: 'src/templates/pricing-loading.html',
} as const;
