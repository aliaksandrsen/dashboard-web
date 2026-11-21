import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductDetails from '.';
import * as navigationUtils from '../../utils/navigation';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      post: vi.fn(),
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
          <Route path="/products" element={<div>Products Home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<ProductDetails />', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        id: 'uuid-1',
        name: 'Wireless Mouse',
        price: 49.99,
        stripeProductId: 'prod_mouse',
        stripePriceId: 'price_mouse',
        createdAt: '2026-06-24T00:00:00.000Z',
        updatedAt: '2026-06-25T00:00:00.000Z',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders product details, pre-fills stripePriceId for checkout, and posts /v1/stripe/payments', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { sessionId: 'cs_1', url: 'https://checkout.stripe.com/pay/cs_1' },
    });
    const redirectSpy = vi
      .spyOn(navigationUtils, 'redirectToExternalUrl')
      .mockImplementation(() => {});

    renderProductDetails('uuid-1');

    expect(await screen.findByText('$49.99')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Edit Product' }).getAttribute('href')).toBe(
      '/products/uuid-1/edit',
    );
    expect((screen.getByLabelText(/Stripe Price ID/) as HTMLInputElement).value).toBe(
      'price_mouse',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pay $49.99 with Stripe' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/v1/stripe/payments', {
        priceId: 'price_mouse',
        quantity: 1,
      });
      expect(redirectSpy).toHaveBeenCalledWith('https://checkout.stripe.com/pay/cs_1');
    });

    redirectSpy.mockRestore();
  });

  it('confirms delete via dialog and navigates back to /products', async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 'uuid-1' } });

    renderProductDetails('uuid-1');
    expect(await screen.findByText('$49.99')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Product' }));
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete Product' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(await screen.findByText('Products Home')).toBeDefined();
    expect(axios.delete).toHaveBeenCalledWith('/v1/products/uuid-1');
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderProductDetails('uuid-1');
    await screen.findByText('$49.99');
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
