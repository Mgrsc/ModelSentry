export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function sanitizeUrl(url: string): string {
  return url.replace(/key=[^&]+/g, 'key=***')
            .replace(/token=[^&]+/g, 'token=***')
            .replace(/apikey=[^&]+/g, 'apikey=***');
}

export function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon'
  };
  return types[ext || ''] || 'application/octet-stream';
}

export function round(value: number, places: number): number {
  if (isNaN(value) || !isFinite(value)) {
    return value;
  }
  const power = Math.pow(10, places);
  return Math.round(value * power) / power;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function parsePrice(price: any): number | null {
  if (typeof price === 'number') {
    return price;
  }
  if (typeof price === 'string') {
    const match = price.match(/[\d.]+/);
    if (match) {
      return parseFloat(match[0]);
    }
  }
  return null;
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    const file = Bun.file(path);
    return await file.exists();
  } catch {
    return false;
  }
}

export async function readJsonFile<T = any>(path: string): Promise<T> {
  const file = Bun.file(path);
  const text = await file.text();
  return JSON.parse(text);
}

export async function writeJsonFile(path: string, data: any): Promise<void> {
  await Bun.write(path, JSON.stringify(data, null, 2));
}

export function generateEmojiSvg(emoji: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <text y=".9em" font-size="90">${emoji}</text>
  </svg>`;
}

export function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[\s\-_\.]/g, '');
}

export function getEnvVar(envVarName: string): string | undefined {
  return process.env[envVarName];
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts: number;
    delayMs: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  const { maxAttempts, delayMs, onRetry } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        onRetry?.(attempt, lastError);
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error('Unknown error during retry attempts');
}
