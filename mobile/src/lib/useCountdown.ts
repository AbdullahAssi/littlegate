import { useEffect, useState } from 'react';

/** Milliseconds until `until`, ticking each second; 0 when there's nothing to wait for. */
export function useCountdown(until: number | null) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  return until ? Math.max(0, until - now) : 0;
}
