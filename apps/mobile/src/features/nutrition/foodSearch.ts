/**
 * Combined remote food search across every configured provider (USDA FoodData Central + Open Food
 * Facts), run in parallel and de-duped. USDA (curated) is listed first when available; Open Food
 * Facts adds broad packaged/branded coverage. Both degrade to [] on failure, so callers always get
 * the local curated list at minimum.
 */
import type { FoodItem } from '@challenge42/domain';
import { searchFatSecret } from './fatsecret';
import { searchNutritionix } from './nutritionix';
import { searchEdamam } from './edamam';
import { searchOpenFoodFacts } from './openFoodFacts';
import { searchUsda } from './usda';

export async function searchRemoteFoods(query: string, signal?: AbortSignal): Promise<FoodItem[]> {
  // Query every configured provider in parallel; curated ones (FatSecret / Nutritionix / Edamam /
  // USDA — full macros) rank ahead of Open Food Facts, then we de-dupe.
  const [fs, nix, eda, usda, off] = await Promise.all([
    searchFatSecret(query, 20, signal),
    searchNutritionix(query, 15, signal),
    searchEdamam(query, 15, signal),
    searchUsda(query, 12, signal),
    searchOpenFoodFacts(query, 20, signal),
  ]);
  const seen = new Set<string>();
  const out: FoodItem[] = [];
  for (const f of [...fs, ...nix, ...eda, ...usda, ...off]) {
    const key = `${f.name.toLowerCase()}|${(f.brand ?? '').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}
