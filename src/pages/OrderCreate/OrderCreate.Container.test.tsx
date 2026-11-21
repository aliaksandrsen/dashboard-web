import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OrderCreate from '.';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      post: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const OrdersRedirectTarget = () => {
  const location = useLocation();
  const flash = (location.state as { flash?: { text: string } } | null)?.flash?.text;
  return <div>Orders List: {flash}</div>;
};

const renderOrderCreate = (route = '/orders/new') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/orders/new" element={<OrderCreate />} />
          <Route path="/orders" element={<OrdersRedirectTarget />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<OrderCreate />', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/products') {
        return Promise.resolve({
          data: [
            { id: 'p-1', name: 'Desk', price: 250, stripeProductId: null, stripePriceId: null },
          ],
        });
      }
      if (url === '/v1/users') {
        return Promise.resolve({
          data: [{ id: 5, name: 'Alice', email: 'alice@example.com', address: '123 St' }],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('preselects customer from query string, creates order, and redirects back to /orders', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { id: 42, total: 250 } });

    renderOrderCreate('/orders/new?userId=5');

    expect(await screen.findByText('Desk')).toBeDefined();
    expect((screen.getByLabelText('Customer') as HTMLSelectElement).value).toBe('5');

    fireEvent.click(screen.getByLabelText(/Desk/));
    fireEvent.click(screen.getByRole('button', { name: 'Create Order' }));

    expect(await screen.findByText('Orders List: Order #42 created successfully.')).toBeDefined();
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/v1/orders', {
        total: 250,
        userId: 5,
        productIds: ['p-1'],
      });
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderOrderCreate();
    await screen.findByText('Desk');
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
