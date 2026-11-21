import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '.';

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

const renderDashboard = (route = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<Dashboard />', () => {
  beforeEach(() => {
    const recentIso = new Date().toISOString();
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/orders') {
        return Promise.resolve({
          data: [
            {
              id: 10,
              total: 150,
              stripeInvoiceId: 'in_1',
              createdAt: recentIso,
              updatedAt: recentIso,
              userId: 1,
              user: { id: 1, name: 'Alice', email: 'alice@example.com', address: '123 Main' },
              products: [{ id: 'p-1', name: 'Desk Lamp', price: 150 }],
            },
            {
              id: 11,
              total: 50,
              stripeInvoiceId: null,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
              userId: null,
              user: null,
              products: [],
            },
          ],
        });
      }
      if (url === '/v1/products') {
        return Promise.resolve({
          data: [
            {
              id: 'p-1',
              name: 'Desk Lamp',
              price: 150,
              stripeProductId: 'prod_1',
              stripePriceId: 'price_1',
              createdAt: recentIso,
              updatedAt: recentIso,
            },
          ],
        });
      }
      if (url === '/v1/users') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Alice', email: 'alice@example.com', address: '123 Main' }],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays real 30-day order count, total revenue, and previews', async () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeDefined();
    expect(await screen.findByText('$200.00')).toBeDefined();
    expect(screen.getByText('2 total orders')).toBeDefined();
    expect(screen.getByText('$150.00 in last 30 days')).toBeDefined();
    expect(screen.getByRole('link', { name: /Order #10 — Desk Lamp/ })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Desk Lamp' })).toBeDefined();
  });

  it('shows Stripe checkout success banner on /?success=true', async () => {
    renderDashboard('/?success=true');

    expect(await screen.findByText(/Stripe checkout completed successfully/)).toBeDefined();
  });

  it('shows Stripe checkout canceled banner on /?canceled=true', async () => {
    renderDashboard('/?canceled=true');

    expect(await screen.findByText('Stripe checkout was canceled.')).toBeDefined();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderDashboard();
    await screen.findByText('$200.00');
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
