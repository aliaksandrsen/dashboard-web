import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UserCreate from '.';

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

const UsersTarget = () => {
  const location = useLocation();
  const flash = (location.state as { flash?: { text: string } } | null)?.flash?.text;
  return <div>Users List: {flash}</div>;
};

const renderUserCreate = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/users/new']}>
        <Routes>
          <Route path="/users/new" element={<UserCreate />} />
          <Route path="/users" element={<UsersTarget />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<UserCreate />', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user and redirects back to /users with flash message', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { id: 2, name: 'Jane Doe', email: 'jane@example.com', address: '456 Oak Ave' },
    });

    renderUserCreate();

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Shipping Address/), {
      target: { value: '456 Oak Ave' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }));

    expect(
      await screen.findByText('Users List: User "Jane Doe" created successfully.'),
    ).toBeDefined();
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/v1/users', {
        name: 'Jane Doe',
        email: 'jane@example.com',
        address: '456 Oak Ave',
      });
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderUserCreate();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
