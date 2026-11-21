import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOrder, useOrders } from './useOrders';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useOrders hooks', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches orders list with optional userId filter', async () => {
    const sampleOrders = [
      {
        id: 1,
        total: 120,
        stripeInvoiceId: null,
        createdAt: '2026-06-24T00:00:00.000Z',
        updatedAt: '2026-06-24T00:00:00.000Z',
        userId: 5,
      },
    ];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: sampleOrders });

    const { result } = renderHook(() => useOrders(5), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(axios.get).toHaveBeenCalledWith('/v1/orders', { params: { userId: 5 } });
    expect(result.current.data).toEqual(sampleOrders);
  });

  it('fetches a single order by id', async () => {
    const sampleOrder = {
      id: 7,
      total: 88,
      stripeInvoiceId: 'in_123',
      createdAt: '2026-06-24T00:00:00.000Z',
      updatedAt: '2026-06-24T00:00:00.000Z',
      userId: null,
    };
    vi.mocked(axios.get).mockResolvedValueOnce({ data: sampleOrder });

    const { result } = renderHook(() => useOrder('7'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(axios.get).toHaveBeenCalledWith('/v1/orders/7');
    expect(result.current.data).toEqual(sampleOrder);
  });
});
