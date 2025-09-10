/**
 * Logger utility for Adquimo SDK
 * Provides structured logging with different levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
  context?: string;
}

export class Logger {
  private debugMode: boolean;
  private context: string;

  constructor(debugMode = false, context = 'AdquimoSDK') {
    this.debugMode = debugMode;
    this.context = context;
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   */
  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Set debug mode
   */
  setDebugMode(debugMode: boolean): void {
    this.debugMode = debugMode;
  }

  /**
   * Set logging context
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    // Skip debug logs if debug mode is disabled
    if (level === LogLevel.DEBUG && !this.debugMode) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      context: this.context,
    };

    this.outputLog(logEntry);
  }

  /**
   * Output log entry
   */
  private outputLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';

    const logMessage = `${timestamp} ${levelName} ${context} ${entry.message}${dataStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
    }
  }
}
