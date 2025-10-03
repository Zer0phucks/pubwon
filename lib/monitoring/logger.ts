/**
 * Application Logging System
 * Structured logging for monitoring and debugging
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;

  private levelPriority = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
    [LogLevel.FATAL]: 4,
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      const errorStack = entry.error?.stack ? `\n${entry.error.stack}` : '';
      const contextStr = entry.context ? `\n${JSON.stringify(entry.context, null, 2)}` : '';
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${errorStack}`;
    } else {
      // JSON format for production (easy to parse by log aggregators)
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
    };

    const formatted = this.formatLog(entry);

    // Output to console with appropriate method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }

    // Send to external logging service in production
    if (!this.isDevelopment) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Integration with external logging services (Sentry, Datadog, etc.)
    // For now, just a placeholder
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      // Send to error tracking service
      // e.g., Sentry.captureException(entry.error)
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  // Utility methods for common logging patterns

  apiRequest(method: string, path: string, userId?: string): void {
    this.info('API Request', {
      method,
      path,
      userId,
    });
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, 'API Response', {
      method,
      path,
      statusCode,
      duration,
    });
  }

  databaseQuery(operation: string, table: string, duration: number): void {
    this.debug('Database Query', {
      operation,
      table,
      duration,
    });
  }

  externalApiCall(service: string, endpoint: string, duration: number, success: boolean): void {
    this.info('External API Call', {
      service,
      endpoint,
      duration,
      success,
    });
  }

  cronJob(jobName: string, status: 'started' | 'completed' | 'failed', duration?: number): void {
    this.info('Cron Job', {
      jobName,
      status,
      duration,
    });
  }

  security(event: string, details: Record<string, any>): void {
    this.warn('Security Event', {
      event,
      ...details,
    });
  }
}

export const logger = new Logger();

/**
 * Performance monitoring helper
 */
export class PerformanceMonitor {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  end(metadata?: Record<string, any>): number {
    const duration = Date.now() - this.startTime;
    logger.debug(`Performance: ${this.operation}`, {
      duration,
      ...metadata,
    });
    return duration;
  }
}

/**
 * Create a performance monitor
 */
export function monitor(operation: string): PerformanceMonitor {
  return new PerformanceMonitor(operation);
}

/**
 * Middleware for request logging
 */
export async function withLogging(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  const start = Date.now();
  const method = request.method;
  const path = new URL(request.url).pathname;

  logger.apiRequest(method, path);

  try {
    const response = await handler();
    const duration = Date.now() - start;

    logger.apiResponse(method, path, response.status, duration);

    return response;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('API Error', error as Error, { method, path, duration });
    throw error;
  }
}
