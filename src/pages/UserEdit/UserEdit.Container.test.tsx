import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UserEdit from '.';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      patch: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const UserViewTarget = () => {
  const location = useLocation();
  const flash = (location.state as { flash?: { text: string } } | null)?.flash?.text;
  return <div>User View: {flash}</div>;
};

const renderUserEdit = (id = '1') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/users/${id}/edit`]}>
        <Routes>
          <Route path="/users/:id/edit" element={<UserEdit />} />
          <Route path="/users/:id" element={<UserViewTarget />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<UserEdit />', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        id: 1,
        name: 'Antonio West',
        email: 'antonio@example.com',
        address: '123 Main St',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('updates user via PATCH /v1/users/:id and redirects back to /users/:id', async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({
      data: { id: 1, name: 'Antonio Updated', email: 'antonio@example.com', address: '999 Oak St' },
    });

    renderUserEdit('1');
    expect(await screen.findByDisplayValue('Antonio West')).toBeDefined();

    fireEvent.change(screen.getByLabelText(/Full Name/), {
      target: { value: 'Antonio Updated' },
    });
    fireEvent.change(screen.getByLabelText(/Shipping Address/), {
      target: { value: '999 Oak St' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Customer Changes' }));

    expect(await screen.findByText('User View: User profile updated successfully.')).toBeDefined();
    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/v1/users/1', {
        name: 'Antonio Updated',
        email: 'antonio@example.com',
        address: '999 Oak St',
      });
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderUserEdit('1');
    await screen.findByDisplayValue('Antonio West');
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
