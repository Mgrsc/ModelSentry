import { formatDate } from './utils.ts';

export interface ManualRefreshStatus {
  limit: number;
  remaining: number;
  resetAt: string;
  resetAtLocal: string;
}

export class ManualRefreshLimiter {
  private totalCount = 0;
  private countByProvider: Map<string, number> = new Map();
  private dateKey: string | null = null;

  constructor(private limit: number) {}

  getStatus(now: Date = new Date(), providerId?: string): ManualRefreshStatus {
    this.resetIfNeeded(now);
    const currentCount = providerId ? this.countByProvider.get(providerId) || 0 : this.totalCount;
    const resetDate = this.getNextResetDate(now);

    return {
      limit: this.limit,
      remaining: Math.max(0, this.limit - currentCount),
      resetAt: resetDate.toISOString(),
      resetAtLocal: formatDate(resetDate)
    };
  }

  consume(now: Date = new Date(), providerId?: string): ManualRefreshStatus {
    this.resetIfNeeded(now);

    if (providerId) {
      const currentCount = this.countByProvider.get(providerId) || 0;
      this.countByProvider.set(providerId, currentCount + 1);
    } else {
      this.totalCount += 1;
    }

    return this.getStatus(now, providerId);
  }

  private resetIfNeeded(now: Date): void {
    const todayKey = now.toISOString().slice(0, 10);
    if (this.dateKey !== todayKey) {
      this.totalCount = 0;
      this.countByProvider.clear();
      this.dateKey = todayKey;
    }
  }

  private getNextResetDate(now: Date): Date {
    const reset = new Date(now);
    reset.setUTCHours(0, 0, 0, 0);
    reset.setUTCDate(reset.getUTCDate() + 1);
    return reset;
  }
}
