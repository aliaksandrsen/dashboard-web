import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UserDetails from '.';
import { userStore } from '../UserInfo/UserInfo.State';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      patch: vi.fn(),
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
          <Route path="/users" element={<div>Users Directory</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<UserDetails />', () => {
  beforeEach(() => {
    userStore.user = {
      id: 1,
      name: 'Antonio West',
      joinedDate: '2025-01-01',
      recentOrders: 1,
      newProducts: 1,
      nextDeliveryDate: '',
    };

    vi.mocked(axios.get).mockResolvedValue({
      data: {
        id: 1,
        name: 'Antonio West',
        email: 'antonio@example.com',
        address: '66957 Cormier Club',
        orders: [
          {
            id: 3,
            total: 237.13,
            createdAt: '2026-05-15T14:46:36.630Z',
            products: [{ id: 'p-1', name: 'Steel Computer', price: 237.13 }],
          },
        ],
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads user profile with orders and saves updates via PATCH /v1/users/:id', async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({
      data: { id: 1, name: 'Antonio Updated', email: 'antonio@example.com', address: 'New Addr' },
    });

    renderUserDetails('1');

    expect(await screen.findByText(/Order #3/)).toBeDefined();
    expect(screen.getByText('$237.13')).toBeDefined();
    expect(await screen.findByDisplayValue('66957 Cormier Club')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'New Addr' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Customer Changes' }));

    expect(await screen.findByText('User profile updated successfully.')).toBeDefined();
    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/v1/users/1', {
        name: 'Antonio West',
        email: 'antonio@example.com',
        address: 'New Addr',
      });
    });
  });

  it('deletes user and navigates back to /users', async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 1 } });

    renderUserDetails('1');
    expect(await screen.findByText(/Order #3/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete User' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));

    expect(await screen.findByText('Users Directory')).toBeDefined();
    expect(axios.delete).toHaveBeenCalledWith('/v1/users/1');
  });

  it('shows loading spinner, handles error with retry, and displays update errors', async () => {
    vi.mocked(axios.get).mockImplementationOnce(() => new Promise(() => {}));
    renderUserDetails('99');
    expect(screen.getByTestId('user-details-loading')).toBeDefined();

    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Not found'));
    renderUserDetails('404');
    expect(await screen.findByText('User #404 could not be loaded.')).toBeDefined();

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { id: 404, name: 'Recovered User', email: 'rec@test.com', address: '1 Rd', orders: [] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('rec@test.com')).toBeDefined();

    vi.mocked(axios.patch).mockRejectedValueOnce(new Error('Update failed'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Customer Changes' }));
    expect(await screen.findByText('Failed to update user.')).toBeDefined();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderUserDetails('1');
    expect(await screen.findByText(/Order #3/)).toBeDefined();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
