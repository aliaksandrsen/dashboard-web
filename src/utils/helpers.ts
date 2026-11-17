import type { ErrorInfo } from 'react';
import { getErrorMessage } from 'react-error-boundary';

export const logError = (error: unknown, info?: ErrorInfo) => {
  // In production, send errors to an external monitoring service (e.g., Sentry, Datadog, LogRocket)
  const message = getErrorMessage(error) ?? String(error);
  console.error(message, info?.componentStack);
};
