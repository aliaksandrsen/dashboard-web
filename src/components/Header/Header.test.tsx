import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import Header from '.';
import type { HeaderProps } from './Header';

const mockHeaderData: HeaderProps = {
  userName: 'Some Body',
  joinedDate: '10/21/2002',
  onSubmitSearch: vi.fn(),
};

const ui = (props: HeaderProps = mockHeaderData) => render(<Header {...props} />);

describe('<Header />', () => {
  it('should render the header with user info', () => {
    ui();

    expect(screen.getByText('Some Body')).toBeDefined();
    expect(screen.getByText('Customer since 2002')).toBeDefined();
    expect(screen.getByPlaceholderText('Search products...')).toBeDefined();
  });

  it('should not render NaN when joinedDate is empty', () => {
    ui({ ...mockHeaderData, joinedDate: '' });

    expect(screen.queryByText(/NaN/)).toBeNull();
    expect(screen.getByText('Customer')).toBeDefined();
  });

  it('should have no axe accessibility violations', async () => {
    const { container } = ui();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
