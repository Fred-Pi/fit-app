/**
 * Active Workout Store - Zustand
 *
 * Manages the state for an in-progress workout session.
 * Separate from workoutStore which handles saved workouts.
 * Includes auto-start workout timer and auto-trigger rest timer.
 */

import { create } from 'zustand';
import { WorkoutLog, ExerciseLog, WorkoutTemplate } from '../types';
import { generateId, getLastExercisePerformance } from '../services/storage';
import { useAuthStore } from './authStore';

// Helper to get current userId from auth store
const getUserId = (): string => {
  const { user } = useAuthStore.getState();
  return user?.id ?? 'local-user';
};

// Types for active workout (extended with UI state)
export interface ActiveSetLog {
  id: string;
  reps: number;
  weight: number;
  rpe?: number;
  completed: boolean;
  completedAt?: number; // Unix timestamp
}

export interface ActiveExerciseLog {
  id: string;
  exerciseName: string;
  sets: ActiveSetLog[];
  notes?: string;
  isCollapsed: boolean;
}

export interface ExerciseHistoryData {
  date: string;
  sets: number;
  reps: number;
  weight: number;
  workoutName: string;
}

interface ActiveWorkoutState {
  // Core workout data
  workoutId: string | null;
  workoutName: string;
  exercises: ActiveExerciseLog[];
  workoutNotes: string;

  // Workout timer
  startTime: number | null;
  pausedAt: number | null;
  accumulatedSeconds: number;
  isWorkoutTimerRunning: boolean;

  // Rest timer
  restTimerEndTime: number | null;
  restTimerDuration: number; // Default rest duration in seconds
  isRestTimerRunning: boolean;

  // Session state
  hasActiveWorkout: boolean;
  templateUsed: WorkoutTemplate | null;

  // Exercise history cache
  exerciseHistoryCache: Map<string, ExerciseHistoryData | null>;

  // Actions - Workout lifecycle
  startWorkout: (template?: WorkoutTemplate | null) => void;
  startFromRecent: (workout: WorkoutLog) => void;
  discardWorkout: () => void;
  finishWorkout: () => WorkoutLog;

  // Actions - Workout details
  setWorkoutName: (name: string) => void;
  setWorkoutNotes: (notes: string) => void;

  // Actions - Exercise management
  addExercise: (exerciseName: string, defaults?: { sets: number; reps: number; weight?: number }) => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (exercises: ActiveExerciseLog[]) => void;
  toggleExerciseCollapse: (exerciseId: string) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;

  // Actions - Set management
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, data: Partial<ActiveSetLog>) => void;
  completeSet: (exerciseId: string, setId: string) => void;

  // Actions - Workout timer
  pauseWorkoutTimer: () => void;
  resumeWorkoutTimer: () => void;

  // Actions - Rest timer
  startRestTimer: (duration?: number) => void;
  stopRestTimer: () => void;
  setDefaultRestDuration: (seconds: number) => void;

  // Selectors
  getTotalSets: () => number;
  getCompletedSets: () => number;
  getWorkoutDuration: () => number; // Returns seconds
  getExerciseHistory: (exerciseName: string) => Promise<ExerciseHistoryData | null>;
  isExerciseComplete: (exerciseId: string) => boolean;
}

const DEFAULT_REST_DURATION = 90; // 90 seconds default
const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;

const createEmptyState = () => ({
  workoutId: null,
  workoutName: '',
  exercises: [],
  workoutNotes: '',
  startTime: null,
  pausedAt: null,
  accumulatedSeconds: 0,
  isWorkoutTimerRunning: false,
  restTimerEndTime: null,
  restTimerDuration: DEFAULT_REST_DURATION,
  isRestTimerRunning: false,
  hasActiveWorkout: false,
  templateUsed: null,
  exerciseHistoryCache: new Map(),
});

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
  ...createEmptyState(),

  // Start a fresh workout or from template
  startWorkout: (template?: WorkoutTemplate | null) => {
    const workoutId = generateId();
    const now = Date.now();

    let exercises: ActiveExerciseLog[] = [];
    let workoutName = '';

    if (template) {
      workoutName = template.name;
      exercises = template.exercises.map((exerciseTemplate) => ({
        id: generateId(),
        exerciseName: exerciseTemplate.exerciseName,
        sets: Array.from({ length: exerciseTemplate.targetSets }, () => ({
          id: generateId(),
          reps: exerciseTemplate.targetReps,
          weight: exerciseTemplate.targetWeight || 0,
          completed: false,
        })),
        notes: undefined,
        isCollapsed: false,
      }));
    }

    set({
      workoutId,
      workoutName,
      exercises,
      workoutNotes: '',
      startTime: now,
      pausedAt: null,
      accumulatedSeconds: 0,
      isWorkoutTimerRunning: true,
      restTimerEndTime: null,
      isRestTimerRunning: false,
      hasActiveWorkout: true,
      templateUsed: template || null,
      exerciseHistoryCache: new Map(),
    });
  },

  // Start from a recent workout (clone it)
  startFromRecent: (workout: WorkoutLog) => {
    const workoutId = generateId();
    const now = Date.now();

    const exercises: ActiveExerciseLog[] = workout.exercises.map((exercise) => ({
      id: generateId(),
      exerciseName: exercise.exerciseName,
      sets: exercise.sets.map((s) => ({
        id: generateId(),
        reps: s.reps,
        weight: s.weight,
        rpe: s.rpe,
        completed: false,
      })),
      notes: exercise.notes,
      isCollapsed: false,
    }));

    set({
      workoutId,
      workoutName: workout.name,
      exercises,
      workoutNotes: workout.notes || '',
      startTime: now,
      pausedAt: null,
      accumulatedSeconds: 0,
      isWorkoutTimerRunning: true,
      restTimerEndTime: null,
      isRestTimerRunning: false,
      hasActiveWorkout: true,
      templateUsed: null,
      exerciseHistoryCache: new Map(),
    });
  },

  // Discard the current workout
  discardWorkout: () => {
    set(createEmptyState());
  },

  // Finish workout and return the final WorkoutLog for saving
  finishWorkout: () => {
    const {
      workoutId,
      workoutName,
      exercises,
      workoutNotes,
      startTime,
      pausedAt,
      accumulatedSeconds,
      isWorkoutTimerRunning,
    } = get();

    // Calculate final duration
    let totalSeconds = accumulatedSeconds;
    if (isWorkoutTimerRunning && startTime && !pausedAt) {
      totalSeconds += Math.floor((Date.now() - startTime) / 1000);
    }

    const userId = getUserId();
    const today = new Date().toISOString().split('T')[0];

    // Convert to WorkoutLog format
    const exerciseLogs: ExerciseLog[] = exercises.map((exercise) => ({
      id: exercise.id,
      exerciseName: exercise.exerciseName,
      sets: exercise.sets.map((s) => ({
        reps: s.reps,
        weight: s.weight,
        rpe: s.rpe,
        completed: s.completed,
      })),
      notes: exercise.notes,
    }));

    const workoutLog: WorkoutLog = {
      id: workoutId || generateId(),
      userId,
      date: today,
      name: workoutName || `Workout - ${today}`,
      duration: totalSeconds > 0 ? Math.round(totalSeconds / 60 * 10) / 10 : undefined,
      exercises: exerciseLogs,
      notes: workoutNotes || undefined,
      completed: true,
      created: new Date().toISOString(),
    };

    // Reset state
    set(createEmptyState());

    return workoutLog;
  },

  // Workout details
  setWorkoutName: (name: string) => set({ workoutName: name }),
  setWorkoutNotes: (notes: string) => set({ workoutNotes: notes }),

  // Exercise management
  addExercise: (exerciseName: string, defaults?: { sets: number; reps: number; weight?: number }) => {
    const numSets = defaults?.sets || DEFAULT_SETS;
    const numReps = defaults?.reps || DEFAULT_REPS;
    const weight = defaults?.weight || 0;

    const newExercise: ActiveExerciseLog = {
      id: generateId(),
      exerciseName,
      sets: Array.from({ length: numSets }, () => ({
        id: generateId(),
        reps: numReps,
        weight,
        completed: false,
      })),
      notes: undefined,
      isCollapsed: false,
    };

    set((state) => ({
      exercises: [...state.exercises, newExercise],
    }));
  },

  removeExercise: (exerciseId: string) => {
    set((state) => ({
      exercises: state.exercises.filter((e) => e.id !== exerciseId),
    }));
  },

  reorderExercises: (exercises: ActiveExerciseLog[]) => {
    set({ exercises });
  },

  toggleExerciseCollapse: (exerciseId: string) => {
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.id === exerciseId ? { ...e, isCollapsed: !e.isCollapsed } : e
      ),
    }));
  },

  updateExerciseNotes: (exerciseId: string, notes: string) => {
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.id === exerciseId ? { ...e, notes: notes || undefined } : e
      ),
    }));
  },

  // Set management
  addSet: (exerciseId: string) => {
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;

        // Clone the last set's values or use defaults
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet: ActiveSetLog = {
          id: generateId(),
          reps: lastSet?.reps || DEFAULT_REPS,
          weight: lastSet?.weight || 0,
          completed: false,
        };

        return {
          ...exercise,
          sets: [...exercise.sets, newSet],
          isCollapsed: false, // Expand if adding a set
        };
      }),
    }));
  },

  removeSet: (exerciseId: string, setId: string) => {
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.filter((s) => s.id !== setId),
        };
      }),
    }));
  },

  updateSet: (exerciseId: string, setId: string, data: Partial<ActiveSetLog>) => {
    set((state) => ({
      exercises: state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((s) =>
            s.id === setId ? { ...s, ...data } : s
          ),
        };
      }),
    }));
  },

  completeSet: (exerciseId: string, setId: string) => {
    const { restTimerDuration } = get();
    const now = Date.now();

    set((state) => {
      const updatedExercises = state.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;

        const updatedSets = exercise.sets.map((s) =>
          s.id === setId
            ? { ...s, completed: true, completedAt: now }
            : s
        );

        // Check if all sets are complete
        const allComplete = updatedSets.every((s) => s.completed);

        return {
          ...exercise,
          sets: updatedSets,
          isCollapsed: allComplete,
        };
      });

      return {
        exercises: updatedExercises,
        // Auto-start rest timer
        restTimerEndTime: now + restTimerDuration * 1000,
        isRestTimerRunning: true,
      };
    });
  },

  // Workout timer
  pauseWorkoutTimer: () => {
    const { startTime, accumulatedSeconds, isWorkoutTimerRunning } = get();

    if (isWorkoutTimerRunning && startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      set({
        accumulatedSeconds: accumulatedSeconds + elapsed,
        pausedAt: Date.now(),
        startTime: null,
        isWorkoutTimerRunning: false,
      });
    }
  },

  resumeWorkoutTimer: () => {
    set({
      startTime: Date.now(),
      pausedAt: null,
      isWorkoutTimerRunning: true,
    });
  },

  // Rest timer
  startRestTimer: (duration?: number) => {
    const { restTimerDuration } = get();
    const durationToUse = duration || restTimerDuration;

    set({
      restTimerEndTime: Date.now() + durationToUse * 1000,
      isRestTimerRunning: true,
    });
  },

  stopRestTimer: () => {
    set({
      restTimerEndTime: null,
      isRestTimerRunning: false,
    });
  },

  setDefaultRestDuration: (seconds: number) => {
    set({ restTimerDuration: seconds });
  },

  // Selectors
  getTotalSets: () => {
    const { exercises } = get();
    return exercises.reduce((total, e) => total + e.sets.length, 0);
  },

  getCompletedSets: () => {
    const { exercises } = get();
    return exercises.reduce(
      (total, e) => total + e.sets.filter((s) => s.completed).length,
      0
    );
  },

  getWorkoutDuration: () => {
    const { startTime, accumulatedSeconds, isWorkoutTimerRunning } = get();

    let totalSeconds = accumulatedSeconds;
    if (isWorkoutTimerRunning && startTime) {
      totalSeconds += Math.floor((Date.now() - startTime) / 1000);
    }

    return totalSeconds;
  },

  getExerciseHistory: async (exerciseName: string) => {
    const { exerciseHistoryCache } = get();

    // Check cache first
    if (exerciseHistoryCache.has(exerciseName)) {
      return exerciseHistoryCache.get(exerciseName) || null;
    }

    // Fetch from storage
    const userId = getUserId();
    const history = await getLastExercisePerformance(exerciseName, userId);

    // Update cache
    set((state) => {
      const newCache = new Map(state.exerciseHistoryCache);
      newCache.set(exerciseName, history);
      return { exerciseHistoryCache: newCache };
    });

    return history;
  },

  isExerciseComplete: (exerciseId: string) => {
    const { exercises } = get();
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return false;
    return exercise.sets.length > 0 && exercise.sets.every((s) => s.completed);
  },
}));
