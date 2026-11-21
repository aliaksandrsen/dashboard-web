import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import {
  extractApiError,
  formatCurrency,
  formatShortDate,
  getDateTimestamp,
  isServerError,
  logError,
} from './helpers';

describe('helpers', () => {
  it('formats currency values including zero and non-finite inputs', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(Number.NaN)).toBe('$0.00');
    expect(formatCurrency(125.5)).toBe('$125.50');
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('formats dates and timestamps safely', () => {
    expect(formatShortDate('')).toBe('—');
    expect(formatShortDate(null)).toBe('—');
    expect(formatShortDate('not-a-date')).toBe('not-a-date');
    expect(formatShortDate('2026-06-24T12:00:00.000Z')).toContain('2026');

    expect(getDateTimestamp('')).toBe(0);
    expect(getDateTimestamp('invalid')).toBe(0);
    expect(getDateTimestamp('2026-06-24T00:00:00.000Z')).toBeGreaterThan(0);
  });

  it('detects 5xx Axios errors and extracts API error messages', () => {
    const serverErr = new AxiosError('Server down', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 503,
      data: { message: 'Service unavailable' },
    } as AxiosResponse);
    const validationErr = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      data: { message: ['price must be positive', 'name should not be empty'] },
    } as AxiosResponse);

    expect(isServerError(serverErr)).toBe(true);
    expect(isServerError(validationErr)).toBe(false);
    expect(isServerError(new Error('Plain'))).toBe(false);

    expect(extractApiError(serverErr, 'Fallback')).toBe('Service unavailable');
    expect(extractApiError(validationErr, 'Fallback')).toBe(
      'price must be positive, name should not be empty',
    );
    expect(extractApiError(new Error('Other'), 'Fallback')).toBe('Fallback');
  });

  it('logs errors via console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError(new Error('Boom'), { componentStack: '\n  at App' });
    expect(spy).toHaveBeenCalledWith('Boom', '\n  at App');
    spy.mockRestore();
  });
});
