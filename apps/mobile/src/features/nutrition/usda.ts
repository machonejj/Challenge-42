/**
 * USDA FoodData Central search — a large, well-curated government database (Branded packaged foods,
 * Survey/FNDDS foods incl. many restaurant/prepared items, Foundation & SR Legacy generics). Free,
 * but needs an API key (instant signup at fdc.nal.usda.gov/api-key-signup) supplied via
 * EXPO_PUBLIC_FDC_API_KEY. Inert (returns []) until the key is set, so it never breaks the app.
 * Numbers come from a verified provider, per the no-AI-nutrition rule.
 */
import type { FoodItem } from '@challenge42/domain';

const KEY = process.env.EXPO_PUBLIC_FDC_API_KEY;
const URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export function usdaAvailable(): boolean {
  return Boolean(KEY);
}

interface FdcNutrient {
  nutrientNumber?: string;
  value?: number;
}
interface FdcFood {
  fdcId?: number;
  description?: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: FdcNutrient[];
}

function nutrientPer100(food: FdcFood, numberCode: string): number | null {
  const n = food.foodNutrients?.find((x) => x.nutrientNumber === numberCode);
  return typeof n?.value === 'number' ? n.value : null;
}

function toTitle(s: string): string {
  // USDA descriptions are frequently ALL CAPS — make them readable.
  if (s === s.toUpperCase()) return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return s;
}

function toFoodItem(f: FdcFood): FoodItem | null {
  const name = (f.description ?? '').trim();
  if (!name) return null;
  const kcal100 = nutrientPer100(f, '208'); // Energy (kcal), per 100 g
  if (kcal100 == null || kcal100 <= 0 || kcal100 > 900) return null;
  const protein100 = nutrientPer100(f, '203') ?? 0;
  const carbs100 = nutrientPer100(f, '205') ?? 0;
  const fat100 = nutrientPer100(f, '204') ?? 0;

  const grams = f.servingSize && f.servingSizeUnit?.toLowerCase() === 'g' ? f.servingSize : 100;
  const factor = grams / 100;
  const servingLabel =
    f.householdServingFullText?.trim() || (grams !== 100 ? `${grams} g` : '100 g');

  return {
    providerFoodId: `fdc:${f.fdcId ?? name}`,
    name: toTitle(name),
    brand: f.brandName || f.brandOwner || null,
    servingLabel,
    servingGrams: grams,
    nutrition: {
      calories: Math.round(kcal100 * factor),
      proteinG: Math.round(protein100 * factor * 10) / 10,
      carbsG: Math.round(carbs100 * factor * 10) / 10,
      fatG: Math.round(fat100 * factor * 10) / 10,
    },
    source: 'USDA FoodData Central',
  };
}

export async function searchUsda(
  query: string,
  limit = 15,
  signal?: AbortSignal,
): Promise<FoodItem[]> {
  if (!KEY) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    api_key: KEY,
    query: q,
    pageSize: String(limit),
    dataType: 'Branded,Survey (FNDDS),Foundation,SR Legacy',
  });
  try {
    const res = await fetch(`${URL}?${params.toString()}`, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { foods?: FdcFood[] };
    const out: FoodItem[] = [];
    for (const f of data.foods ?? []) {
      const item = toFoodItem(f);
      if (item) out.push(item);
    }
    return out;
  } catch {
    return [];
  }
}
