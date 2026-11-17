import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OrderForm from '.';

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

describe('<OrderForm />', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts with aria-invalid="false" on inputs and validates invalid email on submit', async () => {
    render(<OrderForm />);

    const emailInput = screen.getByLabelText(/Email/);
    expect(emailInput.getAttribute('aria-invalid')).toBe('false');

    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Ernest' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Abcde' } });
    fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: '3' } });
    fireEvent.change(emailInput, { target: { value: 'e.abcde' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'B1gt3sTAcc0un!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Please enter a valid email address')).toBeDefined();
    expect(emailInput.getAttribute('aria-invalid')).toBe('true');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('submits valid order to /v1/orders and displays success message', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        id: 42,
        total: 149.97,
        createdAt: '2025-07-01T10:00:00.000Z',
        updatedAt: '2025-07-01T10:00:00.000Z',
      },
    });
    const onOrderCreated = vi.fn();

    render(<OrderForm userId={1} onOrderCreated={onOrderCreated} />);

    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Ernest' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Abcde' } });
    fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'e.abcde@ern.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'B1gt3sTAcc0un!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Order submitted successfully')).toBeDefined();
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/v1/orders', {
        total: 149.97,
        userId: 1,
      });
      expect(onOrderCreated).toHaveBeenCalledTimes(1);
    });
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(<OrderForm />);
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
