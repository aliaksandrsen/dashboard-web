import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Products from '.';
import { productStore, userStore } from '../UserInfo/UserInfo.State';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const renderProducts = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Products />
    </QueryClientProvider>,
  );
};

const sampleProducts = [
  {
    id: 'uuid-1',
    name: 'Fullstack JS Book',
    price: 49.99,
    stripeProductId: 'prod_123',
    createdAt: '2025-06-24T00:00:00.000Z',
  },
];

describe('<Products />', () => {
  beforeEach(() => {
    productStore.products = [];
    productStore.search = '';
    userStore.user = {
      id: 1,
      name: 'Some Body',
      joinedDate: '10/21/2002',
      recentOrders: 2,
      newProducts: 6,
      nextDeliveryDate: '07/27/2025',
    };

    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/products') return Promise.resolve({ data: sampleProducts });
      if (url === '/v1/users') return Promise.resolve({ data: userStore.user });
      if (url === '/v1/orders') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads products catalog and triggers Stripe orders sync', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        message: 'Stripe orders synchronization triggered successfully',
        result: { processed: 3, created: 1, skipped: 2 },
      },
    });

    renderProducts();

    expect(await screen.findByText('Fullstack JS Book')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Sync Stripe Orders' }));
    expect(
      await screen.findByText(
        /Stripe orders synchronization triggered successfully \(processed: 3, created: 1, skipped: 2\)/,
      ),
    ).toBeDefined();
  });

  it('creates and deletes a product via backend endpoints', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { id: 'uuid-2', name: 'New Gadget', price: 99, stripeProductId: 'prod_456' },
    });
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 'uuid-1' } });

    renderProducts();

    await screen.findByText('Fullstack JS Book');

    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'New Gadget' } });
    fireEvent.change(screen.getByLabelText('Price (USD)'), { target: { value: '99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Product' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/v1/products', {
        name: 'New Gadget',
        price: 99,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Fullstack JS Book' }));
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/v1/products/uuid-1');
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderProducts();
    await screen.findByText('Fullstack JS Book');

    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
