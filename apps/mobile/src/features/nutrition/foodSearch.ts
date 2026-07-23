/**
 * Combined remote food search across every configured provider (USDA FoodData Central + Open Food
 * Facts), run in parallel and de-duped. USDA (curated) is listed first when available; Open Food
 * Facts adds broad packaged/branded coverage. Both degrade to [] on failure, so callers always get
 * the local curated list at minimum.
 */
import type { FoodItem } from '@challenge42/domain';
import { searchOpenFoodFacts } from './openFoodFacts';
import { searchUsda } from './usda';

export async function searchRemoteFoods(query: string, signal?: AbortSignal): Promise<FoodItem[]> {
  const [usda, off] = await Promise.all([
    searchUsda(query, 12, signal),
    searchOpenFoodFacts(query, 20, signal),
  ]);
  const seen = new Set<string>();
  const out: FoodItem[] = [];
  for (const f of [...usda, ...off]) {
    const key = `${f.name.toLowerCase()}|${(f.brand ?? '').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}
