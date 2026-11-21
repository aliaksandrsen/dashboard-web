import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from '.';

describe('<ConfirmDialog />', () => {
  it('renders native dialog without redundant role/aria-modal and calls onConfirm/onCancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(
      <ConfirmDialog
        open
        title="Delete item?"
        description="This action cannot be undone."
        confirmLabel="Delete Item"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const dialog = container.querySelector('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog?.hasAttribute('role')).toBe(false);
    expect(dialog?.hasAttribute('aria-modal')).toBe(false);
    expect(screen.getByText('Delete item?')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Item' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('has no axe accessibility violations when open', async () => {
    const { container } = render(
      <ConfirmDialog
        open
        title="Confirm delete"
        description="Permanent deletion."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
