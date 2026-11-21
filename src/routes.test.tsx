import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Router from './routes';

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

const renderAtRoute = (route: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Router />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<Router />', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/users') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Antonio West', email: 'a@b.com', address: '123 St', orders: [] }],
        });
      }
      if (url === '/v1/users/1') {
        return Promise.resolve({
          data: { id: 1, name: 'Antonio West', email: 'a@b.com', address: '123 St', orders: [] },
        });
      }
      if (url === '/v1/orders') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/v1/orders/3') {
        return Promise.resolve({
          data: {
            id: 3,
            total: 99,
            stripeInvoiceId: null,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-01T00:00:00.000Z',
            userId: 1,
            user: { id: 1, name: 'Antonio West', email: 'a@b.com', address: '123 St' },
            products: [],
          },
        });
      }
      if (url === '/v1/products') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/v1/products/p-1') {
        return Promise.resolve({
          data: {
            id: 'p-1',
            name: 'Mechanical Keyboard',
            price: 120,
            stripeProductId: 'prod_1',
            stripePriceId: 'price_1',
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-01T00:00:00.000Z',
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Dashboard on /', async () => {
    renderAtRoute('/');
    expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeDefined();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeDefined();
  });

  it.each([
    ['/orders', 'Orders'],
    ['/orders/new', 'Create Order'],
    ['/orders/3', 'Order #3'],
    ['/orders/3/edit', 'Edit Order #3'],
    ['/products', 'Products'],
    ['/products/new', 'Create Product'],
    ['/products/p-1', 'Mechanical Keyboard'],
    ['/products/p-1/edit', 'Edit Product'],
    ['/users', 'Users'],
    ['/users/new', 'Create User'],
    ['/users/1', 'Antonio West'],
    ['/users/1/edit', 'Edit User'],
    ['/settings', 'Settings'],
    ['/actions', 'Orders'],
    ['/non-existent-route', 'Page Not Found'],
  ])('resolves route %s to heading "%s"', async (route, heading) => {
    renderAtRoute(route);
    expect(
      await screen.findByRole('heading', { name: heading, level: 1 }, { timeout: 5000 }),
    ).toBeDefined();
  });

  it('catches 5xx API errors via layout ErrorBoundary and renders ErrorFallback', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const serverError = Object.assign(new Error('Server down'), {
      isAxiosError: true,
      response: { status: 500 },
    });

    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/orders') {
        return Promise.reject(serverError);
      }
      return Promise.resolve({ data: [] });
    });

    renderAtRoute('/');
    expect(await screen.findByText('Something weird happened')).toBeDefined();
    consoleSpy.mockRestore();
  });
});
