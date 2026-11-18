import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useProducts } from './useProducts';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
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

describe('useProducts', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches products with optional search query parameter', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [{ id: 'p-1', name: 'Soap', price: 12.5, stripeProductId: null }],
    });

    const { result } = renderHook(() => useProducts('Soap'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.productsAreLoading).toBe(false);
    });

    expect(axios.get).toHaveBeenCalledWith('/v1/products', { params: { search: 'Soap' } });
    expect(result.current.productsData?.[0].name).toBe('Soap');
  });

  it('does not crash or issue network requests when rendered without QueryClientProvider', () => {
    const { result } = renderHook(() => useProducts());
    expect(result.current.productsData).toBeUndefined();
    expect(axios.get).not.toHaveBeenCalled();
  });
});
