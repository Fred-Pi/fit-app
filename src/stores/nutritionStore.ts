/**
 * Nutrition Store - Zustand
 *
 * Centralized state for daily nutrition and meals.
 */

import { create } from 'zustand';
import { DailyNutrition, Meal } from '../types';
import {
  getNutritionByDate,
  saveNutrition,
  generateId,
} from '../services/storage';
import { logError } from '../utils/logger';

interface NutritionState {
  // State
  todayNutrition: DailyNutrition | null;
  nutritionCache: Map<string, DailyNutrition>;
  isLoading: boolean;
  currentDate: string;

  // Actions
  fetchNutritionByDate: (date: string, userId: string, calorieTarget: number) => Promise<DailyNutrition>;
  addMeal: (meal: Meal) => Promise<void>;
  updateMeal: (meal: Meal) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  deleteMultipleMeals: (mealIds: string[]) => Promise<void>;
  setCurrentDate: (date: string) => void;
  invalidateCache: () => void;

  // Computed
  getTotalCalories: () => number;
  getTotalProtein: () => number;
  getTotalCarbs: () => number;
  getTotalFats: () => number;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  todayNutrition: null,
  nutritionCache: new Map(),
  isLoading: false,
  currentDate: new Date().toISOString().split('T')[0],

  fetchNutritionByDate: async (date: string, userId: string, calorieTarget: number) => {
    const { nutritionCache } = get();

    // Check cache first
    if (nutritionCache.has(date)) {
      const cached = nutritionCache.get(date)!;
      if (date === get().currentDate) {
        set({ todayNutrition: cached });
      }
      return cached;
    }

    set({ isLoading: true });
    try {
      let nutrition = await getNutritionByDate(date, userId);

      // Create if doesn't exist
      if (!nutrition) {
        nutrition = {
          id: generateId(),
          userId,
          date,
          calorieTarget,
          meals: [],
        };
        await saveNutrition(nutrition);
      }

      // Update cache
      const newCache = new Map(nutritionCache);
      newCache.set(date, nutrition);

      set({
        nutritionCache: newCache,
        todayNutrition: date === get().currentDate ? nutrition : get().todayNutrition,
      });

      return nutrition;
    } catch (error) {
      logError('Failed to fetch nutrition', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addMeal: async (meal: Meal) => {
    const { todayNutrition, nutritionCache, currentDate } = get();
    if (!todayNutrition) return;

    const updatedNutrition: DailyNutrition = {
      ...todayNutrition,
      meals: [...todayNutrition.meals, meal],
    };

    await saveNutrition(updatedNutrition);

    // Update cache
    const newCache = new Map(nutritionCache);
    newCache.set(currentDate, updatedNutrition);

    set({
      todayNutrition: updatedNutrition,
      nutritionCache: newCache,
    });
  },

  updateMeal: async (meal: Meal) => {
    const { todayNutrition, nutritionCache, currentDate } = get();
    if (!todayNutrition) return;

    const updatedNutrition: DailyNutrition = {
      ...todayNutrition,
      meals: todayNutrition.meals.map((m) => (m.id === meal.id ? meal : m)),
    };

    await saveNutrition(updatedNutrition);

    // Update cache
    const newCache = new Map(nutritionCache);
    newCache.set(currentDate, updatedNutrition);

    set({
      todayNutrition: updatedNutrition,
      nutritionCache: newCache,
    });
  },

  deleteMeal: async (mealId: string) => {
    const { todayNutrition, nutritionCache, currentDate } = get();
    if (!todayNutrition) return;

    const updatedNutrition: DailyNutrition = {
      ...todayNutrition,
      meals: todayNutrition.meals.filter((m) => m.id !== mealId),
    };

    await saveNutrition(updatedNutrition);

    // Update cache
    const newCache = new Map(nutritionCache);
    newCache.set(currentDate, updatedNutrition);

    set({
      todayNutrition: updatedNutrition,
      nutritionCache: newCache,
    });
  },

  deleteMultipleMeals: async (mealIds: string[]) => {
    const { todayNutrition, nutritionCache, currentDate } = get();
    if (!todayNutrition) return;

    const idsSet = new Set(mealIds);
    const updatedNutrition: DailyNutrition = {
      ...todayNutrition,
      meals: todayNutrition.meals.filter((m) => !idsSet.has(m.id)),
    };

    await saveNutrition(updatedNutrition);

    // Update cache
    const newCache = new Map(nutritionCache);
    newCache.set(currentDate, updatedNutrition);

    set({
      todayNutrition: updatedNutrition,
      nutritionCache: newCache,
    });
  },

  setCurrentDate: (date: string) => {
    set({ currentDate: date });
  },

  invalidateCache: () => {
    set({
      nutritionCache: new Map(),
      todayNutrition: null,
    });
  },

  // Computed values
  getTotalCalories: () => {
    const { todayNutrition } = get();
    if (!todayNutrition) return 0;
    return todayNutrition.meals.reduce((sum, meal) => sum + meal.calories, 0);
  },

  getTotalProtein: () => {
    const { todayNutrition } = get();
    if (!todayNutrition) return 0;
    return todayNutrition.meals.reduce((sum, meal) => sum + meal.protein, 0);
  },

  getTotalCarbs: () => {
    const { todayNutrition } = get();
    if (!todayNutrition) return 0;
    return todayNutrition.meals.reduce((sum, meal) => sum + meal.carbs, 0);
  },

  getTotalFats: () => {
    const { todayNutrition } = get();
    if (!todayNutrition) return 0;
    return todayNutrition.meals.reduce((sum, meal) => sum + meal.fats, 0);
  },
}));
