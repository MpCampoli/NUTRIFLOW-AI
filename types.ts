export interface User {
  id: string;
  email: string;
  passwordHash: string; 
  fullName: string;
  cpf?: string;
  address?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | '';
  profilePicture?: string | null;
  biometricsEnabled?: boolean;
}

export interface UserData {
  name: string;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  age: number;
  activityLevel: number;
}

export interface MacroTargets {
    protein: number;
    carbs: number;
    fat: number;
}

export interface Meal {
  id: string;
  name: string;
  carbohydrates: string[];
  proteins: string[];
  fats: string[];
  fruits: string[];
  vegetables: string[];
  supplements: string[];
  customFoods: string[];
}

export interface AiMealConfig {
  id: string;
  name: string;
  time: string;
}

export interface FoodItem {
  name:string;
  quantity_grams: number;
  unit_description?: string;
}

export interface DietMeal {
  meal_name: string;
  foods: FoodItem[];
  totals: {
    calories: number;
    protein_grams: number;
    carbohydrates_grams: number;
    fat_grams: number;
  };
}

export interface DietPlan {
  id: string;
  createdAt: string;
  goal: string;
  daily_totals: {
    calories: number;
    protein_grams: number;
    carbohydrates_grams: number;
    fat_grams: number;
  };
  meals: DietMeal[];
  recommendations: string[];
  // Fields for recalculation
  userData: UserData;
  originalMeals: Meal[] | AiMealConfig[]; // Can be either type now
  macroTargets: MacroTargets;
  plannerMode: 'manual' | 'ai';
}