import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProductCreate from '.';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      post: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const ProductsTarget = () => {
  const location = useLocation();
  const flash = (location.state as { flash?: { text: string } } | null)?.flash?.text;
  return <div>Products List: {flash}</div>;
};

const renderProductCreate = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/products/new']}>
        <Routes>
          <Route path="/products/new" element={<ProductCreate />} />
          <Route path="/products" element={<ProductsTarget />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<ProductCreate />', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a product and redirects back to /products with flash banner', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { id: 'p-new', name: 'USB Hub', price: 39.99 },
    });

    renderProductCreate();

    fireEvent.change(screen.getByLabelText(/Product Name/), { target: { value: 'USB Hub' } });
    fireEvent.change(screen.getByLabelText(/Price \(USD\)/), { target: { value: '39.99' } });
    fireEvent.change(screen.getByLabelText(/Existing Stripe Product ID/), {
      target: { value: 'prod_usb' },
    });
    fireEvent.change(screen.getByLabelText(/Existing Stripe Price ID/), {
      target: { value: 'price_usb' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Product' }));

    expect(
      await screen.findByText('Products List: Product "USB Hub" created successfully.'),
    ).toBeDefined();
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/v1/products', {
        name: 'USB Hub',
        price: 39.99,
        stripeProductId: 'prod_usb',
        stripePriceId: 'price_usb',
      });
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderProductCreate();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
