/**
 * Input validation utilities for fitness app
 *
 * Provides validation functions for workout, nutrition, and tracking data
 * to prevent invalid data from being stored.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Weight validation (for exercise weights)
const MAX_EXERCISE_WEIGHT_LBS = 1500;
const MAX_EXERCISE_WEIGHT_KG = 700;

export const validateExerciseWeight = (
  weight: number,
  unit: 'lbs' | 'kg' = 'lbs'
): ValidationResult => {
  if (weight < 0) {
    return { isValid: false, error: 'Weight cannot be negative' };
  }

  const maxWeight = unit === 'kg' ? MAX_EXERCISE_WEIGHT_KG : MAX_EXERCISE_WEIGHT_LBS;
  if (weight > maxWeight) {
    return { isValid: false, error: `Weight cannot exceed ${maxWeight} ${unit}` };
  }

  return { isValid: true };
};

// Body weight validation
const MAX_BODY_WEIGHT_LBS = 1000;
const MAX_BODY_WEIGHT_KG = 450;
const MIN_BODY_WEIGHT_LBS = 50;
const MIN_BODY_WEIGHT_KG = 20;

export const validateBodyWeight = (
  weight: number,
  unit: 'lbs' | 'kg' = 'lbs'
): ValidationResult => {
  const minWeight = unit === 'kg' ? MIN_BODY_WEIGHT_KG : MIN_BODY_WEIGHT_LBS;
  const maxWeight = unit === 'kg' ? MAX_BODY_WEIGHT_KG : MAX_BODY_WEIGHT_LBS;

  if (weight < minWeight) {
    return { isValid: false, error: `Weight must be at least ${minWeight} ${unit}` };
  }

  if (weight > maxWeight) {
    return { isValid: false, error: `Weight cannot exceed ${maxWeight} ${unit}` };
  }

  return { isValid: true };
};

// Reps validation
const MAX_REPS = 1000;

export const validateReps = (reps: number): ValidationResult => {
  if (!Number.isInteger(reps)) {
    return { isValid: false, error: 'Reps must be a whole number' };
  }

  if (reps < 0) {
    return { isValid: false, error: 'Reps cannot be negative' };
  }

  if (reps > MAX_REPS) {
    return { isValid: false, error: `Reps cannot exceed ${MAX_REPS}` };
  }

  return { isValid: true };
};

// Sets count validation
const MAX_SETS = 100;

export const validateSets = (sets: number): ValidationResult => {
  if (!Number.isInteger(sets)) {
    return { isValid: false, error: 'Sets must be a whole number' };
  }

  if (sets < 1) {
    return { isValid: false, error: 'Must have at least 1 set' };
  }

  if (sets > MAX_SETS) {
    return { isValid: false, error: `Sets cannot exceed ${MAX_SETS}` };
  }

  return { isValid: true };
};

// RPE validation (Rate of Perceived Exertion)
export const validateRPE = (rpe: number): ValidationResult => {
  if (rpe < 1 || rpe > 10) {
    return { isValid: false, error: 'RPE must be between 1 and 10' };
  }

  return { isValid: true };
};

// Calorie validation
const MAX_CALORIES = 10000;

export const validateCalories = (calories: number): ValidationResult => {
  if (calories < 0) {
    return { isValid: false, error: 'Calories cannot be negative' };
  }

  if (calories > MAX_CALORIES) {
    return { isValid: false, error: `Calories cannot exceed ${MAX_CALORIES}` };
  }

  return { isValid: true };
};

// Macro validation (protein, carbs, fats in grams)
const MAX_MACRO_GRAMS = 1000;

export const validateMacro = (grams: number, macroName: string): ValidationResult => {
  if (grams < 0) {
    return { isValid: false, error: `${macroName} cannot be negative` };
  }

  if (grams > MAX_MACRO_GRAMS) {
    return { isValid: false, error: `${macroName} cannot exceed ${MAX_MACRO_GRAMS}g` };
  }

  return { isValid: true };
};

export const validateMacros = (
  protein: number,
  carbs: number,
  fats: number
): ValidationResult => {
  const proteinValidation = validateMacro(protein, 'Protein');
  if (!proteinValidation.isValid) return proteinValidation;

  const carbsValidation = validateMacro(carbs, 'Carbs');
  if (!carbsValidation.isValid) return carbsValidation;

  const fatsValidation = validateMacro(fats, 'Fats');
  if (!fatsValidation.isValid) return fatsValidation;

  return { isValid: true };
};

// Steps validation
const MAX_STEPS = 100000;

export const validateSteps = (steps: number): ValidationResult => {
  if (!Number.isInteger(steps)) {
    return { isValid: false, error: 'Steps must be a whole number' };
  }

  if (steps < 0) {
    return { isValid: false, error: 'Steps cannot be negative' };
  }

  if (steps > MAX_STEPS) {
    return { isValid: false, error: `Steps cannot exceed ${MAX_STEPS}` };
  }

  return { isValid: true };
};

// Text input validation
const MAX_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 1000;

export const validateName = (name: string): ValidationResult => {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return { isValid: false, error: `Name cannot exceed ${MAX_NAME_LENGTH} characters` };
  }

  return { isValid: true };
};

export const validateNotes = (notes: string): ValidationResult => {
  if (notes.length > MAX_NOTES_LENGTH) {
    return { isValid: false, error: `Notes cannot exceed ${MAX_NOTES_LENGTH} characters` };
  }

  return { isValid: true };
};

// Meal validation
export const validateMeal = (meal: {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}): ValidationResult => {
  const nameValidation = validateName(meal.name);
  if (!nameValidation.isValid) return nameValidation;

  const caloriesValidation = validateCalories(meal.calories);
  if (!caloriesValidation.isValid) return caloriesValidation;

  const macrosValidation = validateMacros(meal.protein, meal.carbs, meal.fats);
  if (!macrosValidation.isValid) return macrosValidation;

  return { isValid: true };
};

// Set validation (for workout sets)
export const validateSet = (set: {
  weight: number;
  reps: number;
  rpe?: number;
}): ValidationResult => {
  const weightValidation = validateExerciseWeight(set.weight);
  if (!weightValidation.isValid) return weightValidation;

  const repsValidation = validateReps(set.reps);
  if (!repsValidation.isValid) return repsValidation;

  if (set.rpe !== undefined) {
    const rpeValidation = validateRPE(set.rpe);
    if (!rpeValidation.isValid) return rpeValidation;
  }

  return { isValid: true };
};

// Serving size validation
const MAX_SERVING_SIZE = 10000;

export const validateServingSize = (size: number): ValidationResult => {
  if (size <= 0) {
    return { isValid: false, error: 'Serving size must be greater than 0' };
  }

  if (size > MAX_SERVING_SIZE) {
    return { isValid: false, error: `Serving size cannot exceed ${MAX_SERVING_SIZE}` };
  }

  return { isValid: true };
};

// Food preset validation
export const validatePreset = (preset: {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}): ValidationResult => {
  const nameValidation = validateName(preset.name);
  if (!nameValidation.isValid) return nameValidation;

  const servingSizeValidation = validateServingSize(preset.servingSize);
  if (!servingSizeValidation.isValid) return servingSizeValidation;

  if (!['g', 'ml', 'piece'].includes(preset.servingUnit)) {
    return { isValid: false, error: 'Invalid serving unit' };
  }

  const caloriesValidation = validateCalories(preset.calories);
  if (!caloriesValidation.isValid) return caloriesValidation;

  const macrosValidation = validateMacros(preset.protein, preset.carbs, preset.fats);
  if (!macrosValidation.isValid) return macrosValidation;

  return { isValid: true };
};
