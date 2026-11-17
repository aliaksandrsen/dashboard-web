import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios, { AxiosError, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrderStatus } from './UserInfo.State';
import useUserInfo, { isServerError } from './useUserInfo';

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

  it('normalizes NestJS backend array payloads from /v1/orders and /v1/users', async () => {
    const backendOrders = [
      {
        id: 1,
        total: 120.5,
        stripeInvoiceId: 'in_abc',
        createdAt: '2025-07-10T00:00:00.000Z',
        updatedAt: '2025-07-12T00:00:00.000Z',
        userId: 1,
        products: [{ id: 'p-1', name: 'Ergonomic Keyboard', price: 120.5 }],
      },
    ];
    const backendUsers = [
      {
        id: 1,
        email: 'jane@example.com',
        name: 'Jane Doe',
        address: '123 Market St',
        orders: backendOrders,
      },
    ];

    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/orders') {
        return Promise.resolve({ data: backendOrders });
      }
      if (url === '/v1/users') {
        return Promise.resolve({ data: backendUsers });
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

    expect(result.current.orderData).toHaveLength(1);
    expect(result.current.orderData?.[0].productName).toBe('Ergonomic Keyboard');
    expect(result.current.orderData?.[0].totalAmount).toBe(120.5);
    expect(result.current.orderData?.[0].status).toBe(OrderStatus.Shipped);
    expect(result.current.userData?.name).toBe('Jane Doe');
    expect(result.current.userData?.email).toBe('jane@example.com');
    expect(result.current.userData?.recentOrders).toBe(1);
  });

  it('identifies 5xx Axios errors for ErrorBoundary propagation', () => {
    const serverError = new AxiosError(
      'Internal Server Error',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      { status: 500 } as AxiosResponse,
    );
    const clientError = new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 404,
    } as AxiosResponse);

    expect(isServerError(serverError)).toBe(true);
    expect(isServerError(clientError)).toBe(false);
    expect(isServerError(new Error('Generic error'))).toBe(false);
  });
});
