import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const IDLE_MS = 5 * 60 * 1000; // 5 minutes
const IDLE_MS_DEV = 60 * 1000; // 1 minute in dev for easier testing

export default function InactivityTracker() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    const ms = import.meta.env.DEV ? IDLE_MS_DEV : IDLE_MS;
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      logout();
      navigate('/login', { replace: true });
    }, ms);
  }, [logout, navigate, clearTimer]);

  useEffect(() => {
    if (!user) return;

    startTimer();

    function onActivity() {
      startTimer();
    }

    window.addEventListener('mousedown', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('scroll', onActivity, { passive: true });

    return () => {
      clearTimer();
      window.removeEventListener('mousedown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('scroll', onActivity);
    };
  }, [user, startTimer, clearTimer]);

  return null;
}
