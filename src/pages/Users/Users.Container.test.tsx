import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Users from '.';

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

const renderUsers = (state?: unknown) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: '/users', state }]}>
        <Users />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<Users />', () => {
  beforeEach(() => {
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

  it('renders clean full-width users table, top search bar, Create User button, and flash banner', async () => {
    renderUsers({ flash: { type: 'success', text: 'User "Jane Doe" created successfully.' } });

    expect(await screen.findByText('antonio@example.com')).toBeDefined();
    expect(screen.getByText('User "Jane Doe" created successfully.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Create User' }).getAttribute('href')).toBe(
      '/users/new',
    );
    expect(screen.getByRole('link', { name: 'Edit Antonio West' }).getAttribute('href')).toBe(
      '/users/1/edit',
    );
    expect(screen.queryByRole('button', { name: 'Set Active' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Search users'), { target: { value: 'Antonio' } });
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/v1/users', { params: { search: 'Antonio' } });
    });
  });

  it('confirms deletion via dialog before calling DELETE /v1/users/:id', async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { id: 1 } });

    renderUsers();
    expect(await screen.findByText('Antonio West')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Antonio West' }));
    expect(screen.getByText('Delete "Antonio West"?')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete User' }));
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/v1/users/1');
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderUsers();
    await screen.findByText('Antonio West');
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
