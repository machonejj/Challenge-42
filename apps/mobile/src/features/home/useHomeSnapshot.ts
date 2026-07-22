import { useQuery } from '@tanstack/react-query';
import type { HomeSnapshot } from '@challenge42/types';
import { getHomeRepository } from './homeRepository';

const repository = getHomeRepository();

/** Server-state hook for the Home snapshot (TanStack Query). */
export function useHomeSnapshot() {
  return useQuery<HomeSnapshot>({
    queryKey: ['home', 'snapshot'],
    queryFn: () => repository.getHomeSnapshot(),
    staleTime: 30_000,
  });
}
