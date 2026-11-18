import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductDetails from '.';
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

const renderProductDetails = (productId = 'uuid-1') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/products/${productId}`]}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/products" element={<div>Products Catalog</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<ProductDetails />', () => {
  beforeEach(() => {
    userStore.user = {
      id: 1,
      name: 'Antonio West',
      joinedDate: '2025-01-01',
      recentOrders: 1,
      newProducts: 1,
      nextDeliveryDate: '',
    };

    vi.mocked(axios.get).mockResolvedValue({
      data: {
        id: 'uuid-1',
        name: 'Fullstack JS Book',
        price: 49.99,
        stripeProductId: 'prod_123',
        createdAt: '2026-11-02T18:55:12.982Z',
        updatedAt: '2026-11-02T18:55:12.982Z',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads product details and updates via PATCH /v1/products/:id', async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({
      data: { id: 'uuid-1', name: 'Updated Book', price: 59.99 },
    });

    renderProductDetails('uuid-1');

    expect(await screen.findByText('$49.99')).toBeDefined();
    expect(screen.getByText('prod_123')).toBeDefined();
    expect(await screen.findByDisplayValue('prod_123')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Updated Book' } });
    fireEvent.change(screen.getByLabelText('Price (USD)'), { target: { value: '59.99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Product Changes' }));

    expect(await screen.findByText('Product "Updated Book" updated.')).toBeDefined();
    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/v1/products/uuid-1', {
        name: 'Updated Book',
        price: 59.99,
        stripeProductId: 'prod_123',
      });
    });
  });

  it('deletes product and navigates to /products', async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 'uuid-1' } });

    renderProductDetails('uuid-1');
    expect(await screen.findByText('$49.99')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Product' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));

    expect(await screen.findByText('Products Catalog')).toBeDefined();
    expect(axios.delete).toHaveBeenCalledWith('/v1/products/uuid-1');
  });

  it('shows loading spinner, handles error with retry, and displays update errors', async () => {
    vi.mocked(axios.get).mockImplementationOnce(() => new Promise(() => {}));
    renderProductDetails('uuid-loading');
    expect(screen.getByTestId('product-details-loading')).toBeDefined();

    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Not found'));
    renderProductDetails('uuid-missing');
    expect(await screen.findByText('Product could not be loaded.')).toBeDefined();

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { id: 'uuid-missing', name: 'Recovered Product', price: 25 },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('$25.00')).toBeDefined();

    vi.mocked(axios.patch).mockRejectedValueOnce(new Error('Update failed'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Product Changes' }));
    expect(await screen.findByText('Failed to update product.')).toBeDefined();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderProductDetails('uuid-1');
    expect(await screen.findByText('$49.99')).toBeDefined();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
