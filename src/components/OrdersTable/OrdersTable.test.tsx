import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import OrdersTable from '.';
import { type Order, OrderStatus } from '../../pages/UserInfo/UserInfo.State';

const sampleOrders: Order[] = [
  {
    id: '1',
    productName: 'Fancy soap',
    status: OrderStatus.Shipped,
    orderedDate: '06/24/2025',
    deliveryDate: '06/27/2025',
    totalAmount: 400,
    hasBeenReviewed: true,
  },
  {
    id: '2',
    productName: 'Fancy oils',
    status: OrderStatus.Pending,
    orderedDate: '06/27/2025',
    deliveryDate: '06/30/2025',
    totalAmount: 200,
    hasBeenReviewed: false,
  },
  {
    id: '3',
    productName: 'Dog stuff',
    status: OrderStatus.Shipped,
    orderedDate: '06/18/2025',
    deliveryDate: '06/21/2025',
    totalAmount: 40,
    hasBeenReviewed: false,
  },
  {
    id: '4',
    productName: 'Grape soda',
    status: OrderStatus.OutOfStock,
    orderedDate: '06/24/2025',
    deliveryDate: '06/27/2025',
    totalAmount: 0,
    hasBeenReviewed: false,
  },
  {
    id: '5',
    productName: 'Sound equipment',
    status: OrderStatus.Shipped,
    orderedDate: '07/02/2025',
    deliveryDate: '07/05/2025',
    totalAmount: 30,
    hasBeenReviewed: true,
  },
  {
    id: '6',
    productName: 'Sno-cone machine',
    status: OrderStatus.Pending,
    orderedDate: '07/15/2025',
    deliveryDate: '07/18/2025',
    totalAmount: 400,
    hasBeenReviewed: false,
  },
  {
    id: '7',
    productName: 'Archer target',
    status: OrderStatus.Shipped,
    orderedDate: '07/20/2025',
    deliveryDate: '07/23/2025',
    totalAmount: 699,
    hasBeenReviewed: true,
  },
];

describe('<OrdersTable />', () => {
  it('renders orders table with status badges, formatted dates, amounts, and pagination', () => {
    render(<OrdersTable orders={sampleOrders} />);

    expect(screen.getByRole('table', { name: 'orders-table' })).toBeDefined();
    expect(screen.getByText('Fancy soap')).toBeDefined();
    expect(screen.getByText('No date available')).toBeDefined();
    expect(screen.getAllByText('$400.00').length).toBeGreaterThan(0);

    // 7 items with pageSize=6 should paginate Archer target onto page 2
    expect(screen.queryByText('Archer target')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(screen.getByText('Archer target')).toBeDefined();
  });

  it('filters orders by search query and status dropdown', () => {
    render(<OrdersTable orders={sampleOrders} />);

    fireEvent.change(screen.getByLabelText('Search orders'), {
      target: { value: 'Grape' },
    });
    expect(screen.getByText('Grape soda')).toBeDefined();
    expect(screen.queryByText('Fancy soap')).toBeNull();

    fireEvent.change(screen.getByLabelText('Search orders'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('Filter orders by status'), {
      target: { value: OrderStatus.Pending },
    });
    expect(screen.getByText('Fancy oils')).toBeDefined();
    expect(screen.queryByText('Fancy soap')).toBeNull();
  });

  it('sorts columns via button inside th and updates aria-sort and status region', () => {
    render(<OrdersTable orders={sampleOrders} />);

    const totalHeaderBtn = screen.getByRole('button', { name: 'Total Amount' });
    const totalHeaderCell = totalHeaderBtn.closest('th');
    expect(totalHeaderCell?.getAttribute('aria-sort')).toBeNull();

    fireEvent.click(totalHeaderBtn);
    expect(totalHeaderCell?.getAttribute('aria-sort')).toBe('ascending');
    expect(screen.getByRole('status').textContent).toContain(
      'Sorted by Total Amount, ascending, 7 rows',
    );

    fireEvent.click(totalHeaderBtn);
    expect(totalHeaderCell?.getAttribute('aria-sort')).toBe('descending');
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(<OrdersTable orders={sampleOrders} />);
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
