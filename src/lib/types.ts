export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  healthScore: number;
  summary: string;
}

export interface Meal {
  id: string;
  user_id: string;
  meal_type: MealType;
  image_url: string;
  foods: FoodItem[];
  total_calories: number;
  protein: number;
  carbs: number;
  fat: number;
  health_score: number;
  summary: string | null;
  created_at: string;
}

export function emptyFoodItem(): FoodItem {
  return { name: "", quantity: "", calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function recalcTotals(foods: FoodItem[]) {
  return foods.reduce(
    (acc, f) => ({
      totalCalories: acc.totalCalories + (Number(f.calories) || 0),
      totalProtein: acc.totalProtein + (Number(f.protein) || 0),
      totalCarbs: acc.totalCarbs + (Number(f.carbs) || 0),
      totalFat: acc.totalFat + (Number(f.fat) || 0),
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  );
}
