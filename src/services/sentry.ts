/**
 * Sentry Error Monitoring
 *
 * Captures errors and performance data in production.
 * Configure EXPO_PUBLIC_SENTRY_DSN in .env to enable.
 */

import * as Sentry from '@sentry/react-native';
import { logInfo, logError } from '../utils/logger';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const initializeSentry = () => {
  if (!SENTRY_DSN) {
    logInfo('Sentry DSN not configured, error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    enabled: !__DEV__, // Only enable in production
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    attachScreenshot: true,
    attachViewHierarchy: true,
  });
};

/**
 * Capture an error with optional context
 */
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  if (!SENTRY_DSN || __DEV__) {
    logError('Error', error, context);
    return;
  }

  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (userId: string, email?: string) => {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: userId,
    email: email,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (message: string, category: string, data?: Record<string, unknown>) => {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

export { Sentry };
