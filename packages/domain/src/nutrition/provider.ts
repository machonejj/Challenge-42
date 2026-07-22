/**
 * Nutrition-data provider abstraction.
 *
 * PRINCIPLE: AI may generate meal *ideas and structure*, but nutrition NUMBERS come from a verified
 * provider (USDA FoodData Central or equivalent). All nutrition consumers depend on this interface,
 * never on an AI response. Phase One ships a mock; a USDA adapter lands in Phase 3.
 */

export interface FoodNutrition {
  /** Per the given serving. */
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
}

export interface FoodItem {
  /** Stable provider id, stored on logs so historical values never drift. */
  readonly providerFoodId: string;
  readonly name: string;
  readonly brand: string | null;
  readonly servingLabel: string; // e.g. "1 cup (240 ml)"
  readonly servingGrams: number;
  readonly nutrition: FoodNutrition;
  /** Identifies the verified source of these numbers (audit/trust). */
  readonly source: string;
}

export interface FoodSearchResult {
  readonly items: readonly FoodItem[];
}

export interface NutritionProvider {
  /** Human-readable id, e.g. "usda-fooddata" or "mock". */
  readonly id: string;
  search(query: string, opts?: { readonly limit?: number }): Promise<FoodSearchResult>;
  getById(providerFoodId: string): Promise<FoodItem | null>;
}

/** Scale a food's nutrition to a quantity in grams. */
export function scaleNutrition(item: FoodItem, grams: number): FoodNutrition {
  const factor = item.servingGrams > 0 ? grams / item.servingGrams : 0;
  return {
    calories: Math.round(item.nutrition.calories * factor),
    proteinG: Math.round(item.nutrition.proteinG * factor * 10) / 10,
    carbsG: Math.round(item.nutrition.carbsG * factor * 10) / 10,
    fatG: Math.round(item.nutrition.fatG * factor * 10) / 10,
  };
}
