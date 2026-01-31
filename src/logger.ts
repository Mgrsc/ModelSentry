export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  component?: string;
  providerId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private level: LogLevel | null = null;
  private enableColors: boolean;

  constructor() {
    this.enableColors = process.stdout.isTTY && !process.env.NO_COLOR;
  }

  private getLevel(): LogLevel {
    if (this.level === null) {
      this.level = this.getLogLevel();
    }
    return this.level;
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private formatTimestamp(): string {
    const date = new Date();
    const timezone = process.env.TZ || 'UTC';

    try {
      const formatted = date.toLocaleString('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const ms = date.getMilliseconds().toString().padStart(3, '0');

      return `${formatted.replace(' ', ' ')}.${ms}`;
    } catch (error) {
      return date.toISOString();
    }
  }

  private colorize(text: string, color: string): string {
    if (!this.enableColors) return text;

    const colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      green: '\x1b[32m',
      gray: '\x1b[90m',
      cyan: '\x1b[36m'
    };

    return `${colors[color as keyof typeof colors] || ''}${text}${colors.reset}`;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = this.colorize(this.formatTimestamp(), 'gray');
    const levelStr = this.colorize(`[${level.padEnd(5)}]`, this.getLevelColor(level));

    let formatted = `${timestamp} ${levelStr} ${message}`;

    if (context) {
      const contextStr = Object.entries(context)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');

      if (contextStr) {
        formatted += ` ${this.colorize(`{${contextStr}}`, 'cyan')}`;
      }
    }

    return formatted;
  }

  private getLevelColor(level: string): string {
    switch (level) {
      case 'DEBUG': return 'gray';
      case 'INFO': return 'blue';
      case 'WARN': return 'yellow';
      case 'ERROR': return 'red';
      default: return 'reset';
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.getLevel() <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.getLevel() <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.getLevel() <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  error(message: string, error?: Error | string, context?: LogContext): void {
    if (this.getLevel() <= LogLevel.ERROR) {
      let errorMessage = message;

      if (error) {
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
          if (this.getLevel() === LogLevel.DEBUG) {
            errorMessage += `\n${error.stack}`;
          }
        } else {
          errorMessage += `: ${error}`;
        }
      }

      console.error(this.formatMessage('ERROR', errorMessage, context));
    }
  }

  startup(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('INFO', this.colorize(`🚀 ${message}`, 'green'), context);
    console.log(formatted);
  }

  shutdown(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('INFO', this.colorize(`🛑 ${message}`, 'yellow'), context);
    console.log(formatted);
  }

  changes(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('INFO', this.colorize(`📊 ${message}`, 'green'), context);
    console.log(formatted);
  }

  request(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('DEBUG', this.colorize(`🌐 ${message}`, 'blue'), context);
    console.log(formatted);
  }

  time(label: string): void {
    console.time(this.colorize(`⏱️  ${label}`, 'cyan'));
  }

  timeEnd(label: string): void {
    console.timeEnd(this.colorize(`⏱️  ${label}`, 'cyan'));
  }
}

export const logger = new Logger();

export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | string, context?: LogContext) => logger.error(message, error, context),
  startup: (message: string, context?: LogContext) => logger.startup(message, context),
  shutdown: (message: string, context?: LogContext) => logger.shutdown(message, context),
  changes: (message: string, context?: LogContext) => logger.changes(message, context),
  request: (message: string, context?: LogContext) => logger.request(message, context),
  time: (label: string) => logger.time(label),
  timeEnd: (label: string) => logger.timeEnd(label)
};
