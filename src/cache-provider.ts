import { log } from './logger.ts';
import type { ModelData } from './providers.ts';
import type { ModelPricing } from './pricing.ts';
import { fileExists } from './utils.ts';
import { mkdir, rename } from 'node:fs/promises';
import { dirname } from 'node:path';

export type CacheBackend = 'memory' | 'file';

export interface CachedProviderStatus {
  models: ModelData[];
  lastCheck?: string;
  lastSuccess?: string;
}

export interface CachedProviderPricing {
  id: string;
  name: string;
  models: ModelPricing[];
  lastUpdated: string;
  error?: string;
  iconHtml?: string;
}

export interface CacheSnapshotV1 {
  version: 1;
  savedAt: string;
  providers: Record<string, CachedProviderStatus>;
  pricing: Record<string, CachedProviderPricing>;
}

export interface CacheProvider {
  load(): Promise<CacheSnapshotV1>;
  saveProviderStatus(providerId: string, status: CachedProviderStatus): Promise<void>;
  savePricing(providerId: string, pricing: CachedProviderPricing): Promise<void>;
}

export class MemoryCacheProvider implements CacheProvider {
  async load(): Promise<CacheSnapshotV1> {
    return {
      version: 1,
      savedAt: new Date(0).toISOString(),
      providers: {},
      pricing: {}
    };
  }

  async saveProviderStatus(_providerId: string, _status: CachedProviderStatus): Promise<void> {}
  async savePricing(_providerId: string, _pricing: CachedProviderPricing): Promise<void> {}
}

export class FileCacheProvider implements CacheProvider {
  private snapshot: CacheSnapshotV1 = {
    version: 1,
    savedAt: new Date(0).toISOString(),
    providers: {},
    pricing: {}
  };

  private writeTimer: ReturnType<typeof setTimeout> | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private filePath: string) {}

  async load(): Promise<CacheSnapshotV1> {
    try {
      const exists = await fileExists(this.filePath);
      if (!exists) return this.snapshot;

      const file = Bun.file(this.filePath);
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || parsed.version !== 1 || typeof parsed !== 'object') {
        log.warn('Cache file has unsupported format; ignoring', { filePath: this.filePath });
        return this.snapshot;
      }

      this.snapshot = {
        version: 1,
        savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date(0).toISOString(),
        providers: typeof parsed.providers === 'object' && parsed.providers ? parsed.providers : {},
        pricing: typeof parsed.pricing === 'object' && parsed.pricing ? parsed.pricing : {}
      };

      return this.snapshot;
    } catch (error) {
      log.warn('Failed to load cache file; ignoring', {
        filePath: this.filePath,
        error: error instanceof Error ? error.message : String(error)
      });
      return this.snapshot;
    }
  }

  async saveProviderStatus(providerId: string, status: CachedProviderStatus): Promise<void> {
    this.snapshot.providers[providerId] = status;
    this.snapshot.savedAt = new Date().toISOString();
    this.scheduleWrite();
  }

  async savePricing(providerId: string, pricing: CachedProviderPricing): Promise<void> {
    this.snapshot.pricing[providerId] = pricing;
    this.snapshot.savedAt = new Date().toISOString();
    this.scheduleWrite();
  }

  private scheduleWrite(): void {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.writeChain = this.writeChain.then(() => this.flushWrite()).catch(() => this.flushWrite());
    }, 250);
  }

  private async flushWrite(): Promise<void> {
    const dir = dirname(this.filePath);
    try {
      await mkdir(dir, { recursive: true });
    } catch {}

    const tmpPath = `${this.filePath}.tmp`;
    const payload = JSON.stringify(this.snapshot, null, 2);

    try {
      await Bun.write(tmpPath, payload);
      await rename(tmpPath, this.filePath);
    } catch (error) {
      log.warn('Failed to write cache file', {
        filePath: this.filePath,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export function createCacheProvider(backend: CacheBackend, filePath?: string): CacheProvider {
  if (backend === 'file') {
    return new FileCacheProvider(filePath || 'data/modelsentry-cache.json');
  }
  return new MemoryCacheProvider();
}

