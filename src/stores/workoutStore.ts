/**
 * Workout Store - Zustand
 *
 * Centralized state for workouts, templates, personal records, and custom exercises.
 * Includes caching to prevent redundant database queries.
 */

import { create } from 'zustand';
import {
  WorkoutLog,
  WorkoutTemplate,
  PersonalRecord,
  Exercise,
} from '../types';
import {
  getWorkouts,
  getWorkoutsPaginated,
  getWorkoutsByDate,
  saveWorkout,
  deleteWorkout as deleteWorkoutFromStorage,
  getTemplates,
  saveTemplate as saveTemplateToStorage,
  deleteTemplate as deleteTemplateFromStorage,
  getPersonalRecords,
  deletePersonalRecord as deletePRFromStorage,
  checkAndUpdatePRs,
  getCustomExercises,
  saveCustomExercise as saveCustomExerciseToStorage,
  deleteCustomExercise as deleteCustomExerciseFromStorage,
} from '../services/storage';
import { calculateWorkoutStreak } from '../utils/analyticsCalculations';
import { useAuthStore } from './authStore';
import { logError } from '../utils/logger';

// Pagination constants
const PAGE_SIZE = 50;

// Memoized streak calculation
let lastStreakWorkoutCount = -1;
let lastStreakResult = { current: 0, longest: 0 };

const getMemoizedStreak = (workouts: WorkoutLog[]): { current: number; longest: number } => {
  // Only recalculate if workout count changed
  // This is a simple heuristic - could be more precise with a hash
  if (workouts.length !== lastStreakWorkoutCount) {
    lastStreakWorkoutCount = workouts.length;
    lastStreakResult = calculateWorkoutStreak(workouts);
  }
  return lastStreakResult;
};

// Force streak recalculation (call when workouts are mutated)
const invalidateStreakCache = () => {
  lastStreakWorkoutCount = -1;
};

// Request deduplication map for fetchWorkoutsByDate
// Prevents duplicate fetches when multiple components request the same date concurrently
const pendingDateFetches = new Map<string, Promise<WorkoutLog[]>>();

// Helper to get current userId from auth store
const getUserId = (): string | null => {
  const { user } = useAuthStore.getState();
  return user?.id ?? null;
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_DATE_CACHE_ENTRIES = 30; // Limit date cache to prevent memory leaks

/**
 * Enforce cache size limit by removing oldest entries when exceeded.
 * Uses date string comparison since dates are in YYYY-MM-DD format.
 */
const enforceCache = <T>(
  cache: Map<string, T>,
  maxEntries: number
): Map<string, T> => {
  if (cache.size <= maxEntries) {
    return cache;
  }

  // Sort keys by date (oldest first) and keep only the most recent entries
  const sortedKeys = Array.from(cache.keys()).sort();
  const keysToRemove = sortedKeys.slice(0, cache.size - maxEntries);

  const newCache = new Map(cache);
  for (const key of keysToRemove) {
    newCache.delete(key);
  }

  return newCache;
};

interface WorkoutState {
  // State - Workouts
  workouts: WorkoutLog[];
  workoutsByDateCache: Map<string, WorkoutLog[]>;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  lastFetched: number | null;
  hasMoreWorkouts: boolean;
  totalWorkouts: number;

  // State - Streaks (computed but cached)
  currentStreak: number;
  longestStreak: number;

  // State - Templates
  templates: WorkoutTemplate[];
  templatesLoaded: boolean;

  // State - Personal Records
  personalRecords: PersonalRecord[];
  prsLoaded: boolean;
  isPRsLoading: boolean;
  isPRsRefreshing: boolean;

  // State - Custom Exercises
  customExercises: Exercise[];
  customExercisesLoaded: boolean;

  // Actions - Workouts
  fetchWorkouts: (force?: boolean) => Promise<void>;
  fetchWorkoutsByDate: (date: string) => Promise<WorkoutLog[]>;
  loadMoreWorkouts: () => Promise<void>;
  addWorkout: (workout: WorkoutLog) => Promise<PersonalRecord[]>;
  updateWorkout: (workout: WorkoutLog) => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  deleteMultipleWorkouts: (workoutIds: string[]) => Promise<void>;
  invalidateCache: () => void;

  // Actions - Templates
  fetchTemplates: () => Promise<void>;
  addTemplate: (template: WorkoutTemplate) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;

  // Actions - Personal Records
  fetchPersonalRecords: (force?: boolean) => Promise<void>;
  deletePersonalRecord: (prId: string) => Promise<void>;

  // Actions - Custom Exercises
  fetchCustomExercises: () => Promise<void>;
  addCustomExercise: (exercise: Exercise) => Promise<void>;
  updateCustomExercise: (exercise: Exercise) => Promise<void>;
  deleteCustomExercise: (exerciseId: string) => Promise<void>;

  // Selectors
  getWorkoutById: (id: string) => WorkoutLog | undefined;
  getRecentWorkouts: (limit: number) => WorkoutLog[];
  getWorkoutsInRange: (start: string, end: string) => WorkoutLog[];
  getTodayWorkout: (date: string) => WorkoutLog | undefined;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  // Initial state
  workouts: [],
  workoutsByDateCache: new Map(),
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  lastFetched: null,
  hasMoreWorkouts: true,
  totalWorkouts: 0,
  currentStreak: 0,
  longestStreak: 0,
  templates: [],
  templatesLoaded: false,
  personalRecords: [],
  prsLoaded: false,
  isPRsLoading: false,
  isPRsRefreshing: false,
  customExercises: [],
  customExercisesLoaded: false,

  // Workouts
  fetchWorkouts: async (force = false) => {
    const userId = getUserId();
    if (!userId) return;

    const { lastFetched, isLoading } = get();
    const now = Date.now();

    // Skip if recently fetched and not forced
    if (!force && lastFetched && now - lastFetched < CACHE_DURATION && !isLoading) {
      return;
    }

    set({ isLoading: !get().lastFetched, isRefreshing: !!get().lastFetched });
    try {
      // Use pagination for initial fetch
      const { workouts, hasMore, total } = await getWorkoutsPaginated(userId, PAGE_SIZE, 0);

      // Invalidate streak cache since we're refetching
      invalidateStreakCache();
      const streakData = getMemoizedStreak(workouts);

      set({
        workouts,
        lastFetched: now,
        hasMoreWorkouts: hasMore,
        totalWorkouts: total,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
        workoutsByDateCache: new Map(), // Clear date cache on full refresh
      });
    } catch (error) {
      logError('Failed to fetch workouts', error);
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  loadMoreWorkouts: async () => {
    const userId = getUserId();
    if (!userId) return;

    const { workouts, hasMoreWorkouts, isLoadingMore } = get();

    // Skip if no more workouts or already loading
    if (!hasMoreWorkouts || isLoadingMore) return;

    set({ isLoadingMore: true });
    try {
      const { workouts: moreWorkouts, hasMore } = await getWorkoutsPaginated(
        userId,
        PAGE_SIZE,
        workouts.length
      );

      const allWorkouts = [...workouts, ...moreWorkouts];

      // Update streak with all loaded workouts
      invalidateStreakCache();
      const streakData = getMemoizedStreak(allWorkouts);

      set({
        workouts: allWorkouts,
        hasMoreWorkouts: hasMore,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
      });
    } catch (error) {
      logError('Failed to load more workouts', error);
    } finally {
      set({ isLoadingMore: false });
    }
  },

  fetchWorkoutsByDate: async (date: string) => {
    const userId = getUserId();
    if (!userId) return [];

    const { workoutsByDateCache, workouts, lastFetched } = get();

    // Check cache first
    if (workoutsByDateCache.has(date)) {
      return workoutsByDateCache.get(date)!;
    }

    // If we have all workouts loaded, filter from memory
    if (lastFetched && workouts.length > 0) {
      const filtered = workouts.filter((w) => w.date === date);
      const newCache = new Map(workoutsByDateCache);
      newCache.set(date, filtered);
      set({ workoutsByDateCache: enforceCache(newCache, MAX_DATE_CACHE_ENTRIES) });
      return filtered;
    }

    // Check for pending request to deduplicate concurrent calls
    const cacheKey = `${userId}:${date}`;
    if (pendingDateFetches.has(cacheKey)) {
      return pendingDateFetches.get(cacheKey)!;
    }

    // Create the fetch promise and store it to deduplicate
    const fetchPromise = (async () => {
      try {
        const dateWorkouts = await getWorkoutsByDate(date, userId);
        const newCache = new Map(get().workoutsByDateCache);
        newCache.set(date, dateWorkouts);
        set({ workoutsByDateCache: enforceCache(newCache, MAX_DATE_CACHE_ENTRIES) });
        return dateWorkouts;
      } finally {
        // Clean up pending request after completion
        pendingDateFetches.delete(cacheKey);
      }
    })();

    pendingDateFetches.set(cacheKey, fetchPromise);
    return fetchPromise;
  },

  addWorkout: async (workout: WorkoutLog) => {
    await saveWorkout(workout);
    const newPRs = await checkAndUpdatePRs(workout);

    const { workouts, workoutsByDateCache, personalRecords, totalWorkouts } = get();

    // Update workouts list
    const updatedWorkouts = [workout, ...workouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Update date cache (enforce size limit for new dates)
    const newCache = new Map(workoutsByDateCache);
    const dateWorkouts = newCache.get(workout.date) || [];
    newCache.set(workout.date, [workout, ...dateWorkouts.filter((w) => w.id !== workout.id)]);
    const boundedCache = enforceCache(newCache, MAX_DATE_CACHE_ENTRIES);

    // Update PRs if any new ones
    const updatedPRs =
      newPRs.length > 0
        ? [...personalRecords.filter((pr) => !newPRs.some((np) => np.id === pr.id)), ...newPRs]
        : personalRecords;

    // Recalculate streaks (invalidate cache since workouts changed)
    invalidateStreakCache();
    const streakData = getMemoizedStreak(updatedWorkouts);

    set({
      workouts: updatedWorkouts,
      workoutsByDateCache: boundedCache,
      personalRecords: updatedPRs,
      totalWorkouts: totalWorkouts + 1,
      currentStreak: streakData.current,
      longestStreak: streakData.longest,
    });

    return newPRs;
  },

  updateWorkout: async (workout: WorkoutLog) => {
    await saveWorkout(workout);

    const { workouts, workoutsByDateCache } = get();
    const updatedWorkouts = workouts.map((w) => (w.id === workout.id ? workout : w));

    // Update date cache
    const newCache = new Map(workoutsByDateCache);
    const dateWorkouts = newCache.get(workout.date);
    if (dateWorkouts) {
      newCache.set(
        workout.date,
        dateWorkouts.map((w) => (w.id === workout.id ? workout : w))
      );
    }

    set({
      workouts: updatedWorkouts,
      workoutsByDateCache: newCache,
    });
  },

  deleteWorkout: async (workoutId: string) => {
    await deleteWorkoutFromStorage(workoutId);

    const { workouts, workoutsByDateCache, totalWorkouts } = get();
    const deletedWorkout = workouts.find((w) => w.id === workoutId);
    const updatedWorkouts = workouts.filter((w) => w.id !== workoutId);

    // Update date cache
    const newCache = new Map(workoutsByDateCache);
    if (deletedWorkout) {
      const dateWorkouts = newCache.get(deletedWorkout.date);
      if (dateWorkouts) {
        newCache.set(
          deletedWorkout.date,
          dateWorkouts.filter((w) => w.id !== workoutId)
        );
      }
    }

    // Recalculate streaks (invalidate cache since workouts changed)
    invalidateStreakCache();
    const streakData = getMemoizedStreak(updatedWorkouts);

    set({
      workouts: updatedWorkouts,
      workoutsByDateCache: newCache,
      totalWorkouts: Math.max(0, totalWorkouts - 1),
      currentStreak: streakData.current,
      longestStreak: streakData.longest,
    });
  },

  deleteMultipleWorkouts: async (workoutIds: string[]) => {
    // Delete all workouts from storage
    await Promise.all(workoutIds.map((id) => deleteWorkoutFromStorage(id)));

    const { workouts, workoutsByDateCache, totalWorkouts } = get();
    const idsSet = new Set(workoutIds);
    const deletedWorkouts = workouts.filter((w) => idsSet.has(w.id));
    const updatedWorkouts = workouts.filter((w) => !idsSet.has(w.id));

    // Update date cache
    const newCache = new Map(workoutsByDateCache);
    const affectedDates = new Set(deletedWorkouts.map((w) => w.date));
    for (const date of affectedDates) {
      const dateWorkouts = newCache.get(date);
      if (dateWorkouts) {
        newCache.set(
          date,
          dateWorkouts.filter((w) => !idsSet.has(w.id))
        );
      }
    }

    // Recalculate streaks once (invalidate cache since workouts changed)
    invalidateStreakCache();
    const streakData = getMemoizedStreak(updatedWorkouts);

    set({
      workouts: updatedWorkouts,
      workoutsByDateCache: newCache,
      totalWorkouts: Math.max(0, totalWorkouts - workoutIds.length),
      currentStreak: streakData.current,
      longestStreak: streakData.longest,
    });
  },

  invalidateCache: () => {
    set({
      lastFetched: null,
      workoutsByDateCache: new Map(),
    });
  },

  // Templates
  fetchTemplates: async () => {
    const userId = getUserId();
    if (!userId) return;
    if (get().templatesLoaded) return;

    try {
      const templates = await getTemplates(userId);
      set({ templates, templatesLoaded: true });
    } catch (error) {
      logError('Failed to fetch templates', error);
    }
  },

  addTemplate: async (template: WorkoutTemplate) => {
    await saveTemplateToStorage(template);
    const { templates } = get();
    set({ templates: [template, ...templates] });
  },

  deleteTemplate: async (templateId: string) => {
    await deleteTemplateFromStorage(templateId);
    const { templates } = get();
    set({ templates: templates.filter((t) => t.id !== templateId) });
  },

  // Personal Records
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

  // Custom Exercises
  fetchCustomExercises: async () => {
    const userId = getUserId();
    if (!userId) return;
    if (get().customExercisesLoaded) return;

    try {
      const customExercises = await getCustomExercises(userId);
      set({ customExercises, customExercisesLoaded: true });
    } catch (error) {
      logError('Failed to fetch custom exercises', error);
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
      customExercises: customExercises.map((e) => (e.id === exercise.id ? exercise : e)),
    });
  },

  deleteCustomExercise: async (exerciseId: string) => {
    await deleteCustomExerciseFromStorage(exerciseId);
    const { customExercises } = get();
    set({ customExercises: customExercises.filter((e) => e.id !== exerciseId) });
  },

  // Selectors
  getWorkoutById: (id: string) => get().workouts.find((w) => w.id === id),

  getRecentWorkouts: (limit: number) => {
    const { workouts } = get();
    // Get unique workouts by name (most recent first)
    const seen = new Set<string>();
    const unique: WorkoutLog[] = [];
    for (const w of workouts) {
      if (!seen.has(w.name) && w.completed) {
        seen.add(w.name);
        unique.push(w);
        if (unique.length >= limit) break;
      }
    }
    return unique;
  },

  getWorkoutsInRange: (start: string, end: string) =>
    get().workouts.filter((w) => w.date >= start && w.date <= end),

  getTodayWorkout: (date: string) => {
    const { workoutsByDateCache, workouts } = get();
    const cached = workoutsByDateCache.get(date);
    if (cached && cached.length > 0) {
      return cached[0];
    }
    return workouts.find((w) => w.date === date);
  },
}));
