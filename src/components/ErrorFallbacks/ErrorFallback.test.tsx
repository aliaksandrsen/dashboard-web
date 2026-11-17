import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { ErrorFallback } from '.';
import type { ErrorFallbackProps } from '../../types/errorTypes';

const defaultProps: ErrorFallbackProps = {
  error: new Error('Failed to load data'),
  resetErrorBoundary: vi.fn(),
};

const ui = (props: ErrorFallbackProps = defaultProps) => render(<ErrorFallback {...props} />);

describe('<ErrorFallback />', () => {
  it('should render the error heading, message, and retry button', () => {
    ui();

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Something weird happened')).toBeDefined();
    expect(screen.getByText('This is what it was:')).toBeDefined();
    expect(screen.getByText('Failed to load data')).toBeDefined();
  });

  it('should call resetErrorBoundary when retry button is clicked', () => {
    const resetErrorBoundary = vi.fn();
    ui({ ...defaultProps, resetErrorBoundary });

    fireEvent.click(screen.getByRole('button', { name: 'Refresh the page to try again' }));
    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it('should handle non-Error thrown values safely', () => {
    ui({ ...defaultProps, error: 'Unknown string failure' });
    expect(screen.getByText('Unknown string failure')).toBeDefined();

    ui({ ...defaultProps, error: null });
    expect(screen.getByText('An unexpected error occurred')).toBeDefined();
  });

  it('should have no axe accessibility violations', async () => {
    const { container } = ui();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
