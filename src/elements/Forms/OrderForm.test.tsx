import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OrderForm from '.';

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

const mockProducts = [
  { id: 'prod-1', name: 'Keyboard', price: 120 },
  { id: 'prod-2', name: 'Mouse', price: 45 },
];

const mockUsers = [
  {
    id: 1,
    name: 'Antonio West',
    email: 'antonio@example.com',
    address: '123 Main',
    joinedDate: '2025-01-01',
    recentOrders: 1,
    newProducts: 2,
    nextDeliveryDate: '',
  },
];

describe('<OrderForm />', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('validates positive total amount and starts with aria-invalid="false"', async () => {
    render(<OrderForm products={mockProducts} users={mockUsers} />);

    const totalInput = screen.getByLabelText(/Total Amount/);
    expect(totalInput.getAttribute('aria-invalid')).toBe('false');

    fireEvent.change(totalInput, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Order' }));

    expect(await screen.findByText('Total must be greater than 0')).toBeDefined();
    expect(totalInput.getAttribute('aria-invalid')).toBe('true');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('auto-calculates total from selected products and submits POST /v1/orders', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        id: 42,
        total: 165,
        userId: 1,
        createdAt: '2025-07-01T10:00:00.000Z',
        updatedAt: '2025-07-01T10:00:00.000Z',
        products: mockProducts,
      },
    });
    const onOrderCreated = vi.fn();

    render(
      <OrderForm
        products={mockProducts}
        users={mockUsers}
        defaultUserId={1}
        onOrderCreated={onOrderCreated}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Keyboard/));
    fireEvent.click(screen.getByLabelText(/Mouse/));
    fireEvent.click(screen.getByRole('button', { name: 'Create Order' }));

    expect(await screen.findByText(/Order #42 created successfully/)).toBeDefined();
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/v1/orders', {
        total: 165,
        userId: 1,
        productIds: ['prod-1', 'prod-2'],
      });
      expect(onOrderCreated).toHaveBeenCalledTimes(1);
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(<OrderForm products={mockProducts} users={mockUsers} />);
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
