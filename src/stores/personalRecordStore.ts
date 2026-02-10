/**
 * Personal Record Store - Zustand
 *
 * Manages personal records (PRs) for exercises.
 */

import { create } from 'zustand';
import { PersonalRecord } from '../types';
import {
  getPersonalRecords,
  deletePersonalRecord as deletePRFromStorage,
} from '../services/storage';
import { useAuthStore } from './authStore';
import { logError } from '../utils/logger';

// Helper to get current userId from auth store
const getUserId = (): string | null => {
  const { user } = useAuthStore.getState();
  return user?.id ?? null;
};

interface PersonalRecordState {
  // State
  personalRecords: PersonalRecord[];
  prsLoaded: boolean;
  isPRsLoading: boolean;
  isPRsRefreshing: boolean;

  // Actions
  fetchPersonalRecords: (force?: boolean) => Promise<void>;
  deletePersonalRecord: (prId: string) => Promise<void>;
  addPersonalRecords: (newPRs: PersonalRecord[]) => void;
  invalidateCache: () => void;

  // Selectors
  getPRForExercise: (exerciseName: string) => PersonalRecord | undefined;
  getPRsByMuscleGroup: (muscleGroup: string) => PersonalRecord[];
}

export const usePersonalRecordStore = create<PersonalRecordState>((set, get) => ({
  // Initial state
  personalRecords: [],
  prsLoaded: false,
  isPRsLoading: false,
  isPRsRefreshing: false,

  fetchPersonalRecords: async (force = false) => {
    const userId = getUserId();
    if (!userId) return;

    const { prsLoaded, isPRsLoading } = get();

    // Skip if already loaded and not forced
    if (!force && prsLoaded && !isPRsLoading) {
      return;
    }

    set({
      isPRsLoading: !prsLoaded,
      isPRsRefreshing: prsLoaded,
    });

    try {
      const personalRecords = await getPersonalRecords(userId);
      set({ personalRecords, prsLoaded: true });
    } catch (error) {
      logError('Failed to fetch personal records', error);
    } finally {
      set({ isPRsLoading: false, isPRsRefreshing: false });
    }
  },

  deletePersonalRecord: async (prId: string) => {
    await deletePRFromStorage(prId);
    const { personalRecords } = get();
    set({ personalRecords: personalRecords.filter((pr) => pr.id !== prId) });
  },

  addPersonalRecords: (newPRs: PersonalRecord[]) => {
    if (newPRs.length === 0) return;

    const { personalRecords } = get();
    // Replace existing PRs with same ID, add new ones
    const updatedPRs = [
      ...personalRecords.filter((pr) => !newPRs.some((np) => np.id === pr.id)),
      ...newPRs,
    ];
    set({ personalRecords: updatedPRs });
  },

  invalidateCache: () => {
    set({ prsLoaded: false });
  },

  // Selectors
  getPRForExercise: (exerciseName: string) => {
    return get().personalRecords.find((pr) => pr.exerciseName === exerciseName);
  },

  getPRsByMuscleGroup: (_muscleGroup: string) => {
    // This would need exercise data to map - returning all for now
    // Consumers should filter based on their exercise data
    return get().personalRecords;
  },
}));
