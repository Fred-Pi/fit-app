// Core data models for the fitness tracking app

export interface User {
  id: string;
  name: string;
  email?: string;
  dailyCalorieTarget: number;
  dailyStepGoal: number;
  preferredWeightUnit: 'kg' | 'lbs';
  created: string; // ISO date string
}

// ============ WORKOUT MODELS ============

export interface WorkoutLog {
  id: string;
  userId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  name: string;
  duration?: number; // minutes
  exercises: ExerciseLog[];
  notes?: string;
  completed: boolean;
  created: string; // ISO date string
}

export interface ExerciseLog {
  id: string;
  exerciseName: string;
  sets: SetLog[];
}

export interface SetLog {
  reps: number;
  weight: number; // in user's preferred unit
  rpe?: number; // 1-10, optional
  completed: boolean;
}

// For future use (Phase 2)
export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  exercises: ExerciseTemplate[];
  created: string;
}

export interface ExerciseTemplate {
  id: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  order: number;
}

// ============ NUTRITION MODELS ============

export interface DailyNutrition {
  id: string;
  userId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  calorieTarget: number;
  meals: Meal[];
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  time: string; // ISO date string
}

// For future use (Phase 2)
export interface SavedMeal {
  id: string;
  userId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// ============ STEPS/ACTIVITY MODELS ============

export interface DailySteps {
  id: string;
  userId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  steps: number;
  stepGoal: number;
  source: 'manual' | 'apple_health' | 'google_fit';
}

// ============ UNIFIED DAILY VIEW ============

export interface DailySummary {
  date: string; // YYYY-MM-DD
  workout?: WorkoutLog;
  nutrition: DailyNutrition;
  steps: DailySteps;
}

// ============ APP STATE ============

export interface AppState {
  user: User;
  workouts: WorkoutLog[];
  nutrition: DailyNutrition[];
  steps: DailySteps[];
  // Future: templates, savedMeals, etc.
}
