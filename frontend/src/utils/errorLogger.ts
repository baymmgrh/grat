import axiosInstance from './axiosConfig';

interface ErrorLog {
  type: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  url?: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 50;
  private flushInterval: number | null = null;

  constructor() {
    this.setupGlobalHandlers();
    this.startPeriodicFlush();
  }

  private setupGlobalHandlers() {
    // Catch unhandled errors
    window.onerror = (message, source, lineno, colno, error) => {
      this.log({
        type: 'error',
        message: `${message} at ${source}:${lineno}:${colno}`,
        stack: error?.stack,
        url: window.location.href,
      });
      return false;
    };

    // Catch unhandled promise rejections
    window.onunhandledrejection = (event) => {
      this.log({
        type: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
      });
    };

    // Catch console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.log({
        type: 'error',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        url: window.location.href,
      });
      originalConsoleError.apply(console, args);
    };
  }

  private startPeriodicFlush() {
    // Flush logs every 30 seconds if there are any
    this.flushInterval = window.setInterval(() => {
      if (this.logs.length > 0) {
        this.flush();
      }
    }, 30000);
  }

  log(entry: Omit<ErrorLog, 'timestamp' | 'userAgent' | 'userId'>) {
    const fullEntry: ErrorLog = {
      ...entry,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: localStorage.getItem('userId') || undefined,
    };

    this.logs.push(fullEntry);

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log('[ErrorLogger]', fullEntry);
    }

    // Flush if too many logs accumulated
    if (this.logs.length >= this.maxLogs) {
      this.flush();
    }
  }

  async flush() {
    if (this.logs.length === 0) return;

    const logsToSend = [...this.logs];
    this.logs = [];

    try {
      await axiosInstance.post('/api/logs/frontend', { logs: logsToSend });
    } catch (error) {
      // If sending fails, put logs back (but limit to avoid memory issues)
      this.logs = [...logsToSend.slice(-20), ...this.logs].slice(-this.maxLogs);
    }
  }

  // Manual error logging
  error(message: string, error?: Error) {
    this.log({
      type: 'error',
      message,
      stack: error?.stack,
      url: window.location.href,
    });
  }

  warning(message: string) {
    this.log({
      type: 'warning',
      message,
      url: window.location.href,
    });
  }

  info(message: string) {
    this.log({
      type: 'info',
      message,
      url: window.location.href,
    });
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

export default errorLogger;
