import { loadConfig, Config } from './config.ts';
import { ProviderManager } from './providers.ts';
import { NotificationManager, type ModelChange } from './notifications.ts';
import { ModelMonitor } from './monitor.ts';
import { IconManager } from './icons.ts';
import { PricingManager, PricingConfig, PricingProviderEvent, type ProviderPricing } from './pricing.ts';
import { createCacheProvider, type CacheProvider } from './cache-provider.ts';
import { ManualRefreshLimiter } from './manual-refresh-limiter.ts';
import { buildHomeTemplateData, buildPricingTemplateData } from './template-data.ts';
import { htmlResponse, internalServerError, jsonResponse, textResponse } from './http-responses.ts';
import { log } from './logger.ts';
import { getContentType, generateEmojiSvg } from './utils.ts';
import { DEFAULT_SERVER_PORT, ERROR_MESSAGES, TEMPLATE_PATHS } from './constants.ts';
import mustache from 'mustache';

class ModelSentryServer {
  private config!: Config;
  private providerManager!: ProviderManager;
  private notificationManager!: NotificationManager;
  private monitor!: ModelMonitor;
  private iconManager!: IconManager;
  private pricingManager!: PricingManager | null;
  private server!: ReturnType<typeof Bun.serve>;
  private cacheProvider: CacheProvider = createCacheProvider('memory');
  private manualRefreshLimiter = new ManualRefreshLimiter(2);

  async initialize(): Promise<void> {
    try {
      log.time('initialization');

      log.info('Loading configuration');
      this.config = await loadConfig();

      this.cacheProvider = createCacheProvider(
        this.config.cacheSettings?.backend || 'memory',
        this.config.cacheSettings?.filePath
      );
      const cacheSnapshot = await this.cacheProvider.load();

      log.info('Initializing components', {
        providers: this.config.providers.length,
        notifications: this.config.notifications.length
      });

      this.providerManager = new ProviderManager(this.config.providers, this.cacheProvider);
      this.providerManager.applyCachedProviderStatuses(cacheSnapshot.providers);
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
        this.pricingManager.applyCachedPricing(cacheSnapshot.pricing);
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

          return textResponse('Not Found', 404);
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
      const template = await templateFile.text();

      const status = this.monitor.getStatus();
      const templateData = buildHomeTemplateData(
        this.config,
        this.iconManager,
        status,
        !!this.pricingManager,
        (providerId, modelName) => this.monitor.isNewModel(providerId, modelName)
      );

      const html = this.renderTemplate(template, templateData);

      return htmlResponse(html);
    } catch (error) {
      log.error('Error rendering home page', error instanceof Error ? error.message : String(error));
      return internalServerError();
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

      return textResponse('Not Found', 404);
    } catch (error) {
      log.error('Error serving static file', error instanceof Error ? error.message : String(error), { pathname });
      return internalServerError();
    }
  }

  private async handleApiStatus(): Promise<Response> {
    try {
      const status = this.monitor.getStatus();
      return jsonResponse(status);
    } catch (error) {
      log.error('Error getting status', error instanceof Error ? error.message : String(error));
      return internalServerError();
    }
  }

  private async handleForceCheck(): Promise<Response> {
    try {
      await this.monitor.forceCheck();
      return jsonResponse({ success: true });
    } catch (error) {
      log.error('Error forcing check', error instanceof Error ? error.message : String(error));
      return internalServerError();
    }
  }

  private async handlePricingPage(): Promise<Response> {
    try {
      if (!this.pricingManager) {
        return textResponse('Pricing feature is disabled', 404);
      }

      const isLoading = this.pricingManager.isCurrentlyLoading();
      const pricingData = await this.pricingManager.getPricingData();

      if (isLoading && pricingData.length === 0) {
        const templateFile = Bun.file(TEMPLATE_PATHS.PRICING_LOADING);
        const template = await templateFile.text();
        const templateData = this.buildPricingTemplateData([], true);
        const html = this.renderTemplate(template, templateData);
        return htmlResponse(html);
      }

      const templateFile = Bun.file(TEMPLATE_PATHS.PRICING);
      const template = await templateFile.text();
      const templateData = this.buildPricingTemplateData(pricingData, isLoading);

      const html = this.renderTemplate(template, templateData);

      return htmlResponse(html);
    } catch (error) {
      log.error('Error rendering pricing page', error instanceof Error ? error.message : String(error));
      return internalServerError();
    }
  }

  private async handleApiPricing(): Promise<Response> {
    try {
      if (!this.pricingManager) {
        return jsonResponse({ error: 'Pricing feature is disabled' }, 404);
      }

      const pricingData = await this.pricingManager.getPricingData();
      return jsonResponse(pricingData);
    } catch (error) {
      log.error('Error getting pricing data', error instanceof Error ? error.message : String(error));
      return internalServerError();
    }
  }

  private async handleApiPricingRefresh(): Promise<Response> {
    try {
      if (!this.pricingManager) {
        return jsonResponse({ error: 'Pricing feature is disabled' }, 404);
      }

      const now = new Date();
      let manualStatus = this.manualRefreshLimiter.getStatus(now);

      if (this.pricingManager.isCurrentlyLoading()) {
        log.info('Manual pricing refresh skipped - pricing update already in progress', {
          remaining: manualStatus.remaining,
          resetAt: manualStatus.resetAt
        });
        return jsonResponse({
          success: false,
          error: '价格刷新正在进行中，请稍后再试。',
          inProgress: true,
          manualRefresh: manualStatus
        }, 202);
      }

      if (manualStatus.remaining <= 0) {
        log.info('Manual pricing refresh denied - daily limit reached', {
          limit: manualStatus.limit,
          resetAt: manualStatus.resetAt
        });
        return jsonResponse({
          error: '今日刷新次数已达上限，请明天再试。',
          manualRefresh: manualStatus
        }, 429);
      }

      manualStatus = this.manualRefreshLimiter.consume(now);
      log.info('Manual pricing refresh triggered', {
        remaining: manualStatus.remaining,
        resetAt: manualStatus.resetAt
      });

      const pricingData = await this.pricingManager.getPricingData({ forceRefresh: true, reason: 'manual-refresh' });
      return jsonResponse({
        success: true,
        data: pricingData,
        manualRefresh: manualStatus
      });
    } catch (error) {
      log.error('Error refreshing pricing data', error instanceof Error ? error.message : String(error));
      return jsonResponse({
        error: 'Failed to refresh pricing data',
        manualRefresh: this.manualRefreshLimiter.getStatus()
      }, 500);
    }
  }

  private async handleApiPricingRefreshProvider(providerId: string): Promise<Response> {
    try {
      if (!this.pricingManager) {
        return jsonResponse({ error: 'Pricing feature is disabled' }, 404);
      }

      if (!providerId) {
        return jsonResponse({ error: 'Provider ID is required' }, 400);
      }

      const providerExists = this.config.pricingSettings?.providers.some(p => p.id === providerId);
      if (!providerExists) {
        return jsonResponse({ error: `Provider '${providerId}' not found` }, 404);
      }

      const now = new Date();
      let manualStatus = this.manualRefreshLimiter.getStatus(now, providerId);

      if (this.pricingManager.isCurrentlyLoading()) {
        log.info('Manual pricing refresh skipped - pricing update already in progress', {
          providerId,
          remaining: manualStatus.remaining,
          resetAt: manualStatus.resetAt
        });
        return jsonResponse({
          success: false,
          error: '价格刷新正在进行中，请稍后再试。',
          inProgress: true,
          manualRefresh: manualStatus
        }, 202);
      }

      if (manualStatus.remaining <= 0) {
        log.info('Manual pricing refresh denied - daily limit reached', {
          providerId,
          limit: manualStatus.limit,
          resetAt: manualStatus.resetAt
        });
        return jsonResponse({
          error: `${providerId} 今日刷新次数已达上限，请明天再试。`,
          manualRefresh: manualStatus
        }, 429);
      }

      manualStatus = this.manualRefreshLimiter.consume(now, providerId);
      log.info('Manual pricing refresh triggered for provider', {
        providerId,
        remaining: manualStatus.remaining,
        resetAt: manualStatus.resetAt
      });

      const pricingData = await this.pricingManager.refreshProviders([providerId], 'manual-refresh-provider');
      return jsonResponse({
        success: true,
        data: pricingData,
        manualRefresh: manualStatus
      });
    } catch (error) {
      log.error('Error refreshing provider pricing data', error instanceof Error ? error.message : String(error), { providerId });
      return jsonResponse({
        error: 'Failed to refresh provider pricing data',
        manualRefresh: this.manualRefreshLimiter.getStatus(new Date(), providerId)
      }, 500);
    }
  }

  private buildPricingTemplateData(pricingData: ProviderPricing[], isLoading: boolean): unknown {
    return buildPricingTemplateData(
      this.config,
      pricingData,
      isLoading,
      (providerId, now) => this.manualRefreshLimiter.getStatus(now, providerId)
    );
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

  private async handleModelChangeForPricing(change: ModelChange): Promise<void> {
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
