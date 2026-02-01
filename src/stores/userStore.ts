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
import {
  fetchProfile,
  updateProfile as updateSupabaseProfile,
  ensureProfile,
  isSupabaseConfigured,
} from '../services/supabase';
import { useAuthStore } from './authStore';
import { logError } from '../utils/logger';

const WELCOME_SHOWN_KEY = '@fittrack:lastWelcomeShown';
const NAME_SET_KEY_PREFIX = '@fittrack:nameSet:';

/**
 * Extract user name from OAuth metadata
 * Different providers use different field names
 */
const extractNameFromMetadata = (metadata: Record<string, unknown> | undefined): string | null => {
  if (!metadata) return null;

  // Try various name fields used by OAuth providers
  const nameFields = [
    'name',           // Standard field
    'full_name',      // Google OAuth
    'user_name',      // Some providers
    'display_name',   // Some providers
  ];

  for (const field of nameFields) {
    const value = metadata[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  // Try combining given_name + family_name (Apple, some providers)
  const givenName = metadata['given_name'];
  const familyName = metadata['family_name'];
  if (typeof givenName === 'string' && givenName.trim()) {
    const fullName = familyName && typeof familyName === 'string'
      ? `${givenName.trim()} ${familyName.trim()}`
      : givenName.trim();
    return fullName;
  }

  return null;
};

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
    const authUser = useAuthStore.getState().user;
    const currentUser = get().user;

    // If already initialized with the same user, return early
    if (get().isInitialized && currentUser && authUser && currentUser.id === authUser.id) {
      return currentUser;
    }

    // Reset state for new user
    set({ isLoading: true, nameHasBeenSet: false });
    try {
      // First, try to get local user
      let user = await initializeApp();

      // If Supabase is configured and user is authenticated, sync with Supabase profile
      if (isSupabaseConfigured && authUser) {
        // Extract name from OAuth metadata, local user, or mark as needing prompt
        const oauthName = extractNameFromMetadata(authUser.user_metadata);
        const existingName = user.name && user.name !== 'User' ? user.name : null;
        const userName = oauthName || existingName || 'User';

        // Fetch or create profile in Supabase
        const profile = await ensureProfile(
          authUser.id,
          userName,
          authUser.email
        );

        if (profile) {
          // Merge Supabase profile with local user (Supabase takes precedence)
          user = {
            ...user,
            id: profile.id,
            name: profile.name,
            email: profile.email,
            dailyCalorieTarget: profile.daily_calorie_target,
            dailyStepGoal: profile.daily_step_goal,
            preferredWeightUnit: profile.preferred_weight_unit,
            goalWeight: profile.goal_weight,
            created: profile.created_at,
          };
          // Save merged profile locally
          await saveUser(user);
        }
      }

      set({ user, isInitialized: true });
      return user;
    } catch (error) {
      logError('Failed to initialize user', error);
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
      logError('Failed to refresh user', error);
    }
  },

  updateUser: async (updates) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = { ...user, ...updates };

    // Save locally
    await saveUser(updatedUser);

    // Also sync to Supabase if configured and authenticated
    const authUser = useAuthStore.getState().user;
    if (isSupabaseConfigured && authUser) {
      await updateSupabaseProfile(authUser.id, {
        name: updates.name,
        daily_calorie_target: updates.dailyCalorieTarget,
        daily_step_goal: updates.dailyStepGoal,
        preferred_weight_unit: updates.preferredWeightUnit,
        goal_weight: updates.goalWeight,
      });
    }

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
      logError('Failed to load welcome state', error);
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
      logError('Failed to save welcome state', error);
    }
  },

  loadNameState: async () => {
    try {
      const { user } = get();
      if (!user?.id) return;
      const stored = await AsyncStorage.getItem(`${NAME_SET_KEY_PREFIX}${user.id}`);
      if (stored === 'true') {
        set({ nameHasBeenSet: true });
      }
    } catch (error) {
      logError('Failed to load name state', error);
    }
  },

  shouldShowNamePrompt: () => {
    const { user, nameHasBeenSet } = get();
    // Show prompt if name is 'User' AND we haven't marked it as set before
    return user?.name === 'User' && !nameHasBeenSet;
  },

  markNameSet: async () => {
    try {
      const { user } = get();
      if (!user?.id) return;
      await AsyncStorage.setItem(`${NAME_SET_KEY_PREFIX}${user.id}`, 'true');
      set({ nameHasBeenSet: true });
    } catch (error) {
      logError('Failed to save name state', error);
    }
  },
}));
