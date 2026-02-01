/**
 * Logger utility for consistent logging across the app
 *
 * In development: logs to console
 * In production: errors are captured by Sentry, other logs are silenced
 */

const isDev = __DEV__;

/**
 * Log an error - always logged, captured by Sentry in production
 */
export const logError = (message: string, error?: unknown, context?: Record<string, unknown>): void => {
  if (isDev) {
    console.error(message, error, context);
  }
  // In production, Sentry captures errors via ErrorBoundary
  // Additional error logging can be added here if needed
};

/**
 * Log a warning - only in development
 */
export const logWarn = (message: string, data?: unknown): void => {
  if (isDev) {
    console.warn(message, data);
  }
};

/**
 * Log info - only in development
 */
export const logInfo = (message: string, data?: unknown): void => {
  if (isDev) {
    console.log(message, data);
  }
};

/**
 * Log debug info - only in development
 * Use sparingly for temporary debugging
 */
export const logDebug = (message: string, data?: unknown): void => {
  if (isDev) {
    console.log(`[DEBUG] ${message}`, data);
  }
};
