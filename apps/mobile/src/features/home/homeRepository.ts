/**
 * Home data source behind an interface. Phase One uses the mock; the Supabase-backed implementation
 * (Phase 2+) will satisfy the same interface, selected by `DATA_SOURCE.mode`. The UI never knows
 * which one it's using.
 */
import { DATA_SOURCE } from '@challenge42/config';
import type { HomeSnapshot } from '@challenge42/types';
import { buildHomeSnapshot } from './mockHome';

export interface HomeRepository {
  getHomeSnapshot(): Promise<HomeSnapshot>;
}

class MockHomeRepository implements HomeRepository {
  async getHomeSnapshot(): Promise<HomeSnapshot> {
    // Small simulated latency so loading/refresh states are real in development.
    await new Promise((resolve) => setTimeout(resolve, 450));
    return buildHomeSnapshot();
  }
}

export function getHomeRepository(): HomeRepository {
  switch (DATA_SOURCE.mode) {
    case 'supabase':
      // TODO(phase-2): return new SupabaseHomeRepository(); falls back to mock until wired.
      return new MockHomeRepository();
    case 'mock':
    default:
      return new MockHomeRepository();
  }
}
