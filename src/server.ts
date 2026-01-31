import { loadConfig, Config } from './config.ts';
import { ProviderManager } from './providers.ts';
import { NotificationManager } from './notifications.ts';
import { ModelMonitor } from './monitor.ts';
import { IconManager } from './icons.ts';
import { PricingManager, PricingConfig, PricingProviderEvent } from './pricing.ts';
import { createCacheProvider, type CacheProvider, type CacheSnapshotV1 } from './cache-provider.ts';
import { log } from './logger.ts';
import { formatDate, getContentType, generateEmojiSvg } from './utils.ts';
import { DEFAULT_SERVER_PORT, ERROR_MESSAGES, TEMPLATE_PATHS } from './constants.ts';
import mustache from 'mustache';

class ModelSentryServer {
  private config!: Config;
  private providerManager!: ProviderManager;
  private notificationManager!: NotificationManager;
  private monitor!: ModelMonitor;
  private iconManager!: IconManager;
  private pricingManager!: PricingManager | null;
  private server!: any;
  private cacheSnapshot: CacheSnapshotV1 | null = null;
  private cacheProvider: CacheProvider = createCacheProvider('memory');
  private manualPricingRefreshCount = 0;
  private manualPricingRefreshCountByProvider: Map<string, number> = new Map();
  private manualPricingRefreshDateKey: string | null = null;
  private readonly MANUAL_PRICING_REFRESH_LIMIT = 2;

  async initialize(): Promise<void> {
    try {
      log.time('initialization');

      log.info('Loading configuration');
      this.config = await loadConfig();

      this.cacheProvider = createCacheProvider(
        this.config.cacheSettings?.backend || 'memory',
        this.config.cacheSettings?.filePath
      );
      this.cacheSnapshot = await this.cacheProvider.load();

      log.info('Initializing components', {
        providers: this.config.providers.length,
        notifications: this.config.notifications.length
      });

      this.providerManager = new ProviderManager(this.config.providers, this.cacheProvider);
      this.providerManager.applyCachedProviderStatuses(this.cacheSnapshot?.providers);
      this.notificationManager = new NotificationManager(this.config.notifications);
      this.iconManager = new IconManager(this.config.iconSettings!);

      if (this.config.pricingSettings?.enabled) {
        const pricingConfig: PricingConfig = {
          jinaApiKey: process.env[this.config.pricingSettings.jinaApiKeyEnvVar] || '',
          llmApiKey: process.env[this.config.pricingSettings.llmApiKeyEnvVar] || '',
          llmBaseUrl: this.config.pricingSettings.llmBaseUrl,
          llmModel: this.config.pricingSettings.llmModel,
          retryAttempts: this.config.pricingSettings.retryAttempts,
          retryIntervalMinutes: this.config.pricingSettings.retryIntervalMinutes,
          requestTimeoutSeconds: this.config.pricingSettings.requestTimeoutSeconds,
          providers: this.config.pricingSettings.providers
        };

        this.pricingManager = new PricingManager(
          pricingConfig,
          this.iconManager,
          this.cacheProvider,
          (event: PricingProviderEvent) => this.handlePricingProviderEvent(event)
        );
        this.pricingManager.applyCachedPricing(this.cacheSnapshot?.pricing);
        log.info('Pricing manager initialized', {
          providers: pricingConfig.providers.length,
          model: pricingConfig.llmModel,
          retryAttempts: pricingConfig.retryAttempts,
          retryInterval: `${pricingConfig.retryIntervalMinutes}min`
        });
      } else {
        this.pricingManager = null;
        log.info('Pricing feature disabled');
      }

      this.monitor = new ModelMonitor(
        this.config,
        this.providerManager,
        this.notificationManager,
        (change) => this.handleModelChangeForPricing(change)
      );

      await this.startServer();
      this.monitor.start();

      await this.sendStartupTestNotification();

      log.timeEnd('initialization');
      log.startup('ModelSentry initialized successfully');
    } catch (error) {
      log.error('Failed to initialize ModelSentry', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async startServer(): Promise<void> {
    const port = parseInt(process.env.PORT || String(DEFAULT_SERVER_PORT));

    try {
      this.server = Bun.serve({
        port,
        idleTimeout: 180,
        fetch: async (req: Request) => {
          const url = new URL(req.url);

          if (url.pathname === '/') {
            return await this.handleHomePage();
          } else if (url.pathname === '/pricing') {
            return await this.handlePricingPage();
          } else if (url.pathname.startsWith('/static/')) {
            return await this.handleStaticFile(url.pathname);
          } else if (url.pathname === '/api/status') {
            return await this.handleApiStatus();
          } else if (url.pathname === '/api/force-check') {
            return await this.handleForceCheck();
          } else if (url.pathname === '/api/pricing') {
            return await this.handleApiPricing();
          } else if (url.pathname === '/api/pricing/refresh' && req.method === 'POST') {
            return await this.handleApiPricingRefresh();
          } else if (url.pathname.startsWith('/api/pricing/refresh/') && req.method === 'POST') {
            const providerId = url.pathname.split('/').pop();
            return await this.handleApiPricingRefreshProvider(providerId || '');
          }

          return new Response('Not Found', { status: 404 });
        }
      });

      log.startup(`Server running on http://localhost:${port}`, { port });
    } catch (error) {
      throw new Error(ERROR_MESSAGES.PORT_IN_USE(port));
    }
  }

  private async handleHomePage(): Promise<Response> {
    try {
      const templateFile = Bun.file(TEMPLATE_PATHS.INDEX);
      let template = await templateFile.text();

      const status = this.monitor.getStatus();
      const templateData = this.buildTemplateData(status);

      const html = this.renderTemplate(template, templateData);

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    } catch (error) {
      log.error('Error rendering home page', error instanceof Error ? error.message : String(error));
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  private async handleStaticFile(pathname: string): Promise<Response> {
    try {
      const filePath = pathname.replace('/static/', 'static/');
      const file = Bun.file(filePath);

      if (await file.exists()) {
        const contentType = getContentType(filePath);
        return new Response(file, {
          headers: { 'Content-Type': contentType }
        });
      }

      if (pathname === '/static/favicon.ico') {
        const svg = generateEmojiSvg('🤗');
        return new Response(svg, {
          headers: { 'Content-Type': 'image/svg+xml' }
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      log.error('Error serving static file', error instanceof Error ? error.message : String(error), { pathname });
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  private async handleApiStatus(): Promise<Response> {
    try {
      const status = this.monitor.getStatus();
      return new Response(JSON.stringify(status), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      log.error('Error getting status', error instanceof Error ? error.message : String(error));
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  private async handleForceCheck(): Promise<Response> {
    try {
      await this.monitor.forceCheck();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      log.error('Error forcing check', error instanceof Error ? error.message : String(error));
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  private async handlePricingPage(): Promise<Response> {
    try {
      if (!this.pricingManager) {
        return new Response('Pricing feature is disabled', { status: 404 });
      }

      const isLoading = this.pricingManager.isCurrentlyLoading();
      const pricingData = await this.pricingManager.getPricingData();

      if (isLoading && pricingData.length === 0) {
        const templateFile = Bun.file(TEMPLATE_PATHS.PRICING_LOADING);
        const template = await templateFile.text();
        const templateData = this.buildPricingTemplateData([], true);
        const html = this.renderTemplate(template, templateData);
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      const templateFile = Bun.file(TEMPLATE_PATHS.PRICING);
      const template = await templateFile.text();
      const templateData = this.buildPricingTemplateData(pricingData, isLoading);

      const html = this.renderTemplate(template, templateData);

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    } catch (error) {
      log.error('Error rendering pricing page', error instanceof Error ? error.message : String(error));
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  private async handleApiPricing(): Promise<Response> {
    try {
      if (!this.pricingManager) {
        return new Response(JSON.stringify({ error: 'Pricing feature is disabled' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const pricingData = await this.pricingManager.getPricingData();
      return new Response(JSON.stringify(pricingData), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      log.error('Error getting pricing data', error instanceof Error ? error.message : String(error));
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  private async handleApiPricingRefresh(): Promise<Response> {
    try {
      if (!this.pricingManager) {
        return new Response(JSON.stringify({ error: 'Pricing feature is disabled' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const now = new Date();
      this.resetManualPricingRefreshCounter(now);
      let manualStatus = this.getManualRefreshStatus(now);

      if (this.pricingManager.isCurrentlyLoading()) {
        log.info('Manual pricing refresh skipped - pricing update already in progress', {
          remaining: manualStatus.remaining,
          resetAt: manualStatus.resetAt
        });
        return new Response(JSON.stringify({
          success: false,
          error: '价格刷新正在进行中，请稍后再试。',
          inProgress: true,
          manualRefresh: manualStatus
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (manualStatus.remaining <= 0) {
        log.info('Manual pricing refresh denied - daily limit reached', {
          limit: this.MANUAL_PRICING_REFRESH_LIMIT,
          resetAt: manualStatus.resetAt
        });
        return new Response(JSON.stringify({
          error: '今日刷新次数已达上限，请明天再试。',
          manualRefresh: manualStatus
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      this.manualPricingRefreshCount += 1;
      manualStatus = this.getManualRefreshStatus(now);
      log.info('Manual pricing refresh triggered', {
        count: this.manualPricingRefreshCount,
        remaining: manualStatus.remaining,
        resetAt: manualStatus.resetAt
      });

      const pricingData = await this.pricingManager.getPricingData({ forceRefresh: true, reason: 'manual-refresh' });
      return new Response(JSON.stringify({
        success: true,
        data: pricingData,
        manualRefresh: manualStatus
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      log.error('Error refreshing pricing data', error instanceof Error ? error.message : String(error));
      return new Response(JSON.stringify({
        error: 'Failed to refresh pricing data',
        manualRefresh: this.getManualRefreshStatus()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleApiPricingRefreshProvider(providerId: string): Promise<Response> {
    try {
      if (!this.pricingManager) {
        return new Response(JSON.stringify({ error: 'Pricing feature is disabled' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!providerId) {
        return new Response(JSON.stringify({ error: 'Provider ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const providerExists = this.config.pricingSettings?.providers.some(p => p.id === providerId);
      if (!providerExists) {
        return new Response(JSON.stringify({ error: `Provider '${providerId}' not found` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const now = new Date();
      this.resetManualPricingRefreshCounter(now);
      let manualStatus = this.getManualRefreshStatus(now, providerId);

      if (this.pricingManager.isCurrentlyLoading()) {
        log.info('Manual pricing refresh skipped - pricing update already in progress', {
          providerId,
          remaining: manualStatus.remaining,
          resetAt: manualStatus.resetAt
        });
        return new Response(JSON.stringify({
          success: false,
          error: '价格刷新正在进行中，请稍后再试。',
          inProgress: true,
          manualRefresh: manualStatus
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (manualStatus.remaining <= 0) {
        log.info('Manual pricing refresh denied - daily limit reached', {
          providerId,
          limit: this.MANUAL_PRICING_REFRESH_LIMIT,
          resetAt: manualStatus.resetAt
        });
        return new Response(JSON.stringify({
          error: `${providerId} 今日刷新次数已达上限，请明天再试。`,
          manualRefresh: manualStatus
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const currentCount = this.manualPricingRefreshCountByProvider.get(providerId) || 0;
      this.manualPricingRefreshCountByProvider.set(providerId, currentCount + 1);
      manualStatus = this.getManualRefreshStatus(now, providerId);
      log.info('Manual pricing refresh triggered for provider', {
        providerId,
        count: currentCount + 1,
        remaining: manualStatus.remaining,
        resetAt: manualStatus.resetAt
      });

      const pricingData = await this.pricingManager.refreshProviders([providerId], 'manual-refresh-provider');
      return new Response(JSON.stringify({
        success: true,
        data: pricingData,
        manualRefresh: manualStatus
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      log.error('Error refreshing provider pricing data', error instanceof Error ? error.message : String(error), { providerId });
      return new Response(JSON.stringify({
        error: 'Failed to refresh provider pricing data',
        manualRefresh: this.getManualRefreshStatus(new Date(), providerId)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private resetManualPricingRefreshCounter(now: Date): void {
    const todayKey = this.formatDateKey(now);
    if (this.manualPricingRefreshDateKey !== todayKey) {
      this.manualPricingRefreshCount = 0;
      this.manualPricingRefreshCountByProvider.clear();
      this.manualPricingRefreshDateKey = todayKey;
    }
  }

  private formatDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private getNextManualPricingResetDate(now: Date): Date {
    const reset = new Date(now);
    reset.setUTCHours(0, 0, 0, 0);
    reset.setUTCDate(reset.getUTCDate() + 1);
    return reset;
  }

  private getManualRefreshStatus(now: Date = new Date(), providerId?: string): {
    limit: number;
    remaining: number;
    resetAt: string;
    resetAtLocal: string;
  } {
    const resetDate = this.getNextManualPricingResetDate(now);
    let remaining: number;

    if (providerId) {
      const providerCount = this.manualPricingRefreshCountByProvider.get(providerId) || 0;
      remaining = Math.max(0, this.MANUAL_PRICING_REFRESH_LIMIT - providerCount);
    } else {
      remaining = Math.max(0, this.MANUAL_PRICING_REFRESH_LIMIT - this.manualPricingRefreshCount);
    }

    return {
      limit: this.MANUAL_PRICING_REFRESH_LIMIT,
      remaining,
      resetAt: resetDate.toISOString(),
      resetAtLocal: formatDate(resetDate)
    };
  }

  private buildTemplateData(status: any): any {
    const enabledProviders = status.providers.filter((p: any) => p.enabled);

    return {
      title: this.config.frontendSettings.title,
      faviconUrl: this.config.frontendSettings.faviconUrl || '/static/favicon.ico',
      backgroundCss: this.getBackgroundCss(),
      backgroundClass: this.config.frontendSettings.backgroundImageUrl ? '' : 'animated-bg',
      backgroundOpacity: this.config.frontendSettings.backgroundOpacity || 0.7,
      modelCopySeparator: this.config.frontendSettings.modelCopySeparator || ',',
      totalProviders: status.providers.length,
      enabledProviders: enabledProviders.length,
      pricingEnabled: !!this.pricingManager,
      providers: status.providers.map((provider: any) => {
        const providerConfig = this.config.providers.find(p => p.id === provider.id);

        const iconHtml = this.iconManager.generateIconHtml(provider.name, providerConfig?.icon);
        const iconUrl = this.iconManager.generateIconUrl(provider.name, providerConfig?.icon);

        const models = provider.enabled ? (provider.models || []) : [];

        return {
          ...provider,
          lastCheck: provider.lastCheck ? formatDate(provider.lastCheck) : null,
          lastSuccess: provider.lastSuccess ? formatDate(provider.lastSuccess) : null,
          nextRetryAt: provider.nextRetryAt ? formatDate(provider.nextRetryAt) : null,
          iconHtml,
          iconUrl,
          models: models.map((model: any) => ({
            ...model,
            id: provider.id,
            isNew: this.monitor.isNewModel(provider.id, model.name)
          })),
          modelCount: models.length
        };
      })
    };
  }

  private buildPricingTemplateData(pricingData: any[], isLoading: boolean): any {
    const now = new Date();
    return {
      title: this.config.frontendSettings.title,
      faviconUrl: this.config.frontendSettings.faviconUrl || '/static/favicon.ico',
      backgroundCss: this.getBackgroundCss(),
      backgroundClass: this.config.frontendSettings.backgroundImageUrl ? '' : 'animated-bg',
      backgroundOpacity: this.config.frontendSettings.backgroundOpacity || 0.7,
      isLoading: isLoading,
      manualRefresh: this.getManualRefreshStatus(now),
      providers: pricingData.map((provider: any) => {
        this.resetManualPricingRefreshCounter(now);
        const providerRefreshStatus = this.getManualRefreshStatus(now, provider.id);

        return {
          ...provider,
          lastUpdated: provider.lastUpdated instanceof Date && provider.lastUpdated.getTime() === 0
            ? '从未更新'
            : formatDate(provider.lastUpdated),
          refreshStatus: providerRefreshStatus,
          models: (provider.models || []).map((model: any) => ({
            ...model,
            pricingUrl: provider.pricingUrl
          }))
        };
      })
    };
  }

  private getBackgroundCss(): string {
    if (this.config.frontendSettings.backgroundImageUrl) {
      return `url('${this.config.frontendSettings.backgroundImageUrl}')`;
    }
    return 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)';
  }

  private renderTemplate(template: string, data: any): string {
    return mustache.render(template, data);
  }

  private async handlePricingProviderEvent(event: PricingProviderEvent): Promise<void> {
    if (event.type !== 'error') return;

    const change = {
      providerId: `pricing:${event.providerId}`,
      providerName: `价格 - ${event.providerName}`,
      added: [],
      removed: [],
      error: `${event.error}\nURL: ${event.pricingUrl}\nReason: ${event.reason || 'unknown'}`
    };

    await this.notificationManager.sendNotifications(change);
  }

  private async handleModelChangeForPricing(change: { providerId: string; providerName: string; added: any[]; removed: any[] }): Promise<void> {
    if (!this.pricingManager) return;
    if (!this.config.pricingSettings?.enabled) return;
    if (change.added.length === 0 && change.removed.length === 0) return;

    const mappedPricingProviders = this.config.pricingSettings.providers
      .filter(p => p.id === change.providerId)
      .map(p => p.id);

    if (mappedPricingProviders.length === 0) return;

    log.info('Refreshing pricing due to model change', {
      providerId: change.providerId,
      pricingProviders: mappedPricingProviders.join(', ')
    });

    await this.pricingManager.refreshProviders(mappedPricingProviders, 'model-change');
  }


  private async sendStartupTestNotification(): Promise<void> {
    try {
      const welcomeChange = {
        providerId: 'system',
        providerName: 'ModelSentry 系统',
        added: [{ name: '🎉 ModelSentry 已成功启动！欢迎使用模型监控服务', id: 'startup-test' }],
        removed: [],
        error: undefined
      };

      log.info('Sending startup test notification');
      await this.notificationManager.sendStartupNotification(welcomeChange);
      log.info('Startup test notification sent successfully');
    } catch (error) {
      log.warn('Failed to send startup test notification', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async shutdown(): Promise<void> {
    log.shutdown('Shutting down ModelSentry');

    if (this.monitor) {
      this.monitor.stop();
    }

    if (this.server) {
      this.server.stop();
    }

    log.shutdown('ModelSentry shutdown complete');
  }
}

const server = new ModelSentryServer();

process.on('SIGINT', async () => {
  await server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.shutdown();
  process.exit(0);
});

server.initialize().catch(error => {
  log.error('Failed to start ModelSentry', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
