import { fileExists, readJsonFile, getEnvVar } from './utils.ts';
import {
  CONFIG_PATHS,
  DEFAULT_CACHE_SETTINGS,
  DEFAULT_FRONTEND_SETTINGS,
  DEFAULT_ICON_SETTINGS,
  ERROR_MESSAGES
} from './constants.ts';

export interface AuthConfig {
  type: 'header' | 'query' | 'custom_headers';
  headerName?: string;
  valuePrefix?: string;
  keyParamName?: string;
  apiKeyEnvVar?: string;
  customHeaders?: Record<string, { envVar?: string; value?: string }>;
}

export interface ParsingConfig {
  modelListPath?: string;
  modelNamePath: string;
  modelNameRegex?: string;
}

export interface IconConfig {
  slug?: string;
  format?: 'svg' | 'png' | 'webp';
  theme?: 'light' | 'dark';
  size?: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  url: string;
  method: string;
  auth: AuthConfig;
  parsing: ParsingConfig;
  icon?: IconConfig;
}

export interface NotificationConfig {
  id: string;
  enabled: boolean;
  type: string;
  webhookUrlEnvVar: string;
  triggerOn: string[];
  requestBodyTemplate: any;
  templateEnvVars?: Record<string, string>;
}

export interface GlobalIconSettings {
  enabled: boolean;
  cdnSource: 'unpkg' | 'npmmirror';
  format: 'svg' | 'png' | 'webp';
  theme: 'light' | 'dark';
  size: number;
  fallbackIcon: string;
}

export interface FrontendSettings {
  title: string;
  faviconUrl?: string;
  backgroundImageUrl?: string;
  backgroundOpacity?: number;
  modelCopySeparator?: string;
}

export interface CacheSettings {
  backend: 'memory' | 'file';
  filePath?: string;
}

export interface PricingProviderConfig {
  id: string;
  name: string;
  pricingUrl: string;
}

export interface PricingSettings {
  enabled: boolean;
  jinaApiKeyEnvVar: string;
  llmApiKeyEnvVar: string;
  llmBaseUrl: string;
  llmBaseUrlEnvVar?: string;
  llmModel: string;
  llmModelEnvVar?: string;
  retryAttempts: number;
  retryIntervalMinutes: number;
  requestTimeoutSeconds?: number;
  providers: PricingProviderConfig[];
}

export interface Config {
  checkIntervalSeconds: number;
  notifications: NotificationConfig[];
  frontendSettings: FrontendSettings;
  iconSettings?: GlobalIconSettings;
  pricingSettings?: PricingSettings;
  cacheSettings?: CacheSettings;
  providers: ProviderConfig[];
}

export async function loadConfig(): Promise<Config> {
  const useSplitConfig = await fileExists(CONFIG_PATHS.CORE);

  if (useSplitConfig) {
    return await loadSplitConfig();
  } else {
    return await loadLegacyConfig();
  }
}

async function loadSplitConfig(): Promise<Config> {
  const [coreConfig, providersConfig, notificationsConfig, pricingConfig] = await Promise.all([
    readJsonFile(CONFIG_PATHS.CORE),
    readJsonFile(CONFIG_PATHS.PROVIDERS),
    readJsonFile(CONFIG_PATHS.NOTIFICATIONS),
    readJsonFile(CONFIG_PATHS.PRICING)
  ]);

  const config: Config = {
    checkIntervalSeconds: coreConfig.checkIntervalSeconds,
    frontendSettings: coreConfig.frontendSettings,
    iconSettings: coreConfig.iconSettings,
    cacheSettings: coreConfig.cacheSettings,
    providers: providersConfig.providers || [],
    notifications: notificationsConfig.notifications || [],
    pricingSettings: pricingConfig.pricingSettings
  };

  return processConfig(config);
}

async function loadLegacyConfig(): Promise<Config> {
  const config = await readJsonFile<Config>(CONFIG_PATHS.LEGACY);
  return processConfig(config);
}

function processConfig(config: Config): Config {
  if (!config.checkIntervalSeconds || config.checkIntervalSeconds < 60) {
    throw new Error(ERROR_MESSAGES.INVALID_CHECK_INTERVAL);
  }

  if (!config.providers || config.providers.length === 0) {
    throw new Error(ERROR_MESSAGES.NO_PROVIDERS);
  }

  config.providers = validateAndFilterProviders(config.providers);

  config.notifications = validateAndFilterNotifications(config.notifications || []);

  config.frontendSettings = {
    ...DEFAULT_FRONTEND_SETTINGS,
    ...config.frontendSettings
  };

  config.iconSettings = {
    ...DEFAULT_ICON_SETTINGS,
    ...config.iconSettings
  };

  config.cacheSettings = {
    ...DEFAULT_CACHE_SETTINGS,
    ...config.cacheSettings
  };

  if (config.pricingSettings) {
    config.pricingSettings = processPricingSettings(config.pricingSettings);
  }

  return config;
}

function processPricingSettings(settings: PricingSettings): PricingSettings {
  const defaults = {
    enabled: false,
    jinaApiKeyEnvVar: 'JINA_API_KEY',
    llmApiKeyEnvVar: 'OPENAI_API_KEY',
    llmBaseUrl: 'https://api.openai.com/v1/chat/completions',
    llmBaseUrlEnvVar: 'LLM_BASE_URL',
    llmModel: 'gpt-3.5-turbo',
    llmModelEnvVar: 'LLM_MODEL',
    retryAttempts: 3,
    retryIntervalMinutes: 1,
    providers: []
  };

  const merged = { ...defaults, ...settings };

  if (merged.enabled) {
    if (merged.llmBaseUrlEnvVar) {
      const baseUrlFromEnv = getEnvVar(merged.llmBaseUrlEnvVar);
      if (baseUrlFromEnv) {
        merged.llmBaseUrl = baseUrlFromEnv;
      }
    }
    if (merged.llmModelEnvVar) {
      const modelFromEnv = getEnvVar(merged.llmModelEnvVar);
      if (modelFromEnv) {
        merged.llmModel = modelFromEnv;
      }
    }

    return validateAndFilterPricing(merged);
  }

  return merged;
}

function validateAndFilterProviders(providers: ProviderConfig[]): ProviderConfig[] {
  const validatedProviders: ProviderConfig[] = [];

  for (const provider of providers) {
    if (!provider.enabled) {
      validatedProviders.push(provider);
      continue;
    }

    const hasValidEnvVars = validateProviderEnvironmentVariables(provider);

    if (!hasValidEnvVars) {
      console.warn(`⚠️  Provider '${provider.name}' (${provider.id}) is enabled but missing required environment variables. Auto-disabling.`, {
        providerId: provider.id,
        requiredEnvVars: getRequiredEnvVarsForProvider(provider)
      });

      validatedProviders.push({
        ...provider,
        enabled: false
      });
    } else {
      validatedProviders.push(provider);
    }
  }

  return validatedProviders;
}

function validateAndFilterNotifications(notifications: NotificationConfig[]): NotificationConfig[] {
  const validatedNotifications: NotificationConfig[] = [];

  for (const notification of notifications) {
    if (!notification.enabled) {
      validatedNotifications.push(notification);
      continue;
    }

    const webhookUrl = getEnvVar(notification.webhookUrlEnvVar);

    if (!webhookUrl || webhookUrl.trim().length === 0) {
      console.warn(`⚠️  Notification '${notification.id}' is enabled but missing webhook URL environment variable '${notification.webhookUrlEnvVar}'. Auto-disabling.`, {
        notificationId: notification.id,
        envVar: notification.webhookUrlEnvVar
      });

      validatedNotifications.push({
        ...notification,
        enabled: false
      });
    } else {
      if (notification.templateEnvVars) {
        const missingTemplateVars = Object.entries(notification.templateEnvVars)
          .filter(([, envVar]) => {
            const value = getEnvVar(envVar);
            return !value || value.trim().length === 0;
          })
          .map(([templateKey, envVar]) => `${templateKey} (${envVar})`);

        if (missingTemplateVars.length > 0) {
          console.warn(`ℹ️  Notification '${notification.id}' has template variables without values. Placeholders will render empty.`, {
            notificationId: notification.id,
            placeholders: missingTemplateVars
          });
        }
      }

      validatedNotifications.push(notification);
    }
  }

  return validatedNotifications;
}

function validateProviderEnvironmentVariables(provider: ProviderConfig): boolean {
  if (provider.auth.type === 'header' || provider.auth.type === 'query') {
    const apiKey = getEnvVar(provider.auth.apiKeyEnvVar || '');
    return !!apiKey && apiKey.trim().length > 0;
  } else if (provider.auth.type === 'custom_headers' && provider.auth.customHeaders) {
    for (const [headerName, headerConfig] of Object.entries(provider.auth.customHeaders)) {
      if (headerConfig.envVar) {
        const value = getEnvVar(headerConfig.envVar);
        if (value && value.trim().length > 0) {
          return true;
        }
      } else if (headerConfig.value && headerConfig.value.trim().length > 0) {
        return true;
      }
    }
    return false;
  }
  return true;
}

function getRequiredEnvVarsForProvider(provider: ProviderConfig): string[] {
  const envVars: string[] = [];

  if (provider.auth.type === 'header' || provider.auth.type === 'query') {
    if (provider.auth.apiKeyEnvVar) {
      envVars.push(provider.auth.apiKeyEnvVar);
    }
  } else if (provider.auth.type === 'custom_headers' && provider.auth.customHeaders) {
    for (const [headerName, headerConfig] of Object.entries(provider.auth.customHeaders)) {
      if (headerConfig.envVar) {
        envVars.push(headerConfig.envVar);
      }
    }
  }

  return envVars;
}

function validateAndFilterPricing(pricingSettings: PricingSettings): PricingSettings {
  const jinaApiKey = getEnvVar(pricingSettings.jinaApiKeyEnvVar);
  const llmApiKey = getEnvVar(pricingSettings.llmApiKeyEnvVar);

  if (!jinaApiKey || jinaApiKey.trim().length === 0) {
    console.warn(`⚠️  Pricing feature is enabled but missing Jina API key environment variable '${pricingSettings.jinaApiKeyEnvVar}'. Auto-disabling.`);
    return { ...pricingSettings, enabled: false };
  }

  if (!llmApiKey || llmApiKey.trim().length === 0) {
    console.warn(`⚠️  Pricing feature is enabled but missing LLM API key environment variable '${pricingSettings.llmApiKeyEnvVar}'. Auto-disabling.`);
    return { ...pricingSettings, enabled: false };
  }

  return pricingSettings;
}

export { getEnvVar };
