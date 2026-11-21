import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Orders from '.';

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

const renderOrders = (state?: unknown) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: '/orders', state }]}>
        <Orders />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<Orders />', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/orders') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              total: 100,
              stripeInvoiceId: 'in_1',
              createdAt: '2026-06-20T00:00:00.000Z',
              updatedAt: '2026-06-20T00:00:00.000Z',
              userId: 1,
              user: { id: 1, name: 'Alice', email: 'alice@example.com', address: '123 St' },
              products: [{ id: 'p-1', name: 'Keyboard', price: 100 }],
            },
            {
              id: 2,
              total: 55,
              stripeInvoiceId: null,
              createdAt: '2026-06-21T00:00:00.000Z',
              updatedAt: '2026-06-21T00:00:00.000Z',
              userId: null,
              user: null,
              products: [{ id: 'p-2', name: 'Mouse', price: 55 }],
            },
          ],
        });
      }
      if (url === '/v1/users') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Alice', email: 'alice@example.com', address: '123 St' }],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('filters orders from top toolbar and displays flash messages', async () => {
    renderOrders({ flash: { type: 'success', text: 'Order #1 created successfully.' } });

    expect(await screen.findByText('Order #1 created successfully.')).toBeDefined();
    expect(await screen.findByText('#1')).toBeDefined();
    expect(screen.getByText('#2')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Filter by source'), { target: { value: 'stripe' } });
    expect(screen.getByText('#1')).toBeDefined();
    expect(screen.queryByText('#2')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('#2')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Filter by customer'), {
      target: { value: 'unassigned' },
    });
    expect(screen.getByText('#2')).toBeDefined();
    expect(screen.queryByText('#1')).toBeNull();
  });

  it('confirms deletion via native dialog before calling DELETE /v1/orders/:id', async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 1 } });

    renderOrders();
    expect(await screen.findByText('#1')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete order #1' }));
    expect(screen.getByText('Delete order #1?')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Order' }));
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/v1/orders/1');
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderOrders();
    await screen.findByText('#1');
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
