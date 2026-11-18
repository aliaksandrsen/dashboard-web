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
      if (url === '/v1/orders') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/v1/products') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders UserInfo dashboard on /', async () => {
    renderAtRoute('/');
    expect(await screen.findByRole('heading', { name: 'All orders' })).toBeDefined();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeDefined();
  });

  it('lazy-loads /products, /users, /actions, and /settings routes', async () => {
    renderAtRoute('/products');
    expect(await screen.findByRole('heading', { name: 'Products Catalog' })).toBeDefined();

    renderAtRoute('/users');
    expect(await screen.findByRole('heading', { name: 'Users Directory' })).toBeDefined();

    renderAtRoute('/actions');
    expect(await screen.findByRole('heading', { name: 'Changes you can make' })).toBeDefined();

    renderAtRoute('/settings');
    expect(await screen.findByRole('heading', { name: 'Account & System Settings' })).toBeDefined();
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
