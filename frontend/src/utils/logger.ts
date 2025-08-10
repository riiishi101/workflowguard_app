/**
 * Production-safe logging utility
 * Automatically disables debug logs in production environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, data?: any) {
    // Only log in development environment
    if (!this.isDevelopment) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        console.log(`${prefix} ${message}`, data || '');
        break;
      case 'info':
        console.info(`${prefix} ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data || '');
        break;
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  // Production-safe auth logging (sanitized)
  authLog(message: string, data?: any) {
    if (!this.isDevelopment) {
      return;
    }

    // Sanitize sensitive data
    const sanitizedData = data ? {
      ...data,
      token: data.token ? '[REDACTED]' : undefined,
      password: data.password ? '[REDACTED]' : undefined,
      email: data.email ? data.email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined,
    } : undefined;

    this.debug(`🔐 AUTH: ${message}`, sanitizedData);
  }
}

export const logger = new Logger();
export default logger;
