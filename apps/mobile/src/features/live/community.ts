/**
 * Real community data: the leaderboard (ranked by % of body weight lost) and the map presence dots,
 * both sourced from the `get_leaderboard` Supabase RPC. Falls back to a local-only view (just the
 * signed-in user's own row) when Supabase isn't configured, the RPC isn't deployed yet, or no one
 * else has synced. No fabricated people — ever.
 */
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { STATE_XY } from './usMapData';

export interface LeaderRow {
  userId: string;
  rank: number;
  name: string;
  state: string | null;
  pctLost: number; // % of body weight lost (negative = gained)
  activeRecent: boolean;
  isCurrentUser: boolean;
}

/** A dot on the US presence map — positioned at the challenger's state centroid (city-level privacy). */
export interface PresenceDot {
  id: string;
  name: string;
  city: string; // label only (we show the state code, never a precise place)
  state: string;
  x: number; // 0–1 of the 960×600 viewBox
  y: number;
  online: boolean;
}

interface RpcRow {
  user_id: string;
  display_name: string;
  state: string | null;
  pct_lost: number;
  active_recent: boolean;
}

async function fetchRemote(): Promise<RpcRow[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_leaderboard');
  if (error || !data) return null; // RPC not deployed yet / offline → fall back to local
  return data as RpcRow[];
}

function pctLost(startKg: number, latestKg: number): number {
  if (startKg <= 0) return 0;
  return Math.round(((startKg - latestKg) / startKg) * 1000) / 10;
}

/** Tiny deterministic offset so multiple challengers in one state don't stack on the exact centroid. */
function jitter(seed: string): { dx: number; dy: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return { dx: ((h % 21) - 10) / 900, dy: (((h >> 5) % 21) - 10) / 900 }; // ~±0.011
}

export interface Community {
  rows: LeaderRow[];
  dots: PresenceDot[];
  onlineCount: number;
  totalCount: number;
  loading: boolean;
  /** True when the data came from the server (real other challengers), not just the local fallback. */
  isReal: boolean;
}

export function useCommunity(): Community {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const profile = useProfileStore(
    useShallow((s) => ({
      enrolled: s.enrolled,
      firstName: s.firstName,
      state: s.state,
      startWeightKg: s.startWeightKg,
      latestWeightKg: s.latestWeightKg,
    })),
  );

  const [remote, setRemote] = useState<RpcRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void fetchRemote().then((r) => {
      if (!alive) return;
      setRemote(r);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [userId, profile.latestWeightKg, profile.enrolled]);

  const me: LeaderRow | null =
    profile.enrolled && profile.startWeightKg != null
      ? {
          userId: userId ?? 'me',
          rank: 1,
          name: profile.firstName ?? 'You',
          state: profile.state ?? null,
          pctLost: pctLost(profile.startWeightKg, profile.latestWeightKg ?? profile.startWeightKg),
          activeRecent: true,
          isCurrentUser: true,
        }
      : null;

  let rows: LeaderRow[];
  const hasRemote = Boolean(remote && remote.length > 0);
  if (remote && remote.length > 0) {
    rows = remote.map((r) => ({
      userId: r.user_id,
      rank: 0,
      name: r.display_name,
      state: r.state,
      pctLost: r.pct_lost,
      activeRecent: r.active_recent,
      isCurrentUser: userId != null && r.user_id === userId,
    }));
    // Guarantee the signed-in user is represented even if their sync hasn't landed server-side yet.
    if (me && !rows.some((r) => r.isCurrentUser)) rows.push(me);
    rows.sort((a, b) => b.pctLost - a.pctLost);
    rows = rows.map((r, i) => ({ ...r, rank: i + 1 }));
  } else {
    rows = me ? [me] : [];
  }

  const dots: PresenceDot[] = rows
    .filter((r) => r.state && STATE_XY[r.state])
    .map((r) => {
      const c = STATE_XY[r.state as string]!;
      const j = jitter(r.userId);
      return {
        id: r.userId,
        name: r.name,
        city: r.state as string,
        state: r.state as string,
        x: Math.min(Math.max(c.x + j.dx, 0.02), 0.98),
        y: Math.min(Math.max(c.y + j.dy, 0.02), 0.98),
        online: r.activeRecent,
      };
    });

  return {
    rows,
    dots,
    onlineCount: rows.filter((r) => r.activeRecent).length,
    totalCount: rows.length,
    loading,
    isReal: hasRemote,
  };
}
