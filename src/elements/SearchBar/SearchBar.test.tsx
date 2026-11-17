import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '.';
import type { SearchBarProps } from './SearchBar';

const mocks: SearchBarProps = {
  name: 'products',
  onSubmitSearch: vi.fn(),
};

const ui = (props: SearchBarProps = mocks) => render(<SearchBar {...props} />);

describe('<SearchBar />', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render an accessible search bar', () => {
    ui();

    const input = screen.getByLabelText('Search products');
    expect(input).toBeDefined();
    expect(screen.getByPlaceholderText('Search products...')).toBeDefined();
    expect(input.getAttribute('type')).toBe('search');
  });

  it('should show validation error when submitting invalid search text', async () => {
    ui();

    const input = screen.getByLabelText('Search products');
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.submit(screen.getByRole('form', { name: 'products search form' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Search text must be at least 3 characters');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(mocks.onSubmitSearch).not.toHaveBeenCalled();
  });

  it('should show required error when submitting an empty search field', async () => {
    ui();

    fireEvent.submit(screen.getByRole('form', { name: 'products search form' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Please enter a search term');
    expect(mocks.onSubmitSearch).not.toHaveBeenCalled();
  });

  it('should submit search string when input is valid', async () => {
    ui();

    const input = screen.getByLabelText('Search products');
    fireEvent.change(input, { target: { value: 'soap' } });
    fireEvent.submit(screen.getByRole('form', { name: 'products search form' }));

    await waitFor(() => {
      expect(mocks.onSubmitSearch).toHaveBeenCalledWith('soap');
    });
  });

  it('should have no axe accessibility violations', async () => {
    const { container } = ui();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
