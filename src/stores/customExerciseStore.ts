/**
 * Custom Exercise Store - Zustand
 *
 * Manages user-created custom exercises.
 */

import { create } from 'zustand';
import { Exercise } from '../types';
import {
  getCustomExercises,
  saveCustomExercise as saveCustomExerciseToStorage,
  deleteCustomExercise as deleteCustomExerciseFromStorage,
} from '../services/storage';
import { useAuthStore } from './authStore';
import { logError } from '../utils/logger';

// Helper to get current userId from auth store
const getUserId = (): string | null => {
  const { user } = useAuthStore.getState();
  return user?.id ?? null;
};

interface CustomExerciseState {
  // State
  customExercises: Exercise[];
  customExercisesLoaded: boolean;
  isLoading: boolean;

  // Actions
  fetchCustomExercises: () => Promise<void>;
  addCustomExercise: (exercise: Exercise) => Promise<void>;
  updateCustomExercise: (exercise: Exercise) => Promise<void>;
  deleteCustomExercise: (exerciseId: string) => Promise<void>;
  invalidateCache: () => void;

  // Selectors
  getCustomExerciseById: (id: string) => Exercise | undefined;
  getCustomExerciseByName: (name: string) => Exercise | undefined;
}

export const useCustomExerciseStore = create<CustomExerciseState>((set, get) => ({
  // Initial state
  customExercises: [],
  customExercisesLoaded: false,
  isLoading: false,

  fetchCustomExercises: async () => {
    const userId = getUserId();
    if (!userId) return;
    if (get().customExercisesLoaded) return;

    set({ isLoading: true });
    try {
      const customExercises = await getCustomExercises(userId);
      set({ customExercises, customExercisesLoaded: true });
    } catch (error) {
      logError('Failed to fetch custom exercises', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addCustomExercise: async (exercise: Exercise) => {
    await saveCustomExerciseToStorage(exercise);
    const { customExercises } = get();
    set({ customExercises: [...customExercises, exercise] });
  },

  updateCustomExercise: async (exercise: Exercise) => {
    await saveCustomExerciseToStorage(exercise);
    const { customExercises } = get();
    set({
      customExercises: customExercises.map((e) =>
        e.id === exercise.id ? exercise : e
      ),
    });
  },

  deleteCustomExercise: async (exerciseId: string) => {
    await deleteCustomExerciseFromStorage(exerciseId);
    const { customExercises } = get();
    set({ customExercises: customExercises.filter((e) => e.id !== exerciseId) });
  },

  invalidateCache: () => {
    set({ customExercisesLoaded: false });
  },

  // Selectors
  getCustomExerciseById: (id: string) => {
    return get().customExercises.find((e) => e.id === id);
  },

  getCustomExerciseByName: (name: string) => {
    return get().customExercises.find(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    );
  },
}));
