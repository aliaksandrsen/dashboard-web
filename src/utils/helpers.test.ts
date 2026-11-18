import { describe, expect, it, vi } from 'vitest';
import { OrderStatus } from '../pages/UserInfo/UserInfo.State';
import {
  formatCurrency,
  formatOrderStatusLabel,
  formatShortDate,
  getDateTimestamp,
  logError,
} from './helpers';

describe('helpers', () => {
  it('formats currency amounts and handles zero or non-finite values', () => {
    expect(formatCurrency(400)).toBe('$400.00');
    expect(formatCurrency(49.99)).toBe('$49.99');
    expect(formatCurrency(0)).toBe('0');
    expect(formatCurrency(Number.NaN)).toBe('0');
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('0');
  });

  it('formats dates cleanly and falls back for empty or invalid dates', () => {
    expect(formatShortDate('2025-06-24T12:00:00.000Z')).toContain('2025');
    expect(formatShortDate('06/24/2025')).toBe('Jun 24, 2025');
    expect(formatShortDate('')).toBe('No date available');
    expect(formatShortDate('not-a-date')).toBe('not-a-date');
  });

  it('parses timestamps safely for sorting', () => {
    expect(getDateTimestamp('2025-06-24T00:00:00.000Z')).toBe(
      Date.parse('2025-06-24T00:00:00.000Z'),
    );
    expect(getDateTimestamp('')).toBe(0);
    expect(getDateTimestamp('invalid-date')).toBe(0);
  });

  it('formats order status labels', () => {
    expect(formatOrderStatusLabel(OrderStatus.Shipped)).toBe('Shipped');
    expect(formatOrderStatusLabel(OrderStatus.Pending)).toBe('Pending');
    expect(formatOrderStatusLabel(OrderStatus.OutOfStock)).toBe('Out of Stock');
  });

  it('logs errors with optional componentStack via console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError(new Error('Boom'), { componentStack: '\n    at Test' });
    expect(spy).toHaveBeenCalledWith('Boom', '\n    at Test');
    spy.mockRestore();
  });
});
