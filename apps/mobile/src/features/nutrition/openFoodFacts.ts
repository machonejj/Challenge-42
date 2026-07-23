/**
 * Open Food Facts food search — a free, keyless, community database of packaged & branded foods
 * (Cheetos to specialty items, and many restaurant items). Numbers come from product labels, so this
 * stays true to the rule that a verified provider — never AI — sets nutrition. Returns domain
 * FoodItem[] so it plugs into the same logging flow as the curated foods. Network-only; callers
 * merge it with the instant local list and degrade gracefully on failure.
 */
import type { FoodItem } from '@challenge42/domain';

// Open Food Facts' dedicated, scalable full-text search service (better than the legacy cgi search).
const SEARCH_URL = 'https://search.openfoodfacts.org/search';

interface OFFProduct {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string>;
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function firstBrand(b: string | string[] | undefined): string | null {
  if (Array.isArray(b)) return b.length ? String(b[0]).trim() || null : null;
  if (typeof b === 'string' && b) return b.split(',')[0]?.trim() || null;
  return null;
}

function toFoodItem(p: OFFProduct): FoodItem | null {
  const name = (p.product_name ?? '').trim();
  if (!name) return null;
  const nut = p.nutriments ?? {};
  const calServing = num(nut['energy-kcal_serving']);
  const perServing = calServing != null;
  const cal = perServing ? calServing : num(nut['energy-kcal_100g']);
  if (cal == null || cal <= 0) return null; // no calorie data → not useful to log
  // Reject implausible crowd-sourced values (e.g. a per-100g field holding 48000). No real food
  // exceeds ~900 kcal/100g; a single logged serving over ~3000 kcal is almost certainly bad data.
  if (!perServing && cal > 900) return null;
  if (perServing && cal > 3000) return null;

  const pick = (base: string): number =>
    num(perServing ? nut[`${base}_serving`] : nut[`${base}_100g`]) ?? 0;

  return {
    providerFoodId: `off:${p.code ?? name}`,
    name,
    brand: firstBrand(p.brands),
    servingLabel: perServing ? p.serving_size?.trim() || '1 serving' : '100 g',
    servingGrams: perServing ? (num(p.serving_quantity) ?? 0) : 100,
    nutrition: {
      calories: Math.round(cal),
      proteinG: Math.round(pick('proteins') * 10) / 10,
      carbsG: Math.round(pick('carbohydrates') * 10) / 10,
      fatG: Math.round(pick('fat') * 10) / 10,
    },
    source: 'Open Food Facts',
  };
}

export async function searchOpenFoodFacts(
  query: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<FoodItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    q,
    page_size: String(limit),
    fields: 'code,product_name,brands,serving_size,serving_quantity,nutriments',
  });
  try {
    const res = await fetch(`${SEARCH_URL}?${params.toString()}`, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { hits?: OFFProduct[]; products?: OFFProduct[] };
    const seen = new Set<string>();
    const items: FoodItem[] = [];
    for (const p of data.hits ?? data.products ?? []) {
      const item = toFoodItem(p);
      if (!item) continue;
      const key = `${item.name.toLowerCase()}|${item.brand ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
      if (items.length >= limit) break;
    }
    return items;
  } catch {
    return []; // offline / aborted → caller falls back to the local list
  }
}
