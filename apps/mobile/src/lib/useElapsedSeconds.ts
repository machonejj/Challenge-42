import { useEffect, useState } from 'react';

/**
 * Live elapsed seconds since an ISO start time, ticking each second. Mirrors the product rule that
 * timers are computed as `now - started_at` (never streamed from the server).
 */
export function useElapsedSeconds(startedAtIso: string | null): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!startedAtIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAtIso]);
  if (!startedAtIso) return 0;
  return Math.max(0, Math.floor((now - new Date(startedAtIso).getTime()) / 1000));
}
