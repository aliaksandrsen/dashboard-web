import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ApiProduct, ApiUser } from '../../types/api';
import OrderForm from './OrderForm';

const mockProducts: ApiProduct[] = [
  {
    id: 'prod-1',
    name: 'Keyboard',
    price: 120,
    stripeProductId: null,
    stripePriceId: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'prod-2',
    name: 'Mouse',
    price: 45,
    stripeProductId: null,
    stripePriceId: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];

const mockUsers: ApiUser[] = [
  { id: 1, name: 'Antonio West', email: 'antonio@example.com', address: '123 Main' },
];

describe('<OrderForm />', () => {
  it('validates positive total amount and starts with aria-invalid="false"', async () => {
    const onSubmitOrder = vi.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <OrderForm
          mode="create"
          products={mockProducts}
          users={mockUsers}
          cancelTo="/orders"
          onSubmitOrder={onSubmitOrder}
        />
      </MemoryRouter>,
    );

    const totalInput = screen.getByLabelText(/Total Amount/);
    expect(totalInput.getAttribute('aria-invalid')).toBe('false');

    fireEvent.change(totalInput, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Order' }));

    expect(await screen.findByText('Total must be greater than 0')).toBeDefined();
    expect(totalInput.getAttribute('aria-invalid')).toBe('true');
    expect(onSubmitOrder).not.toHaveBeenCalled();
  });

  it('auto-calculates total from selected products, resets when all unchecked, and submits clean payload', async () => {
    const onSubmitOrder = vi.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <OrderForm
          mode="create"
          products={mockProducts}
          users={mockUsers}
          initialValues={{ userId: 1 }}
          cancelTo="/orders"
          onSubmitOrder={onSubmitOrder}
        />
      </MemoryRouter>,
    );

    const totalInput = screen.getByLabelText(/Total Amount/) as HTMLInputElement;
    const keyboardCheckbox = screen.getByLabelText(/Keyboard/);
    const mouseCheckbox = screen.getByLabelText(/Mouse/);

    fireEvent.click(keyboardCheckbox);
    expect(totalInput.value).toBe('120');

    // Unchecking the last selected product clears total instead of leaving stale price
    fireEvent.click(keyboardCheckbox);
    expect(totalInput.value).toBe('');

    fireEvent.click(keyboardCheckbox);
    fireEvent.click(mouseCheckbox);
    expect(totalInput.value).toBe('165');

    fireEvent.click(screen.getByRole('button', { name: 'Create Order' }));

    await waitFor(() => {
      expect(onSubmitOrder).toHaveBeenCalledWith({
        total: 165,
        userId: 1,
        stripeInvoiceId: null,
        productIds: ['prod-1', 'prod-2'],
      });
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <OrderForm
          mode="create"
          products={mockProducts}
          users={mockUsers}
          cancelTo="/orders"
          onSubmitOrder={vi.fn()}
        />
      </MemoryRouter>,
    );
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
