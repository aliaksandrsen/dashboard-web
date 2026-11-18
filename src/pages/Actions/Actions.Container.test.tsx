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
      newProducts: 0,
      nextDeliveryDate: '07/27/2025',
    };
    userStore.users = [];
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
          data: [
            {
              id: 1,
              name: 'Some Body',
              email: 'some.body@email.com',
              address: '3194 W. Hamfort Rd.',
              orders: [{ id: 1, total: 200 }],
            },
          ],
        });
      }
      if (url === '/v1/products') {
        return Promise.resolve({
          data: [{ id: 'p-1', name: 'Steel Computer', price: 519.57 }],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders real orders, products, customers cards, order form, and profile form', async () => {
    renderActions();

    expect(await screen.findByText('Fancy oils')).toBeDefined();
    expect((await screen.findAllByText('Steel Computer')).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Changes you can make' })).toBeDefined();
    expect(screen.getByText('Recent orders')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Products' })).toBeDefined();
    expect(screen.getByText('Customers & Stripe Sync')).toBeDefined();
    expect(screen.getByDisplayValue('3194 W. Hamfort Rd.')).toBeDefined();
  });

  it('deletes order via DELETE /v1/orders/:id and triggers Stripe sync', async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 1 } });
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        message: 'Stripe orders synchronization triggered successfully',
        result: { processed: 2, created: 1, skipped: 1 },
      },
    });

    renderActions();
    expect(await screen.findByText('Fancy oils')).toBeDefined();
    expect((await screen.findAllByText('Steel Computer')).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel Fancy oils' }));
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/v1/orders/1');
      expect(orderStore.orders).toHaveLength(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sync Stripe' }));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/v1/jobs/sync-stripe', {});
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
    expect(await screen.findByDisplayValue('Some Body')).toBeDefined();

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
    expect((await screen.findAllByText('Steel Computer')).length).toBeGreaterThan(0);
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
