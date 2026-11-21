import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OrderEdit from '.';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      patch: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const OrderViewTarget = () => {
  const location = useLocation();
  const flash = (location.state as { flash?: { text: string } } | null)?.flash?.text;
  return <div>Order View: {flash}</div>;
};

const renderOrderEdit = (orderId = '3') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/orders/${orderId}/edit`]}>
        <Routes>
          <Route path="/orders/:id/edit" element={<OrderEdit />} />
          <Route path="/orders/:id" element={<OrderViewTarget />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<OrderEdit />', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/orders/3') {
        return Promise.resolve({
          data: {
            id: 3,
            total: 200,
            stripeInvoiceId: 'in_old',
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-01T00:00:00.000Z',
            userId: 1,
            user: { id: 1, name: 'Alice', email: 'alice@example.com', address: '123 St' },
            products: [{ id: 'p-1', name: 'Monitor', price: 200 }],
          },
        });
      }
      if (url === '/v1/products') {
        return Promise.resolve({ data: [{ id: 'p-1', name: 'Monitor', price: 200 }] });
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

  it('submits PATCH with explicit null when unassigning customer and clearing invoice, then redirects to /orders/:id', async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: { id: 3, total: 250 } });

    renderOrderEdit('3');
    expect(await screen.findByDisplayValue('200')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Stripe Invoice ID/), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Total Amount/), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Order Changes' }));

    expect(await screen.findByText('Order View: Order #3 updated successfully.')).toBeDefined();
    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/v1/orders/3', {
        total: 250,
        userId: null,
        stripeInvoiceId: null,
        productIds: ['p-1'],
      });
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderOrderEdit('3');
    await screen.findByDisplayValue('200');
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
