/**
 * FatSecret food search via our Netlify function proxy (/.netlify/functions/foodsearch), so the
 * OAuth secret stays server-side. FatSecret is a very large database (restaurants + brands + generic)
 * with full macros. Web-only (the proxy is same-origin on the deployed site); returns [] elsewhere.
 */
import { Platform } from 'react-native';
import type { FoodItem } from '@challenge42/domain';

interface ProxyFood {
  id?: string;
  name?: string;
  brand?: string | null;
  servingLabel?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export async function searchFatSecret(
  query: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<FoodItem[]> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return [];
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(`/.netlify/functions/foodsearch?q=${encodeURIComponent(q)}`, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { foods?: ProxyFood[] };
    return (data.foods ?? [])
      .filter((f) => f.name && typeof f.calories === 'number' && f.calories > 0)
      .slice(0, limit)
      .map((f) => ({
        providerFoodId: `fs:${f.id ?? f.name}`,
        name: f.name as string,
        brand: f.brand ?? null,
        servingLabel: f.servingLabel || '1 serving',
        servingGrams: 0,
        nutrition: {
          calories: Math.round(f.calories as number),
          proteinG: f.proteinG ?? 0,
          carbsG: f.carbsG ?? 0,
          fatG: f.fatG ?? 0,
        },
        source: 'FatSecret',
      }));
  } catch {
    return [];
  }
}
