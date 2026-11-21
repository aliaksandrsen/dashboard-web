import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useProduct, useProducts } from './useProducts';

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

describe('useProducts hooks', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches products with trimmed search query', async () => {
    const sample = [
      {
        id: 'p-1',
        name: 'Wireless Mouse',
        price: 49.99,
        stripeProductId: 'prod_1',
        stripePriceId: 'price_1',
        createdAt: '2026-06-24T00:00:00.000Z',
        updatedAt: '2026-06-24T00:00:00.000Z',
      },
    ];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: sample });

    const { result } = renderHook(() => useProducts('  Mouse  '), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(axios.get).toHaveBeenCalledWith('/v1/products', { params: { search: 'Mouse' } });
    expect(result.current.data).toEqual(sample);
  });

  it('fetches single product by id', async () => {
    const sample = {
      id: 'p-1',
      name: 'Wireless Mouse',
      price: 49.99,
      stripeProductId: 'prod_1',
      stripePriceId: 'price_1',
      createdAt: '2026-06-24T00:00:00.000Z',
      updatedAt: '2026-06-24T00:00:00.000Z',
    };
    vi.mocked(axios.get).mockResolvedValueOnce({ data: sample });

    const { result } = renderHook(() => useProduct('p-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(axios.get).toHaveBeenCalledWith('/v1/products/p-1');
    expect(result.current.data).toEqual(sample);
  });
});
