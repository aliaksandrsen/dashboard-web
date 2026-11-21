import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Settings from '.';

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
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('triggers Stripe orders sync and displays synchronization result counts', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        message: 'Stripe orders synchronization triggered successfully',
        result: { processed: 4, created: 2, skipped: 2 },
      },
    });

    renderSettings();

    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Sync Stripe Orders Now' }));

    expect(
      await screen.findByText(/Stripe orders synchronization triggered successfully/),
    ).toBeDefined();
    expect(screen.getByText('Processed')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
  });

  it('shows error alert when Stripe sync fails', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('Stripe offline'));

    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Sync Stripe Orders Now' }));

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByText('Failed to trigger Stripe synchronization.')).toBeDefined();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderSettings();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
