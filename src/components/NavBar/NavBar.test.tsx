import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NavBar from '.';

const ui = (initialRoute = '/') =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <NavBar />
    </MemoryRouter>,
  );

describe('<NavBar />', () => {
  it('renders clean Admin navigation links without Actions or Logout', () => {
    ui('/orders/new');

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeDefined();
    const ordersLink = screen.getByRole('link', { name: 'Orders' });
    expect(ordersLink.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Products' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Users' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Actions' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Logout' })).toBeNull();
  });

  it('toggles mobile navigation drawer when Menu button is clicked', () => {
    ui('/');

    const toggleButton = screen.getByLabelText('Toggle navigation');
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggleButton);
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
  });

  it('has no axe accessibility violations', async () => {
    const { container } = ui('/');
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
