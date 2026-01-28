/**
 * Daily Tracking Store - Zustand
 *
 * Centralized state for steps, weight, and weekly stats.
 */

import { create } from 'zustand';
import { DailySteps, DailyWeight, WeeklyStats, WeekComparison, User } from '../types';
import {
  getStepsByDate,
  saveSteps,
  getWeightByDate,
  saveWeight,
  getWeightsInRange,
  calculateWeeklyStats,
  generateId,
} from '../services/storage';
import { getWeekDates, getPreviousWeekDates } from '../utils/dateUtils';

interface DailyTrackingState {
  // Steps
  todaySteps: DailySteps | null;

  // Weight
  todayWeight: DailyWeight | null;
  recentWeights: DailyWeight[];

  // Weekly Stats
  currentWeekStats: WeeklyStats | null;
  previousWeekStats: WeeklyStats | null;
  weekComparison: WeekComparison | null;

  // Loading
  isLoading: boolean;

  // Actions - Steps
  fetchTodaySteps: (date: string, userId: string, stepGoal: number) => Promise<DailySteps>;
  updateSteps: (steps: number) => Promise<void>;

  // Actions - Weight
  fetchTodayWeight: (date: string, userId: string, unit: 'kg' | 'lbs') => Promise<DailyWeight>;
  fetchRecentWeights: (endDate: string, days: number, userId: string) => Promise<void>;
  updateWeight: (weight: number) => Promise<void>;

  // Actions - Weekly Stats
  fetchWeeklyStats: (user: User) => Promise<void>;

  // Actions - General
  invalidateCache: () => void;
}

export const useDailyTrackingStore = create<DailyTrackingState>((set, get) => ({
  todaySteps: null,
  todayWeight: null,
  recentWeights: [],
  currentWeekStats: null,
  previousWeekStats: null,
  weekComparison: null,
  isLoading: false,

  fetchTodaySteps: async (date: string, userId: string, stepGoal: number) => {
    try {
      let steps = await getStepsByDate(date, userId);

      if (!steps) {
        steps = {
          id: generateId(),
          userId,
          date,
          steps: 0,
          stepGoal,
          source: 'manual' as const,
        };
        await saveSteps(steps);
      }

      set({ todaySteps: steps });
      return steps;
    } catch (error) {
      console.error('Failed to fetch steps:', error);
      throw error;
    }
  },

  updateSteps: async (stepsCount: number) => {
    const { todaySteps } = get();
    if (!todaySteps) return;

    const updatedSteps: DailySteps = {
      ...todaySteps,
      steps: stepsCount,
    };

    await saveSteps(updatedSteps);
    set({ todaySteps: updatedSteps });
  },

  fetchTodayWeight: async (date: string, userId: string, unit: 'kg' | 'lbs') => {
    try {
      let weight = await getWeightByDate(date, userId);

      if (!weight) {
        weight = {
          id: generateId(),
          userId,
          date,
          weight: 0,
          unit,
          source: 'manual' as const,
          created: new Date().toISOString(),
        };
        await saveWeight(weight);
      }

      set({ todayWeight: weight });
      return weight;
    } catch (error) {
      console.error('Failed to fetch weight:', error);
      throw error;
    }
  },

  fetchRecentWeights: async (endDate: string, days: number, userId: string) => {
    try {
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const weights = await getWeightsInRange(startDateStr, endDate, userId);
      set({ recentWeights: weights });
    } catch (error) {
      console.error('Failed to fetch recent weights:', error);
    }
  },

  updateWeight: async (weightValue: number) => {
    const { todayWeight, recentWeights } = get();
    if (!todayWeight) return;

    const updatedWeight: DailyWeight = {
      ...todayWeight,
      weight: weightValue,
    };

    await saveWeight(updatedWeight);

    // Update recent weights too
    const updatedRecentWeights = recentWeights.some((w) => w.date === todayWeight.date)
      ? recentWeights.map((w) => (w.date === todayWeight.date ? updatedWeight : w))
      : [...recentWeights, updatedWeight].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

    set({
      todayWeight: updatedWeight,
      recentWeights: updatedRecentWeights,
    });
  },

  fetchWeeklyStats: async (user: User) => {
    set({ isLoading: true });
    try {
      const today = new Date();
      const { start: currentStart, end: currentEnd } = getWeekDates(today);
      const { start: prevStart, end: prevEnd } = getPreviousWeekDates(today);

      const [currentStats, previousStats] = await Promise.all([
        calculateWeeklyStats(currentStart, currentEnd, user),
        calculateWeeklyStats(prevStart, prevEnd, user),
      ]);

      // Calculate comparison
      const comparison: WeekComparison = {
        workouts: currentStats.totalWorkouts - previousStats.totalWorkouts,
        calories: currentStats.totalCalories - previousStats.totalCalories,
        steps: currentStats.totalSteps - previousStats.totalSteps,
        workoutsPercent:
          previousStats.totalWorkouts > 0
            ? Math.round(
                ((currentStats.totalWorkouts - previousStats.totalWorkouts) /
                  previousStats.totalWorkouts) *
                  100
              )
            : currentStats.totalWorkouts > 0
            ? 100
            : 0,
        caloriesPercent:
          previousStats.totalCalories > 0
            ? Math.round(
                ((currentStats.totalCalories - previousStats.totalCalories) /
                  previousStats.totalCalories) *
                  100
              )
            : currentStats.totalCalories > 0
            ? 100
            : 0,
        stepsPercent:
          previousStats.totalSteps > 0
            ? Math.round(
                ((currentStats.totalSteps - previousStats.totalSteps) / previousStats.totalSteps) *
                  100
              )
            : currentStats.totalSteps > 0
            ? 100
            : 0,
      };

      set({
        currentWeekStats: currentStats,
        previousWeekStats: previousStats,
        weekComparison: comparison,
      });
    } catch (error) {
      console.error('Failed to fetch weekly stats:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  invalidateCache: () => {
    set({
      todaySteps: null,
      todayWeight: null,
      recentWeights: [],
      currentWeekStats: null,
      previousWeekStats: null,
      weekComparison: null,
    });
  },
}));
