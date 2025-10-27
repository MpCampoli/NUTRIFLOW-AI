
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
  time: string; // Adicionado para consistência e notificações
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

export interface ClinicalSupplement {
  nome: string;
  dose_sugerida: number | null;
  unidade: string;
  objetivo: string;
  resumo_evidencia: string;
  citacao: string;
  evidence_available: boolean;
  seguranca: string;
}

export interface ClinicalAnalysis {
  observacoes: string[];
  suplementos: ClinicalSupplement[];
  metadados: {
    gerado_por: string;
    versao_prompt: string;
    requer_validacao_clinica: boolean;
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
  clinical_analysis?: ClinicalAnalysis; // Campo para análise do exame de sangue
  // Fields for recalculation
  userData: UserData;
  originalMeals: Meal[] | AiMealConfig[]; // Can be either type now
  macroTargets: MacroTargets;
  plannerMode: 'manual' | 'ai';
}

// User type simplified for local storage authentication
export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string; // Stored locally for internal recognition
  // Optional fields from UserProfile
  profilePicture?: string;
  cpf?: string;
  address?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | '';
  phoneNumber?: string;
  weight?: number;
  height?: number;
  goals?: string;
  biometricsEnabled?: boolean;
  // Fix: Added fields for admin panel and user file purchases
  status?: 'active' | 'suspended' | 'pending_confirmation';
  paymentStatus?: 'paid' | 'unpaid';
  role?: 'user' | 'admin';
  purchasedFileIds?: string[];
}

// Fix: Added FinancialRecord interface
export interface FinancialRecord {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  date: string; // ISO string format YYYY-MM-DD
  status: 'Aprovado' | 'Pendente' | 'Falhou';
  notes?: string;
}

// Fix: Added EbookFile interface
export interface EbookFile {
  id: string;
  createdAt: string; // ISO string format
  title: string;
  description: string;
  coverImage: string; // base64 data URL
  fileData: string; // base64 data URL
  fileName: string;
  fileType: string; // mime type
  isPaid: boolean;
  price?: number;
  status: 'active' | 'inactive';
}

export interface NotificationSettings {
  mealReminderSettings: {
    [mealName: string]: {
      enabled: boolean;
      offset: number; // minutes
    };
  };
  hydrationReminders: boolean;
  hydrationFrequency: number; // minutes
}

export interface ProgressEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number;
  waist?: number;
  hips?: number;
  notes?: string;
}