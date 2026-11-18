import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NavBar from '.';

const ui = () =>
  render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>,
  );

describe('<NavBar />', () => {
  it('should render semantic navigation links without Logout', () => {
    ui();

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Orders' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Actions' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Products' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Users' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Logout' })).toBeNull();
  });

  it('should toggle mobile navigation state when menu button is clicked', () => {
    ui();

    const toggleButton = screen.getByLabelText('Toggle navigation');
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggleButton);
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('dialog', { hidden: true })).toBeDefined();
  });

  it('should have no axe accessibility violations', async () => {
    const { container } = ui();
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
