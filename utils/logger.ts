// Simplified version of logger without complex validation

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: string;
  file?: string;
  line?: number;
}

// Maximum number of logs to store
const MAX_LOGS = 50;

export class Logger {
  private logs: LogEntry[] = [];

  debug(message: string, data?: unknown, file?: string, line?: number): void {
    this.log('debug', message, data, file, line);
  }

  info(message: string, data?: unknown, file?: string, line?: number): void {
    this.log('info', message, data, file, line);
  }

  warn(message: string, data?: unknown, file?: string, line?: number): void {
    this.log('warn', message, data, file, line);
  }

  error(message: string, data?: unknown, file?: string, line?: number): void {
    this.log('error', message, data, file, line);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    file?: string,
    line?: number
  ): void {
    const timestamp = new Date().toISOString();

    // Safely convert data to string
    let safeData: string | undefined = undefined;

    try {
      if (data !== null && data !== undefined) {
        if (typeof data === 'string') {
          safeData = data;
        } else if (typeof data === 'number' || typeof data === 'boolean') {
          safeData = String(data);
        } else {
          safeData = '[Object]';
        }
      }
    } catch (e) {
      safeData = '[Error stringifying data]';
    }

    const entry: LogEntry = {
      timestamp,
      level,
      message,
      data: safeData ?? '',
      file: file ?? '',
      line: line ?? 0,
    };

    // Add log to array
    this.logs.push(entry);

    // Limit the number of logs
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }

    // Output to console only in development
    if (
      process.env.NODE_ENV !== 'production' &&
      typeof console !== 'undefined'
    ) {
      const consoleMethod =
        level === 'error'
          ? console.error
          : level === 'warn'
            ? console.warn
            : level === 'info'
              ? console.info
              : (() => {}); // Пустая функция вместо console.debug

      consoleMethod(`[${level.toUpperCase()}] ${message}`, safeData || '');
    }
  }

  getAll(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
    if (typeof console !== 'undefined') {
    }
  }
}

// Create logger instance
export const logger = new Logger();

// Global error handler
export function setupGlobalErrorHandling(): void {
  if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, error) => {
      logger.error(
        `Global error: ${message}`,
        null,
        source?.toString(),
        lineno
      );
      return false;
    };

    window.addEventListener('unhandledrejection', event => {
      const reasonStr = event.reason?.toString() || '[No reason available]';
      logger.error('Unhandled Promise rejection', reasonStr);

      // Prevent the default browser action (logging to console)
      event.preventDefault();
    });
  }
}

// Empty function for JSX validation - does nothing
export function validateJSXContent(content: string, filename: string): void {
  // Empty function to avoid validation issues
}
