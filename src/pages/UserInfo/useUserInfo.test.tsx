import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrderStatus } from './UserInfo.State';
import useUserInfo from './useUserInfo';

vi.mock('axios');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUserInfo', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches orders and user info via axios', async () => {
    const mockOrders = [
      {
        id: '1',
        productName: 'Fancy soap',
        status: OrderStatus.Shipped,
        orderedDate: '06/24/2025',
        deliveryDate: '06/27/2025',
        totalAmount: 400,
        hasBeenReviewed: true,
      },
    ];
    const mockUser = {
      name: 'Some Body',
      joinedDate: '10/21/2002',
      recentOrders: 2,
      newProducts: 6,
      nextDeliveryDate: '07/27/2025',
    };

    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/orders') {
        return Promise.resolve({ data: mockOrders });
      }
      if (url === '/v1/users') {
        return Promise.resolve({ data: mockUser });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { result } = renderHook(() => useUserInfo(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.ordersAreLoading).toBe(false);
      expect(result.current.userIsLoading).toBe(false);
    });

    expect(result.current.orderData).toEqual(mockOrders);
    expect(result.current.userData).toEqual(mockUser);
    expect(result.current.ordersErrors).toBeNull();
    expect(result.current.userErrors).toBeNull();
  });
});
