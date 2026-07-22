/**
 * Mock nutrition provider for Phase One development. Values are illustrative, clearly a DEV stub,
 * and satisfy the same `NutritionProvider` interface the real USDA adapter will implement. No
 * network, no secrets. Source is labeled "mock" so it can never be mistaken for verified data.
 */
import type { FoodItem, FoodSearchResult, NutritionProvider } from './provider';

const MOCK_FOODS: readonly FoodItem[] = [
  {
    providerFoodId: 'mock:chicken-breast',
    name: 'Chicken breast, grilled',
    brand: null,
    servingLabel: '4 oz (113 g)',
    servingGrams: 113,
    nutrition: { calories: 187, proteinG: 35, carbsG: 0, fatG: 4 },
    source: 'mock',
  },
  {
    providerFoodId: 'mock:greek-yogurt',
    name: 'Greek yogurt, plain nonfat',
    brand: null,
    servingLabel: '1 cup (245 g)',
    servingGrams: 245,
    nutrition: { calories: 146, proteinG: 25, carbsG: 8, fatG: 1 },
    source: 'mock',
  },
  {
    providerFoodId: 'mock:brown-rice',
    name: 'Brown rice, cooked',
    brand: null,
    servingLabel: '1 cup (195 g)',
    servingGrams: 195,
    nutrition: { calories: 216, proteinG: 5, carbsG: 45, fatG: 2 },
    source: 'mock',
  },
  {
    providerFoodId: 'mock:avocado',
    name: 'Avocado',
    brand: null,
    servingLabel: '1/2 fruit (100 g)',
    servingGrams: 100,
    nutrition: { calories: 160, proteinG: 2, carbsG: 9, fatG: 15 },
    source: 'mock',
  },
  {
    providerFoodId: 'mock:banana',
    name: 'Banana',
    brand: null,
    servingLabel: '1 medium (118 g)',
    servingGrams: 118,
    nutrition: { calories: 105, proteinG: 1, carbsG: 27, fatG: 0 },
    source: 'mock',
  },
];

export class MockNutritionProvider implements NutritionProvider {
  readonly id = 'mock';

  async search(query: string, opts?: { readonly limit?: number }): Promise<FoodSearchResult> {
    const q = query.trim().toLowerCase();
    const matched =
      q.length === 0 ? [] : MOCK_FOODS.filter((f) => f.name.toLowerCase().includes(q));
    const limit = opts?.limit ?? 10;
    return { items: matched.slice(0, limit) };
  }

  async getById(providerFoodId: string): Promise<FoodItem | null> {
    return MOCK_FOODS.find((f) => f.providerFoodId === providerFoodId) ?? null;
  }
}

export const mockNutritionProvider = new MockNutritionProvider();
