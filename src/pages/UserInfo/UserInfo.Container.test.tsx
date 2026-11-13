import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserInfo from '.';

const ui = () => render(<UserInfo />);

describe('<UserInfo />', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the user info screen', async () => {
    ui();

    expect(screen.getByText('Search bar')).toBeDefined();
    expect(screen.getByText('Some Body')).toBeDefined();
    expect(screen.getByText('Fancy soap')).toBeDefined();
  });
});
