import { useCallback, useContext } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';

export function useSafeNavigate() {
  const navigationContext = useContext(UNSAFE_NavigationContext);

  return useCallback(
    (to: string) => {
      navigationContext?.navigator.push(to);
    },
    [navigationContext],
  );
}
