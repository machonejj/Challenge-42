/**
 * Mock nutrition provider for development. A curated set of common foods with realistic macros,
 * clearly labeled source "mock". Satisfies the same `NutritionProvider` interface the real USDA /
 * Open Food Facts adapter will implement later (behind an edge function, per docs/SECURITY.md).
 * No network, no secrets. Values are per the stated serving.
 */
import type { FoodItem, FoodSearchResult, NutritionProvider } from './provider';

const f = (
  id: string,
  name: string,
  servingLabel: string,
  servingGrams: number,
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
): FoodItem => ({
  providerFoodId: `mock:${id}`,
  name,
  brand: null,
  servingLabel,
  servingGrams,
  nutrition: { calories, proteinG, carbsG, fatG },
  source: 'mock',
});

/** Curated common foods — enough for a useful search while the real provider is wired later. */
export const MOCK_FOODS: readonly FoodItem[] = [
  f('egg', 'Egg, large', '1 egg (50 g)', 50, 72, 6, 0, 5),
  f('eggs-2', 'Eggs, scrambled (2)', '2 eggs', 100, 180, 12, 2, 13),
  f('chicken-breast', 'Chicken breast, grilled', '4 oz (113 g)', 113, 187, 35, 0, 4),
  f('ground-turkey', 'Ground turkey, cooked', '4 oz (113 g)', 113, 220, 27, 0, 12),
  f('salmon', 'Salmon, baked', '4 oz (113 g)', 113, 233, 25, 0, 14),
  f('tuna', 'Tuna, canned in water', '1 can (142 g)', 142, 130, 29, 0, 1),
  f('ground-beef', 'Ground beef, 90% lean', '4 oz (113 g)', 113, 199, 23, 0, 11),
  f('greek-yogurt', 'Greek yogurt, plain nonfat', '1 cup (245 g)', 245, 146, 25, 8, 1),
  f('protein-shake', 'Protein shake', '1 scoop + water', 350, 130, 25, 4, 2),
  f('oatmeal', 'Oatmeal, cooked', '1 cup (234 g)', 234, 166, 6, 28, 4),
  f('brown-rice', 'Brown rice, cooked', '1 cup (195 g)', 195, 216, 5, 45, 2),
  f('white-rice', 'White rice, cooked', '1 cup (158 g)', 158, 205, 4, 45, 0),
  f('pasta', 'Pasta, cooked', '1 cup (140 g)', 140, 220, 8, 43, 1),
  f('bread', 'Bread, whole wheat', '1 slice (28 g)', 28, 69, 4, 12, 1),
  f('tortilla', 'Flour tortilla', '1 medium (45 g)', 45, 140, 4, 24, 3),
  f('banana', 'Banana', '1 medium (118 g)', 118, 105, 1, 27, 0),
  f('apple', 'Apple', '1 medium (182 g)', 182, 95, 0, 25, 0),
  f('avocado', 'Avocado', '1/2 fruit (100 g)', 100, 160, 2, 9, 15),
  f('almonds', 'Almonds', '1 oz (28 g)', 28, 164, 6, 6, 14),
  f('peanut-butter', 'Peanut butter', '2 tbsp (32 g)', 32, 188, 8, 6, 16),
  f('cheese', 'Cheddar cheese', '1 oz (28 g)', 28, 113, 7, 0, 9),
  f('milk', 'Milk, 2%', '1 cup (244 g)', 244, 122, 8, 12, 5),
  f('broccoli', 'Broccoli, steamed', '1 cup (156 g)', 156, 55, 4, 11, 1),
  f('sweet-potato', 'Sweet potato, baked', '1 medium (130 g)', 130, 112, 2, 26, 0),
  f('side-salad', 'Garden salad (no dressing)', '1 bowl', 150, 40, 2, 8, 0),
  f('olive-oil', 'Olive oil', '1 tbsp (14 g)', 14, 119, 0, 0, 14),
  f('coffee', 'Coffee, black', '1 cup', 240, 2, 0, 0, 0),
  f('pizza', 'Pizza, cheese', '1 slice', 107, 285, 12, 36, 10),
  f('burrito', 'Chicken burrito', '1 burrito', 350, 620, 35, 68, 22),
  f('protein-bar', 'Protein bar', '1 bar (60 g)', 60, 220, 20, 22, 7),
];

/** Case-insensitive substring search over the curated foods. Sync — the list is local. */
export function searchFoods(query: string, limit = 20): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  return MOCK_FOODS.filter((food) => food.name.toLowerCase().includes(q)).slice(0, limit);
}

export class MockNutritionProvider implements NutritionProvider {
  readonly id = 'mock';

  async search(query: string, opts?: { readonly limit?: number }): Promise<FoodSearchResult> {
    return { items: searchFoods(query, opts?.limit ?? 20) };
  }

  async getById(providerFoodId: string): Promise<FoodItem | null> {
    return MOCK_FOODS.find((food) => food.providerFoodId === providerFoodId) ?? null;
  }
}

export const mockNutritionProvider = new MockNutritionProvider();
