import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { FlashMessage } from '../types/api';

interface LocationFlashState {
  flash?: FlashMessage;
}

export function useFlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const incomingFlash = (location.state as LocationFlashState | null)?.flash ?? null;
  const [flash, setFlash] = useState<FlashMessage | null>(incomingFlash);

  useEffect(() => {
    if (incomingFlash) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [incomingFlash, location.pathname, location.search, navigate]);

  const clearFlash = useCallback(() => {
    setFlash(null);
  }, []);

  return { flash, setFlash, clearFlash };
}
