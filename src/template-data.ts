import { Config } from './config.ts';
import { IconManager } from './icons.ts';
import { ProviderStatus } from './providers.ts';
import { ProviderPricing } from './pricing.ts';
import { formatDate } from './utils.ts';
import type { ManualRefreshStatus } from './manual-refresh-limiter.ts';

interface MonitorStatus {
  providers: ProviderStatus[];
}

export function buildHomeTemplateData(
  config: Config,
  iconManager: IconManager,
  status: MonitorStatus,
  pricingEnabled: boolean,
  isNewModel: (providerId: string, modelName: string) => boolean
): unknown {
  const enabledProviders = status.providers.filter((provider) => provider.enabled);

  return {
    title: config.frontendSettings.title,
    faviconUrl: config.frontendSettings.faviconUrl || '/static/favicon.ico',
    backgroundCss: getBackgroundCss(config),
    backgroundClass: config.frontendSettings.backgroundImageUrl ? '' : 'animated-bg',
    backgroundOpacity: config.frontendSettings.backgroundOpacity || 0.7,
    modelCopySeparator: config.frontendSettings.modelCopySeparator || ',',
    totalProviders: status.providers.length,
    enabledProviders: enabledProviders.length,
    pricingEnabled,
    providers: status.providers.map((provider) => {
      const providerConfig = config.providers.find((item) => item.id === provider.id);
      const iconHtml = iconManager.generateIconHtml(provider.name, providerConfig?.icon);
      const iconUrl = iconManager.generateIconUrl(provider.name, providerConfig?.icon);
      const models = provider.enabled ? provider.models || [] : [];

      return {
        ...provider,
        lastCheck: provider.lastCheck ? formatDate(provider.lastCheck) : null,
        lastSuccess: provider.lastSuccess ? formatDate(provider.lastSuccess) : null,
        nextRetryAt: provider.nextRetryAt ? formatDate(provider.nextRetryAt) : null,
        iconHtml,
        iconUrl,
        models: models.map((model) => ({
          ...model,
          id: provider.id,
          isNew: isNewModel(provider.id, model.name)
        })),
        modelCount: models.length
      };
    })
  };
}

export function buildPricingTemplateData(
  config: Config,
  pricingData: ProviderPricing[],
  isLoading: boolean,
  getManualRefreshStatus: (providerId?: string, now?: Date) => ManualRefreshStatus
): unknown {
  const now = new Date();

  return {
    title: config.frontendSettings.title,
    faviconUrl: config.frontendSettings.faviconUrl || '/static/favicon.ico',
    backgroundCss: getBackgroundCss(config),
    backgroundClass: config.frontendSettings.backgroundImageUrl ? '' : 'animated-bg',
    backgroundOpacity: config.frontendSettings.backgroundOpacity || 0.7,
    isLoading,
    manualRefresh: getManualRefreshStatus(undefined, now),
    providers: pricingData.map((provider) => ({
      ...provider,
      lastUpdated: provider.lastUpdated instanceof Date && provider.lastUpdated.getTime() === 0
        ? '从未更新'
        : formatDate(provider.lastUpdated),
      refreshStatus: getManualRefreshStatus(provider.id, now),
      models: (provider.models || []).map((model) => ({
        ...model,
        pricingUrl: provider.pricingUrl
      }))
    }))
  };
}

function getBackgroundCss(config: Config): string {
  if (config.frontendSettings.backgroundImageUrl) {
    return `url('${config.frontendSettings.backgroundImageUrl}')`;
  }
  return 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)';
}
