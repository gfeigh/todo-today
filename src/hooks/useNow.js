import { useEffect, useState } from 'react';

/** The current time, refreshed every `intervalMs`. Drives the "now" line and alerts. */
export function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [intervalMs]);

  return now;
}
