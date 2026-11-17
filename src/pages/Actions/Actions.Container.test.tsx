import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Actions from '.';
import { OrderStatus, orderStore, productStore, userStore } from '../UserInfo/UserInfo.State';

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

const renderActions = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Actions />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<Actions />', () => {
  beforeEach(() => {
    orderStore.orders = [];
    userStore.user = {
      id: 1,
      name: '',
      email: 'some.body@email.com',
      address: '3194 W. Hamfort Rd.',
      joinedDate: '10/21/2002',
      recentOrders: 2,
      newProducts: 6,
      nextDeliveryDate: '07/27/2025',
    };
    productStore.products = [];

    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/v1/orders') {
        return Promise.resolve({
          data: [
            {
              id: '1',
              productName: 'Fancy oils',
              status: OrderStatus.Pending,
              orderedDate: '06/27/2025',
              deliveryDate: '06/30/2025',
              totalAmount: 200,
              hasBeenReviewed: false,
            },
          ],
        });
      }
      if (url === '/v1/users') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Some Body',
            email: 'some.body@email.com',
            address: '3194 W. Hamfort Rd.',
            joinedDate: '10/21/2002',
            recentOrders: 2,
            newProducts: 6,
            nextDeliveryDate: '07/27/2025',
          },
        });
      }
      if (url === '/v1/products') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Changes you can make heading, 3 action cards, profile form, and order form', async () => {
    renderActions();

    expect(await screen.findByText('Fancy oils')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Changes you can make' })).toBeDefined();
    expect(screen.getByText('Recent orders')).toBeDefined();
    expect(screen.getByText('Your digital products')).toBeDefined();
    expect(screen.getByText('Beta products')).toBeDefined();
    expect(screen.getByText('Carpentry Book')).toBeDefined();
    expect(screen.getByDisplayValue('3194 W. Hamfort Rd.')).toBeDefined();
  });

  it('updates order status and cancels order via backend endpoints', async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: { id: 1, total: 200 } });
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 1 } });

    renderActions();
    expect(await screen.findByText('Fancy oils')).toBeDefined();
    expect(await screen.findByText('Some Body')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/v1/orders/1', { total: 200 });
    });
    expect(orderStore.orders[0].status).toBe(OrderStatus.Shipped);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel Fancy oils' }));
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/v1/orders/1');
      expect(orderStore.orders).toHaveLength(0);
    });
  });

  it('submits updated user profile to PATCH /v1/users/:id', async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({
      data: {
        id: 1,
        name: 'Updated Name',
        email: 'updated@email.com',
        address: '500 New Ave',
      },
    });

    renderActions();
    expect(await screen.findByText('Some Body')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '500 New Ave' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated Name' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'updated@email.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }));

    expect(await screen.findByText('Profile updated successfully')).toBeDefined();
    expect(axios.patch).toHaveBeenCalledWith('/v1/users/1', {
      address: '500 New Ave',
      name: 'Updated Name',
      email: 'updated@email.com',
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderActions();
    expect(await screen.findByText('Fancy oils')).toBeDefined();
    expect(await screen.findByText('Some Body')).toBeDefined();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
