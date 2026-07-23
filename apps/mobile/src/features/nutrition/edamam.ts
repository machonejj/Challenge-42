/**
 * Edamam Food Database search — a large branded + generic food database with FULL macros. Free,
 * self-serve Developer tier (sign up at developer.edamam.com; no approval process), supplied via
 * EXPO_PUBLIC_EDAMAM_APP_ID and EXPO_PUBLIC_EDAMAM_APP_KEY. Inert (returns []) until both are set.
 * Numbers come from a verified provider, per the no-AI-nutrition rule.
 */
import type { FoodItem } from '@challenge42/domain';

const APP_ID = process.env.EXPO_PUBLIC_EDAMAM_APP_ID;
const APP_KEY = process.env.EXPO_PUBLIC_EDAMAM_APP_KEY;
const URL = 'https://api.edamam.com/api/food-database/v2/parser';

export function edamamAvailable(): boolean {
  return Boolean(APP_ID && APP_KEY);
}

interface EdaFood {
  foodId?: string;
  label?: string;
  brand?: string;
  nutrients?: { ENERC_KCAL?: number; PROCNT?: number; CHOCDF?: number; FAT?: number };
}
interface EdaMeasure {
  label?: string;
  weight?: number;
}
interface EdaHint {
  food?: EdaFood;
  measures?: EdaMeasure[];
}

export async function searchEdamam(
  query: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<FoodItem[]> {
  if (!APP_ID || !APP_KEY) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(
      `${URL}?app_id=${APP_ID}&app_key=${APP_KEY}&nutrition-type=logging&ingr=${encodeURIComponent(q)}`,
      { signal },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { hints?: EdaHint[] };
    const seen = new Set<string>();
    const out: FoodItem[] = [];
    for (const h of data.hints ?? []) {
      const f = h.food;
      const kcal100 = f?.nutrients?.ENERC_KCAL;
      if (!f?.label || typeof kcal100 !== 'number' || kcal100 <= 0 || kcal100 > 900) continue;

      const serving = h.measures?.find((m) => /serving/i.test(m.label ?? ''));
      const grams = serving?.weight && serving.weight > 0 ? serving.weight : 100;
      const factor = grams / 100;

      const key = `${f.label.toLowerCase()}|${(f.brand ?? '').toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        providerFoodId: `eda:${f.foodId ?? f.label}`,
        name: f.label,
        brand: f.brand ?? null,
        servingLabel:
          grams !== 100 ? (serving?.label?.trim() ?? `${Math.round(grams)} g`) : '100 g',
        servingGrams: grams,
        nutrition: {
          calories: Math.round(kcal100 * factor),
          proteinG: Math.round((f.nutrients?.PROCNT ?? 0) * factor * 10) / 10,
          carbsG: Math.round((f.nutrients?.CHOCDF ?? 0) * factor * 10) / 10,
          fatG: Math.round((f.nutrients?.FAT ?? 0) * factor * 10) / 10,
        },
        source: 'Edamam',
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}
