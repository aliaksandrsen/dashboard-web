import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UserDetails from '.';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      delete: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const renderUserDetails = (userId = '1') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/users/${userId}`]}>
        <Routes>
          <Route path="/users/:id" element={<UserDetails />} />
          <Route path="/users" element={<div>Users Home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<UserDetails />', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        id: 1,
        name: 'Antonio West',
        email: 'antonio@example.com',
        address: '123 Main St',
        orders: [
          {
            id: 7,
            total: 99.5,
            stripeInvoiceId: null,
            createdAt: '2026-06-20T00:00:00.000Z',
            updatedAt: '2026-06-20T00:00:00.000Z',
            userId: 1,
            products: [{ id: 'p-1', name: 'Desk Lamp', price: 99.5 }],
          },
        ],
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders read-only user details, customer orders, action links, and deletes with confirmation', async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 1 } });

    renderUserDetails('1');

    expect(await screen.findByText('antonio@example.com')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Edit User' }).getAttribute('href')).toBe(
      '/users/1/edit',
    );
    expect(screen.getByRole('link', { name: 'Create Order' }).getAttribute('href')).toBe(
      '/orders/new?userId=1',
    );
    expect(screen.getByRole('link', { name: /Order #7 — Desk Lamp/ })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete User' }));
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete User' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(await screen.findByText('Users Home')).toBeDefined();
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/v1/users/1');
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderUserDetails('1');
    await screen.findByText('antonio@example.com');
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
