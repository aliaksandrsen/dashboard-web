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

const renderSettings = (initialEntry = '/settings') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Settings />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('<Settings />', () => {
  beforeEach(() => {
    localStorage.clear();
    userStore.user = {
      id: 1,
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

  it('shows logged out notice when navigated with loggedOut=true', async () => {
    renderSettings('/settings?loggedOut=true');
    expect(await screen.findByText('Some Body')).toBeDefined();
    expect(screen.getByText(/You have been logged out/i)).toBeDefined();
  });

  it('saves and clears auth token in localStorage and saves profile', async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({
      data: {
        id: 1,
        name: 'New User',
        email: 'new@email.com',
        address: '100 Main St',
      },
    });

    renderSettings();
    expect(await screen.findByDisplayValue('Some Body')).toBeDefined();

    fireEvent.change(screen.getByLabelText('Bearer Token'), { target: { value: 'Bearer secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Token' }));
    expect(await screen.findByText('Authorization token saved to localStorage.')).toBeDefined();
    expect(localStorage.getItem('dashboard_web_auth')).toBe('Bearer secret');

    fireEvent.click(screen.getByRole('button', { name: 'Clear Token' }));
    expect(localStorage.getItem('dashboard_web_auth')).toBeNull();

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New User' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/v1/users/1', {
        name: 'New User',
        email: 'some.body@email.com',
        address: '3194 W. Hamfort Rd.',
      });
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderSettings();
    expect(await screen.findByText('Some Body')).toBeDefined();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
