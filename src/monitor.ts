import { ProviderManager, ModelData, ProviderStatus } from './providers.ts';
import { NotificationManager, ModelChange } from './notifications.ts';
import { Config } from './config.ts';
import { log } from './logger.ts';

export class ModelMonitor {
  private intervalId: any | null = null;
  private previousModels: Map<string, ModelData[]> = new Map();
  private newModelTimestamps: Map<string, Date> = new Map();
  private isInitialLoad: boolean = true;

  constructor(
    private config: Config,
    private providerManager: ProviderManager,
    private notificationManager: NotificationManager,
    private onModelChange?: (change: ModelChange) => void | Promise<void>
  ) {}

  start(): void {
    log.startup('Starting model monitor', {
      interval: `${this.config.checkIntervalSeconds}s`,
      providers: this.providerManager.getEnabledProviders().length
    });

    this.checkAllProviders();

    this.intervalId = setInterval(() => {
      this.checkAllProviders();
    }, this.config.checkIntervalSeconds * 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      log.shutdown('Model monitor stopped');
    }
  }

  private async checkAllProviders(): Promise<void> {
    const enabledProviders = this.providerManager.getEnabledProviders();

    log.debug('Starting provider check cycle', {
      enabledProviders: enabledProviders.length,
      isInitialLoad: this.isInitialLoad
    });

    log.time('provider-check-cycle');

    const checkPromises = enabledProviders.map(provider =>
      this.checkProvider(provider.id).catch(error => {
        log.error('Provider check failed', error, { providerId: provider.id });
      })
    );

    await Promise.allSettled(checkPromises);

    if (this.isInitialLoad) {
      this.isInitialLoad = false;
      log.debug('Initial load completed, subsequent checks will detect real changes');
    }

    log.timeEnd('provider-check-cycle');
    log.debug('Provider check cycle completed');
  }

  private async checkProvider(providerId: string): Promise<void> {
    try {
      const currentModels = await this.providerManager.fetchModels(providerId);
      const previousModels = this.previousModels.get(providerId) || [];

      const changes = this.detectChanges(providerId, previousModels, currentModels);

      if (!this.isInitialLoad && (changes.added.length > 0 || changes.removed.length > 0)) {
        log.changes('Model changes detected', {
          providerId,
          added: changes.added.length,
          removed: changes.removed.length,
          addedModels: changes.added.map(m => m.name).join(', '),
          removedModels: changes.removed.map(m => m.name).join(', ')
        });
        await this.notificationManager.sendNotifications(changes);
        if (this.onModelChange) {
          try {
            await this.onModelChange(changes);
          } catch (error) {
            log.warn('Model change hook failed', {
              providerId,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      } else if (this.isInitialLoad) {
        log.debug('Initial load - skipping notifications', {
          providerId,
          modelCount: currentModels.length
        });
      } else {
        log.debug('No changes detected', { providerId });
      }

      this.previousModels.set(providerId, currentModels);

    } catch (error) {
      const providerStatus = this.providerManager.getProviderStatus(providerId);
      if (providerStatus) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        const shouldNotify = !providerStatus.isRetrying &&
                           !errorMessage.includes('Retry cooldown active') &&
                           providerStatus.retryCount >= 2;

        if (shouldNotify) {
          const changes: ModelChange = {
            providerId,
            providerName: providerStatus.name,
            added: [],
            removed: [],
            error: errorMessage
          };

          log.error('Provider failed after all retries, sending notification', errorMessage, {
            providerId,
            retryCount: providerStatus.retryCount,
            finalError: errorMessage
          });

          await this.notificationManager.sendNotifications(changes);
        } else {
          log.debug('Skipping error notification', {
            providerId,
            isRetrying: providerStatus.isRetrying,
            retryCount: providerStatus.retryCount,
            error: errorMessage
          });
        }
      }
    }
  }

  private detectChanges(providerId: string, previous: ModelData[], current: ModelData[]): ModelChange {
    const providerStatus = this.providerManager.getProviderStatus(providerId);
    const providerName = providerStatus?.name || providerId;

    const previousNames = new Set(previous.map(m => m.name));
    const currentNames = new Set(current.map(m => m.name));

    const added = current.filter(model => !previousNames.has(model.name));
    const removed = previous.filter(model => !currentNames.has(model.name));

    if (!this.isInitialLoad && added.length > 0) {
      const now = new Date();
      added.forEach(model => {
        const key = `${providerId}:${model.name}`;
        if (!this.newModelTimestamps.has(key)) {
          this.newModelTimestamps.set(key, now);
          log.debug('Marking model as new', { providerId, modelName: model.name });
        }
      });
    }

    return {
      providerId,
      providerName,
      added,
      removed
    };
  }

  async forceCheck(): Promise<void> {
    log.info('Force checking all providers', { operation: 'force-check' });
    await this.checkAllProviders();
  }

  isNewModel(providerId: string, modelName: string): boolean {
    const key = `${providerId}:${modelName}`;
    const addedTime = this.newModelTimestamps.get(key);

    const isDevelopment = (() => {
      try {
        const env = (globalThis as any).process?.env || (globalThis as any).Bun?.env || {};
        return env.NODE_ENV !== 'production';
      } catch {
        return false;
      }
    })();

    if (isDevelopment) {
      const testNewModels: string[] = [];

      if (testNewModels.includes(`${providerId}:${modelName}`)) {
        const graceTimeRemaining = this.notificationManager.getRemainingGraceTime();
        return graceTimeRemaining === 0;
      }
    }

    if (!addedTime) {
      return false;
    }

    const now = new Date();
    const hoursSinceAdded = (now.getTime() - addedTime.getTime()) / (1000 * 60 * 60);

    const graceTimeRemaining = this.notificationManager.getRemainingGraceTime();
    if (graceTimeRemaining > 0) {
      return false;
    }

    return hoursSinceAdded < 24;
  }

  getStatus(): {
    isRunning: boolean;
    nextCheckIn: number;
    graceTimeRemaining: number;
    providers: ProviderStatus[];
  } {
    const graceTimeRemaining = this.notificationManager.getRemainingGraceTime();
    const providers = this.providerManager.getAllProviderStatuses();

    return {
      isRunning: this.intervalId !== null,
      nextCheckIn: this.config.checkIntervalSeconds,
      graceTimeRemaining,
      providers
    };
  }
}
