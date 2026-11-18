import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Users from '.';
import { userStore } from '../UserInfo/UserInfo.State';

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

const renderUsers = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<Users />', () => {
  beforeEach(() => {
    userStore.user = {
      id: 1,
      name: 'Antonio West',
      email: 'antonio@example.com',
      address: '123 Main St',
      joinedDate: '2025-01-01',
      recentOrders: 2,
      newProducts: 0,
      nextDeliveryDate: '',
    };
    userStore.activeUserId = 1;

    vi.mocked(axios.get).mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Antonio West',
          email: 'antonio@example.com',
          address: '123 Main St',
          orders: [{ id: 1, total: 50 }],
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads users list, creates a user, and deletes a user', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { id: 2, name: 'Jane Doe', email: 'jane@example.com', address: '456 Oak Ave' },
    });
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 1 } });

    renderUsers();
    expect(await screen.findByText(/antonio@example\.com/)).toBeDefined();

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Shipping Address'), {
      target: { value: '456 Oak Ave' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }));

    expect(await screen.findByText(/User "Jane Doe" created/)).toBeDefined();
    expect(axios.post).toHaveBeenCalledWith('/v1/users', {
      name: 'Jane Doe',
      email: 'jane@example.com',
      address: '456 Oak Ave',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Antonio West' }));
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/v1/users/1');
    });
  });

  it('switches active user and filters users via search input', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Antonio West',
          email: 'antonio@example.com',
          address: '123 Main St',
          orders: [],
        },
        {
          id: 2,
          name: 'Second User',
          email: 'second@example.com',
          address: '456 Side St',
          orders: [],
        },
      ],
    });

    renderUsers();
    expect(await screen.findByText(/second@example\.com/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Set Active' }));
    expect(await screen.findByText('Active user switched to "Second User".')).toBeDefined();
    expect(userStore.activeUserId).toBe(2);

    fireEvent.change(screen.getByLabelText('Filter users'), { target: { value: 'Second' } });
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/v1/users', { params: { search: 'Second' } });
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderUsers();
    expect(await screen.findByText(/antonio@example\.com/)).toBeDefined();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
