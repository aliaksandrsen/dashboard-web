import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ApiOrder } from '../../types/api';
import OrdersTable from '.';

const makeOrder = (id: number, overrides: Partial<ApiOrder> = {}): ApiOrder => ({
  id,
  total: id * 50,
  stripeInvoiceId: id % 2 === 0 ? `in_${id}` : null,
  createdAt: `2026-06-${String(id).padStart(2, '0')}T12:00:00.000Z`,
  updatedAt: `2026-06-${String(id).padStart(2, '0')}T12:00:00.000Z`,
  userId: id === 3 ? null : 1,
  user:
    id === 3
      ? null
      : { id: 1, name: `Customer ${id}`, email: `c${id}@example.com`, address: '123 St' },
  products: [
    {
      id: `p-${id}`,
      name: `Product ${id}`,
      price: id * 50,
      stripeProductId: null,
      stripePriceId: null,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    },
  ],
  ...overrides,
});

const sampleOrders: ApiOrder[] = [1, 2, 3, 4, 5, 6, 7].map((id) => makeOrder(id));

describe('<OrdersTable />', () => {
  it('renders honest backend columns, links, and pagination', () => {
    render(
      <MemoryRouter>
        <OrdersTable orders={sampleOrders} pageSize={6} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('table', { name: 'orders-table' })).toBeDefined();
    expect(screen.getByText('#1')).toBeDefined();
    expect(screen.getByText('Customer 1')).toBeDefined();
    expect(screen.getByText('Unassigned')).toBeDefined();
    expect(screen.getByText('$50.00')).toBeDefined();
    expect(screen.getAllByText('Stripe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Manual').length).toBeGreaterThan(0);

    // 7 items with pageSize=6 puts order #7 on page 2
    expect(screen.queryByText('#7')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(screen.getByText('#7')).toBeDefined();
  });

  it('sorts columns via header buttons and updates aria-sort and live region', () => {
    render(
      <MemoryRouter>
        <OrdersTable orders={sampleOrders} />
      </MemoryRouter>,
    );

    const totalBtn = screen.getByRole('button', { name: 'Total' });
    const totalTh = totalBtn.closest('th');
    expect(totalTh?.getAttribute('aria-sort')).toBeNull();

    fireEvent.click(totalBtn);
    expect(totalTh?.getAttribute('aria-sort')).toBe('ascending');
    expect(screen.getByRole('status').textContent).toContain('Sorted by Total, ascending, 7 rows');

    fireEvent.click(totalBtn);
    expect(totalTh?.getAttribute('aria-sort')).toBe('descending');
  });

  it('links to view/edit routes and invokes onDeleteOrder callback', () => {
    const onDeleteOrder = vi.fn();
    render(
      <MemoryRouter>
        <OrdersTable orders={sampleOrders} onDeleteOrder={onDeleteOrder} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'View order #1' }).getAttribute('href')).toBe(
      '/orders/1',
    );
    expect(screen.getByRole('link', { name: 'Edit order #1' }).getAttribute('href')).toBe(
      '/orders/1/edit',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete order #1' }));
    expect(onDeleteOrder).toHaveBeenCalledWith(sampleOrders[0]);
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <OrdersTable orders={sampleOrders} />
      </MemoryRouter>,
    );
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
