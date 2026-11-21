import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OrderDetails from '.';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
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
          <Route path="/orders" element={<div>Orders Home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<OrderDetails />', () => {
  beforeEach(() => {
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
            products: [
              {
                id: 'p-1',
                name: 'Steel Computer',
                price: 237.13,
                stripeProductId: null,
                stripePriceId: null,
                createdAt: '2026-05-01T00:00:00.000Z',
                updatedAt: '2026-05-01T00:00:00.000Z',
              },
            ],
          },
        });
      }
      return Promise.reject(new Error('Not Found'));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders clean read-only order details with link to /orders/:id/edit and confirms delete', async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 3 } });

    renderOrderDetails('3');

    expect((await screen.findAllByText('$237.13')).length).toBeGreaterThan(0);
    expect(screen.getByText('Steel Computer')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Edit Order' }).getAttribute('href')).toBe(
      '/orders/3/edit',
    );
    expect(screen.queryByRole('button', { name: 'Save Order Changes' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Order' }));
    expect(screen.getByText('Delete order #3?')).toBeDefined();

    const confirmButtons = screen.getAllByRole('button', { name: 'Delete Order' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(await screen.findByText('Orders Home')).toBeDefined();
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/v1/orders/3');
    });
  });

  it('shows error state and retries when fetch fails', async () => {
    let shouldFail = true;
    vi.mocked(axios.get).mockImplementation(() => {
      if (shouldFail) {
        return Promise.reject(new Error('Not Found'));
      }
      return Promise.resolve({
        data: {
          id: 99,
          total: 100,
          stripeInvoiceId: null,
          createdAt: '2026-05-15T00:00:00.000Z',
          updatedAt: '2026-05-15T00:00:00.000Z',
          userId: null,
          user: null,
          products: [],
        },
      });
    });

    renderOrderDetails('99');
    expect(await screen.findByText('Order #99 could not be loaded.')).toBeDefined();

    shouldFail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('$100.00')).toBeDefined();
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
