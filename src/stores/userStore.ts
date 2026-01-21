/**
 * User Store - Zustand
 *
 * Centralized state for user profile and preferences.
 * Initialized once at app startup and accessed by all screens.
 */

import { create } from 'zustand';
import { User } from '../types';
import { getUser, saveUser, initializeApp } from '../services/storage';

interface UserState {
  // State
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<User>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  setWeightUnit: (unit: 'kg' | 'lbs') => Promise<void>;
  setCalorieTarget: (target: number) => Promise<void>;
  setStepGoal: (goal: number) => Promise<void>;
  setGoalWeight: (weight: number | undefined) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized && get().user) {
      return get().user!;
    }

    set({ isLoading: true });
    try {
      const user = await initializeApp();
      set({ user, isInitialized: true });
      return user;
    } catch (error) {
      console.error('Failed to initialize user:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const user = await getUser();
      if (user) {
        set({ user });
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },

  updateUser: async (updates) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    await saveUser(updatedUser);
    set({ user: updatedUser });
  },

  setWeightUnit: async (unit) => {
    await get().updateUser({ preferredWeightUnit: unit });
  },

  setCalorieTarget: async (target) => {
    await get().updateUser({ dailyCalorieTarget: target });
  },

  setStepGoal: async (goal) => {
    await get().updateUser({ dailyStepGoal: goal });
  },

  setGoalWeight: async (weight) => {
    await get().updateUser({ goalWeight: weight });
  },
}));
