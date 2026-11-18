import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Settings from '.';
import { userStore } from '../UserInfo/UserInfo.State';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const renderSettings = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<Settings />', () => {
  beforeEach(() => {
    userStore.user = {
      id: undefined,
      name: '',
      email: '',
      address: '',
      joinedDate: '',
      recentOrders: 0,
      newProducts: 0,
      nextDeliveryDate: '',
    };

    vi.mocked(axios.get).mockImplementation((url) => {
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
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('saves active user profile via PATCH /v1/users/:id and triggers Stripe sync', async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({
      data: {
        id: 1,
        name: 'New User',
        email: 'some.body@email.com',
        address: '3194 W. Hamfort Rd.',
      },
    });
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        message: 'Stripe orders synchronization triggered successfully',
        result: { processed: 4, created: 2, skipped: 2 },
      },
    });

    renderSettings();
    expect(await screen.findByDisplayValue('Some Body')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New User' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/v1/users/1', {
        name: 'New User',
        email: 'some.body@email.com',
        address: '3194 W. Hamfort Rd.',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Run Stripe Orders Sync' }));
    expect(
      await screen.findByText(/Stripe orders synchronization triggered successfully/),
    ).toBeDefined();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderSettings();
    expect(await screen.findByDisplayValue('Some Body')).toBeDefined();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
