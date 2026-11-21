import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUser, useUsers } from './useUsers';

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

describe('useUsers hooks', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches users list with optional search', async () => {
    const sample = [
      { id: 1, name: 'Alice Smith', email: 'alice@example.com', address: '10 Main St', orders: [] },
    ];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: sample });

    const { result } = renderHook(() => useUsers('Alice'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(axios.get).toHaveBeenCalledWith('/v1/users', { params: { search: 'Alice' } });
    expect(result.current.data).toEqual(sample);
  });

  it('fetches a single user by id', async () => {
    const sample = {
      id: 1,
      name: 'Alice Smith',
      email: 'alice@example.com',
      address: '10 Main St',
      orders: [],
    };
    vi.mocked(axios.get).mockResolvedValueOnce({ data: sample });

    const { result } = renderHook(() => useUser('1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(axios.get).toHaveBeenCalledWith('/v1/users/1');
    expect(result.current.data).toEqual(sample);
  });
});
