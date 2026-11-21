import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductEdit from '.';

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

const ProductViewTarget = () => {
  const location = useLocation();
  const flash = (location.state as { flash?: { text: string } } | null)?.flash?.text;
  return <div>Product View: {flash}</div>;
};

const renderProductEdit = (id = 'uuid-1') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/products/${id}/edit`]}>
        <Routes>
          <Route path="/products/:id/edit" element={<ProductEdit />} />
          <Route path="/products/:id" element={<ProductViewTarget />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<ProductEdit />', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        id: 'uuid-1',
        name: 'Wireless Mouse',
        price: 49.99,
        stripeProductId: 'prod_old',
        stripePriceId: 'price_old',
        createdAt: '2026-06-24T00:00:00.000Z',
        updatedAt: '2026-06-24T00:00:00.000Z',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('updates product, sends explicit null when clearing Stripe IDs, and redirects back to /products/:id', async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: { id: 'uuid-1' } });

    renderProductEdit('uuid-1');
    expect(await screen.findByDisplayValue('Wireless Mouse')).toBeDefined();

    fireEvent.change(screen.getByLabelText(/Product Name/), { target: { value: 'Pro Mouse' } });
    fireEvent.change(screen.getByLabelText(/Price \(USD\)/), { target: { value: '59.99' } });
    fireEvent.change(screen.getByLabelText(/Stripe Product ID/), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Stripe Price ID/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Product Changes' }));

    expect(
      await screen.findByText('Product View: Product "Pro Mouse" updated successfully.'),
    ).toBeDefined();
    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/v1/products/uuid-1', {
        name: 'Pro Mouse',
        price: 59.99,
        stripeProductId: null,
        stripePriceId: null,
      });
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderProductEdit('uuid-1');
    await screen.findByDisplayValue('Wireless Mouse');
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
