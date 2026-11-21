import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Products from '.';

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

const renderProducts = (state?: unknown) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: '/products', state }]}>
        <Products />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const sampleProducts = [
  {
    id: 'uuid-1',
    name: 'Fullstack JS Book',
    price: 49.99,
    stripeProductId: 'prod_123',
    stripePriceId: 'price_123',
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
  },
];

describe('<Products />', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockResolvedValue({ data: sampleProducts });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders clean catalog table with top search toolbar, Create Product link, and flash banner', async () => {
    renderProducts({
      flash: { type: 'success', text: 'Product "Fullstack JS Book" created successfully.' },
    });

    expect(await screen.findByText('Fullstack JS Book')).toBeDefined();
    expect(screen.getByText('Product "Fullstack JS Book" created successfully.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Create Product' }).getAttribute('href')).toBe(
      '/products/new',
    );
    expect(screen.getByRole('link', { name: 'Edit Fullstack JS Book' }).getAttribute('href')).toBe(
      '/products/uuid-1/edit',
    );
    expect(screen.queryByRole('button', { name: 'Sync Stripe Orders' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Search products'), { target: { value: 'Book' } });
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/v1/products', { params: { search: 'Book' } });
    });
  });

  it('confirms deletion via dialog before calling DELETE /v1/products/:id', async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 'uuid-1' } });

    renderProducts();
    expect(await screen.findByText('Fullstack JS Book')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Fullstack JS Book' }));
    expect(screen.getByText('Delete "Fullstack JS Book"?')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Product' }));
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
