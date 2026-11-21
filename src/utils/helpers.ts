import type { ErrorInfo } from 'react';
import axios from 'axios';
import { getErrorMessage } from 'react-error-boundary';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const logError = (error: unknown, info?: ErrorInfo) => {
  const message = getErrorMessage(error) ?? String(error);
  console.error(message, info?.componentStack);
};

export const isServerError = (error: unknown): boolean =>
  axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500;

export const extractApiError = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { message?: string | string[] } | undefined)
      ?.message;
    if (Array.isArray(serverMessage) && serverMessage.length > 0) {
      return serverMessage.join(', ');
    }
    if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
      return serverMessage;
    }
  }
  return fallback;
};

export const formatCurrency = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    return '$0.00';
  }
  return currencyFormatter.format(amount);
};

export const formatShortDate = (dateValue?: string | null): string => {
  if (!dateValue) {
    return '—';
  }
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }
  return shortDateFormatter.format(parsed);
};

export const getDateTimestamp = (dateValue?: string | null): number => {
  if (!dateValue) {
    return 0;
  }
  const parsed = Date.parse(dateValue);
  return Number.isNaN(parsed) ? 0 : parsed;
};
