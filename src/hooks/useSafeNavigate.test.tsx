import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useSafeNavigate } from './useSafeNavigate';

describe('useSafeNavigate', () => {
  it('is a no-op outside Router context', () => {
    const { result } = renderHook(() => useSafeNavigate());
    expect(() => result.current('/products')).not.toThrow();
  });

  it('navigates when inside Router context', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    );

    const { result } = renderHook(
      () => ({
        navigate: useSafeNavigate(),
        location: useLocation(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.navigate('/products');
    });
    expect(result.current.location.pathname).toBe('/products');
  });
});
