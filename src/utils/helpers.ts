import type { ErrorInfo } from 'react';
import { getErrorMessage } from 'react-error-boundary';
import { OrderStatus, type OrderStatusKeys } from '../pages/UserInfo/UserInfo.State';

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
  // In production, send errors to an external monitoring service (e.g., Sentry, Datadog, LogRocket)
  const message = getErrorMessage(error) ?? String(error);
  console.error(message, info?.componentStack);
};

export const formatCurrency = (amount: number): string => {
  if (!Number.isFinite(amount) || amount === 0) {
    return '0';
  }
  return currencyFormatter.format(amount);
};

export const formatShortDate = (dateValue: string): string => {
  if (!dateValue) {
    return 'No date available';
  }
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }
  return shortDateFormatter.format(parsed);
};

export const getDateTimestamp = (dateValue: string): number => {
  if (!dateValue) {
    return 0;
  }
  const parsed = Date.parse(dateValue);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const formatOrderStatusLabel = (status: OrderStatusKeys): string => {
  switch (status) {
    case OrderStatus.Shipped:
      return 'Shipped';
    case OrderStatus.Pending:
      return 'Pending';
    case OrderStatus.OutOfStock:
      return 'Out of Stock';
  }
};
