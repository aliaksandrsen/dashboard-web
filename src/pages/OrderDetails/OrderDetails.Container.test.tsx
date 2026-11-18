import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OrderDetails from '.';
import { userStore } from '../UserInfo/UserInfo.State';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const renderOrderDetails = (orderId = '3') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/" element={<div>Orders Home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<OrderDetails />', () => {
  beforeEach(() => {
    userStore.user = {
      id: 1,
      name: 'Antonio West',
      joinedDate: '2025-01-01',
      recentOrders: 1,
      newProducts: 1,
      nextDeliveryDate: '',
    };

    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/orders/3') {
        return Promise.resolve({
          data: {
            id: 3,
            total: 237.13,
            stripeInvoiceId: null,
            createdAt: '2026-05-15T14:46:36.630Z',
            updatedAt: '2026-05-16T14:46:36.630Z',
            userId: 1,
            user: {
              id: 1,
              name: 'Antonio West',
              email: 'antonio@example.com',
              address: '123 Main',
            },
            products: [{ id: 'p-1', name: 'Steel Computer', price: 237.13 }],
          },
        });
      }
      if (url === '/v1/products') {
        return Promise.resolve({ data: [{ id: 'p-1', name: 'Steel Computer', price: 237.13 }] });
      }
      if (url === '/v1/users') {
        return Promise.resolve({
          data: [
            { id: 1, name: 'Antonio West', email: 'antonio@example.com', address: '123 Main' },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads order details and updates order via PATCH /v1/orders/:id', async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: { id: 3, total: 500 } });

    renderOrderDetails('3');

    expect((await screen.findAllByText('$237.13')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Steel Computer').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Total Amount (USD)'), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Order Changes' }));

    expect(await screen.findByText('Order #3 updated successfully.')).toBeDefined();
    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/v1/orders/3', {
        total: 500,
        userId: 1,
        productIds: ['p-1'],
      });
    });
  });

  it('deletes order after confirmation and navigates back to /', async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 3 } });

    renderOrderDetails('3');
    expect((await screen.findAllByText('$237.13')).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));

    expect(await screen.findByText('Orders Home')).toBeDefined();
    expect(axios.delete).toHaveBeenCalledWith('/v1/orders/3');
  });

  it('shows loading indicator, handles fetch error with retry, and displays PATCH error', async () => {
    let shouldFailOrder999 = true;

    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/orders/99') {
        return new Promise(() => {});
      }
      if (url === '/v1/orders/999') {
        if (shouldFailOrder999) {
          return Promise.reject(new Error('Not Found'));
        }
        return Promise.resolve({
          data: { id: 999, total: 100, userId: 1, products: [] },
        });
      }
      if (url === '/v1/products' || url === '/v1/users') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    const { unmount } = renderOrderDetails('99');
    expect(screen.getByTestId('order-details-loading')).toBeDefined();
    unmount();

    renderOrderDetails('999');
    expect(await screen.findByText('Order #999 could not be loaded.')).toBeDefined();

    shouldFailOrder999 = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('$100.00')).toBeDefined();

    vi.mocked(axios.patch).mockRejectedValueOnce(new Error('Patch failed'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Order Changes' }));
    expect(await screen.findByText('Failed to update order.')).toBeDefined();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderOrderDetails('3');
    expect((await screen.findAllByText('$237.13')).length).toBeGreaterThan(0);
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
