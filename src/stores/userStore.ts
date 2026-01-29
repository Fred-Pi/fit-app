/**
 * User Store - Zustand
 *
 * Centralized state for user profile and preferences.
 * Initialized once at app startup and accessed by all screens.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { getUser, saveUser, initializeApp } from '../services/storage';

const WELCOME_SHOWN_KEY = '@fittrack:lastWelcomeShown';
const NAME_SET_KEY = '@fittrack:nameSet';

interface UserState {
  // State
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  lastWelcomeShown: number | null;
  nameHasBeenSet: boolean;

  // Actions
  initialize: () => Promise<User>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  setWeightUnit: (unit: 'kg' | 'lbs') => Promise<void>;
  setCalorieTarget: (target: number) => Promise<void>;
  setStepGoal: (goal: number) => Promise<void>;
  setGoalWeight: (weight: number | undefined) => Promise<void>;
  refreshUser: () => Promise<void>;
  shouldShowWelcome: () => boolean;
  markWelcomeShown: () => Promise<void>;
  loadWelcomeState: () => Promise<void>;
  shouldShowNamePrompt: () => boolean;
  markNameSet: () => Promise<void>;
  loadNameState: () => Promise<void>;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  lastWelcomeShown: null,
  nameHasBeenSet: false,

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

  loadWelcomeState: async () => {
    try {
      const stored = await AsyncStorage.getItem(WELCOME_SHOWN_KEY);
      if (stored) {
        set({ lastWelcomeShown: parseInt(stored, 10) });
      }
    } catch (error) {
      console.error('Failed to load welcome state:', error);
    }
  },

  shouldShowWelcome: () => {
    const { lastWelcomeShown } = get();
    const now = Date.now();

    // First time user or never shown
    if (lastWelcomeShown === null) {
      return true;
    }

    // Check if 7+ days have passed
    return now - lastWelcomeShown >= SEVEN_DAYS_MS;
  },

  markWelcomeShown: async () => {
    const now = Date.now();
    try {
      await AsyncStorage.setItem(WELCOME_SHOWN_KEY, now.toString());
      set({ lastWelcomeShown: now });
    } catch (error) {
      console.error('Failed to save welcome state:', error);
    }
  },

  loadNameState: async () => {
    try {
      const stored = await AsyncStorage.getItem(NAME_SET_KEY);
      if (stored === 'true') {
        set({ nameHasBeenSet: true });
      }
    } catch (error) {
      console.error('Failed to load name state:', error);
    }
  },

  shouldShowNamePrompt: () => {
    const { user, nameHasBeenSet } = get();
    // Show prompt if name is 'User' AND we haven't marked it as set before
    return user?.name === 'User' && !nameHasBeenSet;
  },

  markNameSet: async () => {
    try {
      await AsyncStorage.setItem(NAME_SET_KEY, 'true');
      set({ nameHasBeenSet: true });
    } catch (error) {
      console.error('Failed to save name state:', error);
    }
  },
}));
