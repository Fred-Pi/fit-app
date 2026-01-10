// Core data models for the fitness tracking app

export interface User {
  id: string;
  name: string;
  email?: string;
  dailyCalorieTarget: number;
  dailyStepGoal: number;
  preferredWeightUnit: 'kg' | 'lbs';
  goalWeight?: number; // in user's preferred unit
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
  notes?: string;
}

export interface SetLog {
  reps: number;
  weight: number; // in user's preferred unit
  rpe?: number; // 1-10, optional
  completed: boolean;
}

// ============ EXERCISE DATABASE MODELS ============

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Arms'
  | 'Legs'
  | 'Core'
  | 'Cardio';

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  defaultSets?: number;
  defaultReps?: number;
}

export interface ExerciseCategory {
  name: MuscleGroup;
  icon: string;
  color: string;
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
  targetWeight?: number;
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

// ============ BODY WEIGHT TRACKING ============

export interface DailyWeight {
  id: string;
  userId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  weight: number; // in user's preferred unit
  unit: 'kg' | 'lbs';
  source: 'manual' | 'smart_scale';
  created: string; // ISO date string
}

// ============ UNIFIED DAILY VIEW ============

export interface DailySummary {
  date: string; // YYYY-MM-DD
  workout?: WorkoutLog;
  nutrition: DailyNutrition;
  steps: DailySteps;
}

// ============ PERSONAL RECORDS ============

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseName: string;
  weight: number; // Best weight lifted
  reps: number; // Reps achieved at that weight
  date: string; // ISO date string when PR was set
  workoutId: string; // Reference to the workout where PR was achieved
  created: string; // ISO date string
}

// ============ WEEKLY STATISTICS ============

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  totalWorkouts: number; // Completed workouts
  totalCalories: number; // Sum of all calories
  avgCalories: number; // Average per day
  calorieTarget: number; // Weekly target (daily * 7)
  totalSteps: number; // Sum of all steps
  avgSteps: number; // Average per day
  stepGoal: number; // Weekly goal (daily * 7)
  daysActive: number; // Unique days with workouts
}

export interface WeekComparison {
  workouts: number; // Difference from last week
  calories: number; // Difference from last week
  steps: number; // Difference from last week
  workoutsPercent: number; // % change
  caloriesPercent: number; // % change
  stepsPercent: number; // % change
}

// ============ APP STATE ============

export interface AppState {
  user: User;
  workouts: WorkoutLog[];
  nutrition: DailyNutrition[];
  steps: DailySteps[];
  // Future: templates, savedMeals, etc.
}

// ============ ANALYTICS ============

export type DateRangeKey = '30D' | '3M' | '6M' | 'ALL'

export interface DateRange {
  start: string  // YYYY-MM-DD
  end: string    // YYYY-MM-DD
  days: number | null
  label: string
}

export interface VolumeDataPoint {
  date: string        // Week start date
  volume: number      // Total volume in lbs or kg
  workouts: number    // Number of workouts in this period
}

export interface StrengthDataPoint {
  date: string
  weight: number
  reps: number
  workoutName: string
}

export interface FrequencyDataPoint {
  date: string
  count: number       // Number of workouts on this day
}

export interface MuscleGroupData {
  name: MuscleGroup
  sets: number
  percentage: number
  color: string
}

export interface MuscleGroupScore {
  name: MuscleGroup
  sets: number
  volume: number
  daysTrained: number
  score: number  // 0-100 normalized
  intensity: 'none' | 'low' | 'medium' | 'high'
  lastTrained: string | null
}

export interface MuscleGroupHeatmapData {
  scores: MuscleGroupScore[]
  mostTrained: MuscleGroup | null
  needsAttention: MuscleGroup[]
  totalSets: number
  daysActive: number
}
