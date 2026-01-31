import { log } from './logger.ts';
import type { IconConfig, GlobalIconSettings } from './config.ts';

declare const Bun: {
  file(path: string): {
    exists(): Promise<boolean>;
    text(): Promise<string>;
  };
};

export class IconManager {
  private globalSettings: GlobalIconSettings;
  private availableIcons: string[] = [];

  constructor(globalSettings: GlobalIconSettings) {
    this.globalSettings = globalSettings;
    this.loadAvailableIcons().catch(error => {
      log.error('Failed to load icons during initialization', error instanceof Error ? error.message : String(error));
    });
  }

  private async loadAvailableIcons(): Promise<void> {
    try {
      const file = Bun.file('resources/icons/svg-name.txt');
      if (await file.exists()) {
        const content = await file.text();
        this.availableIcons = content
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line && line.endsWith('.svg'))
          .map((line: string) => line.replace('.svg', ''));

        log.info('Loaded available icons', { count: this.availableIcons.length });
      } else {
        log.warn('resources/icons/svg-name.txt file not found, using empty icon list');
      }
    } catch (error) {
      log.error('Failed to load resources/icons/svg-name.txt', error instanceof Error ? error.message : String(error));
    }
  }

  generateIconUrl(providerName: string, providerIcon?: IconConfig): string | null {
    if (!this.globalSettings.enabled) {
      return null;
    }

    const iconSlug = this.resolveIconSlug(providerName, providerIcon);
    if (!iconSlug) {
      log.debug('No icon slug found for provider', { providerName });
      return null;
    }

    const format = providerIcon?.format || this.globalSettings.format;
    const theme = providerIcon?.theme || this.globalSettings.theme;
    const cdnSource = this.globalSettings.cdnSource;

    return this.buildCdnUrl(iconSlug, format, theme, cdnSource);
  }

  private resolveIconSlug(providerName: string, providerIcon?: IconConfig): string | null {
    if (providerIcon?.slug) {
      return providerIcon.slug;
    }

    const matchedIcon = this.fuzzyMatchIcon(providerName);
    if (matchedIcon) {
      log.debug('Fuzzy matched icon', { providerName, matchedIcon });
      return matchedIcon;
    }

    log.debug('Using fallback icon', { providerName, fallback: 'openai' });
    return 'openai';
  }

  private fuzzyMatchIcon(providerName: string): string | null {
    if (this.availableIcons.length === 0) {
      return null;
    }

    const normalizedName = this.normalizeString(providerName);

    for (const icon of this.availableIcons) {
      const normalizedIcon = this.normalizeString(icon);
      if (normalizedIcon === normalizedName) {
        return icon;
      }
    }

    for (const icon of this.availableIcons) {
      const normalizedIcon = this.normalizeString(icon);
      if (normalizedIcon.includes(normalizedName)) {
        return icon;
      }
    }

    for (const icon of this.availableIcons) {
      const normalizedIcon = this.normalizeString(icon);
      if (normalizedName.includes(normalizedIcon)) {
        return icon;
      }
    }

    const cleanName = this.cleanIconName(normalizedName);
    for (const icon of this.availableIcons) {
      const cleanIcon = this.cleanIconName(this.normalizeString(icon));
      if (cleanIcon === cleanName || cleanIcon.includes(cleanName) || cleanName.includes(cleanIcon)) {
        return icon;
      }
    }

    return null;
  }

  private normalizeString(str: string): string {
    return str.toLowerCase().replace(/[\s\-_\.]/g, '');
  }

  private cleanIconName(name: string): string {
    return name
      .replace(/color$/, '')
      .replace(/ai$/, '')
      .replace(/cloud$/, '')
      .replace(/api$/, '')
      .replace(/labs?$/, '');
  }

  private buildCdnUrl(iconSlug: string, format: string, theme: string, cdnSource: string): string {
    const baseUrls: Record<string, string> = {
      npmmirror: 'https://registry.npmmirror.com',
      unpkg: 'https://unpkg.com'
    };

    const actualCdnSource = cdnSource || 'npmmirror';
    const baseUrl = baseUrls[actualCdnSource] || baseUrls.npmmirror;
    const packageName = `@lobehub/icons-static-${format}`;

    if (format === 'svg') {
      if (actualCdnSource === 'unpkg') {
        return `${baseUrl}/${packageName}@latest/icons/${iconSlug}.svg`;
      } else {
        return `${baseUrl}/${packageName}/latest/files/icons/${iconSlug}.svg`;
      }
    } else {
      if (actualCdnSource === 'unpkg') {
        return `${baseUrl}/${packageName}@latest/${theme}/${iconSlug}.${format}`;
      } else {
        return `${baseUrl}/${packageName}/latest/files/${theme}/${iconSlug}.${format}`;
      }
    }
  }

  generateIconHtml(providerName: string, providerIcon?: IconConfig): string | null {
    if (!this.globalSettings.enabled) {
      return null;
    }

    const iconSlug = this.resolveIconSlug(providerName, providerIcon);
    if (!iconSlug) {
      return null;
    }

    const format = providerIcon?.format || this.globalSettings.format;
    const size = providerIcon?.size || this.globalSettings.size;
    const cdnSource = this.globalSettings.cdnSource;

    if (format === 'svg') {
      const iconUrl = this.buildCdnUrl(iconSlug, format, 'light', cdnSource);
      return `<img src="${iconUrl}" alt="${providerName} Logo" width="${size}" height="${size}" class="provider-icon">`;
    } else {
      const lightUrl = this.buildCdnUrl(iconSlug, format, 'light', cdnSource);
      const darkUrl = this.buildCdnUrl(iconSlug, format, 'dark', cdnSource);

      return `
        <picture class="provider-icon">
          <source media="(prefers-color-scheme: dark)" srcset="${darkUrl}">
          <img src="${lightUrl}" alt="${providerName} Logo" width="${size}" height="${size}">
        </picture>
      `.trim();
    }
  }

  getAvailableIcons(): string[] {
    return [...this.availableIcons];
  }

  updateGlobalSettings(settings: Partial<GlobalIconSettings>): void {
    this.globalSettings = { ...this.globalSettings, ...settings };
  }

  async reloadIcons(): Promise<void> {
    await this.loadAvailableIcons();
  }
}
