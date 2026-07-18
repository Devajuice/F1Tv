import { useEffect, useRef } from 'react';
import { getSessions, getNextRaceSession } from '../api/openf1';

export default function useSessionNotifications() {
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!('Notification' in window)) return;

    const requestPermission = async () => {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    };

    const checkAndNotify = async () => {
      if (Notification.permission !== 'granted') return;

      try {
        const sessions = await getSessions();
        const next = getNextRaceSession(sessions);
        if (!next) return;

        const startTime = new Date(next.date_start).getTime();
        const now = Date.now();
        const diffMs = startTime - now;

        // Notify if session starts within the next 5 minutes and hasn't been notified
        if (diffMs > 0 && diffMs <= 5 * 60 * 1000) {
          const key = `${next.session_key}-${next.date_start}`;
          if (!notifiedRef.current.has(key)) {
            notifiedRef.current.add(key);
            new Notification('F1TV — Session Starting Soon', {
              body: `${next.session_name} at ${next.circuit_short_name} starts in ${Math.ceil(diffMs / 60000)} minutes`,
              icon: '/favicon.ico',
              tag: key,
            });
          }
        }

        // Notify when session goes live
        const endTime = new Date(next.date_end).getTime();
        if (now >= startTime && now <= endTime) {
          const key = `live-${next.session_key}`;
          if (!notifiedRef.current.has(key)) {
            notifiedRef.current.add(key);
            new Notification('F1TV — Session is LIVE', {
              body: `${next.session_name} at ${next.circuit_short_name} is now in progress`,
              icon: '/favicon.ico',
              tag: key,
            });
          }
        }
      } catch { /* ignore */ }
    };

    requestPermission();
    checkAndNotify();
    const timer = setInterval(checkAndNotify, 60_000);
    return () => clearInterval(timer);
  }, []);
}
