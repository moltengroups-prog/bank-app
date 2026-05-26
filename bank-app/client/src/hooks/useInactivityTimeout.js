import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../socket/socket';

const TIMEOUT_MS  = 3 * 60 * 1000; // 3 minutes
const STORAGE_KEY = 'bom-last-activity';
const EVENTS      = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

export function useInactivityTimeout() {
  const navigate        = useNavigate();
  const logout          = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const timerRef        = useRef(null);

  const expire = useCallback(async () => {
    clearTimeout(timerRef.current);
    disconnectSocket();
    await logout();
    navigate('/?expired=1', { replace: true });
  }, [logout, navigate]);

  const reset = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(expire, TIMEOUT_MS);
  }, [expire]);

  useEffect(() => {
    if (!isAuthenticated) return;

    reset();
    EVENTS.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));

    // Multi-tab sync: another tab's activity pushes the timer forward
    const handleStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      const last      = parseInt(e.newValue || '0', 10);
      const remaining = TIMEOUT_MS - (Date.now() - last);
      clearTimeout(timerRef.current);
      if (remaining > 0) {
        timerRef.current = setTimeout(expire, remaining);
      } else {
        expire();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearTimeout(timerRef.current);
      EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
      window.removeEventListener('storage', handleStorage);
    };
  }, [isAuthenticated, reset, expire]);
}
