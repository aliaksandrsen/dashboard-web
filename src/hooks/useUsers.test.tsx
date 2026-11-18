import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUsers } from './useUsers';

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

describe('useUsers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches users list with optional search filter', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [{ id: 1, name: 'Jane', email: 'jane@example.com', address: '1st Ave', orders: [] }],
    });

    const { result } = renderHook(() => useUsers('Jane'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.usersAreLoading).toBe(false);
    });

    expect(axios.get).toHaveBeenCalledWith('/v1/users', { params: { search: 'Jane' } });
    expect(result.current.usersData?.[0].name).toBe('Jane');
  });

  it('does not fetch when rendered without QueryClientProvider', () => {
    const { result } = renderHook(() => useUsers());
    expect(result.current.usersData).toBeUndefined();
    expect(axios.get).not.toHaveBeenCalled();
  });
});
