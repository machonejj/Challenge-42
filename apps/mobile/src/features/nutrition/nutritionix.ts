/**
 * Nutritionix search — the curated database many calorie-trackers (incl. Lose It-style apps) rely on
 * for full restaurant menus (Chipotle, Chick-fil-A, …) and branded packaged foods. Free tier, but
 * needs an app id + key from developer.nutritionix.com, supplied via EXPO_PUBLIC_NUTRITIONIX_APP_ID
 * and EXPO_PUBLIC_NUTRITIONIX_APP_KEY. Inert (returns []) until both are set. Numbers come from a
 * verified provider, per the no-AI-nutrition rule.
 *
 * Uses the instant-search endpoint, which returns branded items with calories directly. (Macros for
 * branded items need a per-item follow-up call; we surface calories now and can add that later.)
 */
import type { FoodItem } from '@challenge42/domain';

const APP_ID = process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID;
const APP_KEY = process.env.EXPO_PUBLIC_NUTRITIONIX_APP_KEY;
const URL = 'https://trackapi.nutritionix.com/v2/search/instant';

export function nutritionixAvailable(): boolean {
  return Boolean(APP_ID && APP_KEY);
}

interface NixBranded {
  food_name?: string;
  brand_name?: string;
  nf_calories?: number;
  serving_qty?: number;
  serving_unit?: string;
  nix_item_id?: string;
}

export async function searchNutritionix(
  query: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<FoodItem[]> {
  if (!APP_ID || !APP_KEY) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(`${URL}?query=${encodeURIComponent(q)}&branded=true&common=false`, {
      headers: { 'x-app-id': APP_ID, 'x-app-key': APP_KEY, 'x-remote-user-id': '0' },
      signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { branded?: NixBranded[] };
    const out: FoodItem[] = [];
    for (const b of (data.branded ?? []).slice(0, limit)) {
      if (!b.food_name || typeof b.nf_calories !== 'number') continue;
      out.push({
        providerFoodId: `nix:${b.nix_item_id ?? b.food_name}`,
        name: b.food_name,
        brand: b.brand_name ?? null,
        servingLabel:
          b.serving_qty && b.serving_unit ? `${b.serving_qty} ${b.serving_unit}` : '1 serving',
        servingGrams: 0,
        nutrition: { calories: Math.round(b.nf_calories), proteinG: 0, carbsG: 0, fatG: 0 },
        source: 'Nutritionix',
      });
    }
    return out;
  } catch {
    return [];
  }
}
