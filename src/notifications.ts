import { NotificationConfig, getEnvVar } from './config.ts';
import { ModelData } from './providers.ts';
import { log } from './logger.ts';
import { GRACE_PERIOD_MS } from './constants.ts';
import mustache from 'mustache';

export interface ModelChange {
  providerId: string;
  providerName: string;
  added: ModelData[];
  removed: ModelData[];
  error?: string;
}

export class NotificationManager {
  private graceStartTime: Date;
  private gracePeriodMs = GRACE_PERIOD_MS;

  constructor(private configs: NotificationConfig[]) {
    this.graceStartTime = new Date();

    const enabledCount = configs.filter(c => c.enabled).length;
    log.info('Notification manager initialized', {
      total: configs.length,
      enabled: enabledCount,
      graceTime: `${this.gracePeriodMs / 1000}s`
    });
  }

  private isInGracePeriod(): boolean {
    const now = new Date();
    return (now.getTime() - this.graceStartTime.getTime()) < this.gracePeriodMs;
  }

  async sendNotifications(change: ModelChange): Promise<void> {
    if (this.isInGracePeriod()) {
      log.debug('Skipping notifications - still in grace period', {
        providerId: change.providerId,
        remainingTime: `${Math.ceil(this.getRemainingGraceTime() / 1000)}s`
      });
      return;
    }

    await this.sendNotificationsInternal(change);
  }

  async sendStartupNotification(change: ModelChange): Promise<void> {
    log.info('Sending startup notification (bypassing grace period)');
    await this.sendNotificationsInternal(change);
  }

  private async sendNotificationsInternal(change: ModelChange): Promise<void> {
    const enabledConfigs = this.configs.filter(config => config.enabled);

    if (enabledConfigs.length === 0) {
      log.debug('No enabled notification configs found');
      return;
    }

    for (const config of enabledConfigs) {
      try {
        await this.sendNotification(config, change);
      } catch (error) {
        log.error(
          'Failed to send notification',
          error instanceof Error ? error.message : String(error),
          {
            notificationId: config.id,
            providerId: change.providerId,
          }
        );
      }
    }
  }

  private async sendNotification(config: NotificationConfig, change: ModelChange): Promise<void> {
    const webhookUrl = getEnvVar(config.webhookUrlEnvVar);
    if (!webhookUrl) {
      log.error(
        'Webhook URL not found for enabled notification',
        undefined,
        {
          notificationId: config.id,
          envVar: config.webhookUrlEnvVar,
        }
      );
      return;
    }

    const shouldTrigger = this.shouldTriggerNotification(config, change);
    if (!shouldTrigger) {
      log.debug('Notification not triggered', {
        notificationId: config.id,
        triggerOn: config.triggerOn,
        hasAdded: change.added.length > 0,
        hasRemoved: change.removed.length > 0,
        hasError: !!change.error
      });
      return;
    }

    const requestBody = this.buildRequestBody(config, change);

    log.request('Sending webhook notification', {
      notificationId: config.id,
      providerId: change.providerId,
      added: change.added.length,
      removed: change.removed.length,
      hasError: !!change.error
    });

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ModelSentry/1.0'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      log.info('Notification sent successfully', {
        notificationId: config.id,
        providerId: change.providerId,
        status: response.status
      });

    } catch (error) {
      throw new Error(`Failed to send webhook to ${config.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private shouldTriggerNotification(config: NotificationConfig, change: ModelChange): boolean {
    const hasAdded = change.added.length > 0;
    const hasRemoved = change.removed.length > 0;
    const hasError = !!change.error;

    return (
      (hasAdded && config.triggerOn.includes('added')) ||
      (hasRemoved && config.triggerOn.includes('removed')) ||
      (hasError && config.triggerOn.includes('error'))
    );
  }

  private buildRequestBody(config: NotificationConfig, change: ModelChange): any {
    const sanitizeForDisplay = (str: string): string => {
      return str
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\r\n/g, ' ')
        .replace(/[\r\n]/g, ' ')
        .replace(/\t/g, ' ');
    };

    const addedMarkdownList =
      change.added.length > 0
        ? change.added.map((model) => `- ${sanitizeForDisplay(model.name)}`).join('\n')
        : '无';

    const removedMarkdownList =
      change.removed.length > 0
        ? change.removed.map((model) => `- ${sanitizeForDisplay(model.name)}`).join('\n')
        : '无';

    const templateData = {
      providerId: sanitizeForDisplay(change.providerId),
      providerName: sanitizeForDisplay(change.providerName),
      addedMarkdownList,
      removedMarkdownList,
      errorDetails: change.error ? sanitizeForDisplay(change.error) : '无',
      addedCount: change.added.length,
      removedCount: change.removed.length,
      timestamp: new Date().toISOString(),
    };

    const templateEnvVars = this.resolveTemplateEnvVars(config.templateEnvVars);
    const combinedTemplateData = {
      ...templateEnvVars,
      ...templateData,
    };

    try {
      const rendered = this.renderTemplateRecursive(config.requestBodyTemplate, combinedTemplateData);
      return rendered;
    } catch (error) {
      log.error('Failed to build request body', error instanceof Error ? error.message : String(error), {
        notificationId: config.id,
        providerId: change.providerId,
        templateError: 'Template rendering failed'
      });
      throw error;
    }
  }

  private renderTemplateRecursive(obj: any, data: any): any {
    if (typeof obj === 'string') {
      return mustache.render(obj, data);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.renderTemplateRecursive(item, data));
    } else if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.renderTemplateRecursive(value, data);
      }
      return result;
    } else {
      return obj;
    }
  }

  getRemainingGraceTime(): number {
    if (!this.isInGracePeriod()) {
      return 0;
    }

    const elapsed = new Date().getTime() - this.graceStartTime.getTime();
    return Math.max(0, this.gracePeriodMs - elapsed);
  }

  private resolveTemplateEnvVars(templateEnvVars?: Record<string, string>): Record<string, string> {
    if (!templateEnvVars) {
      return {};
    }

    const resolved: Record<string, string> = {};
    for (const [placeholder, envVar] of Object.entries(templateEnvVars)) {
      const value = getEnvVar(envVar);
      resolved[placeholder] = value && value.trim().length > 0 ? value : '';
    }
    return resolved;
  }
}
