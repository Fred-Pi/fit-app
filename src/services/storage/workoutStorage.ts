/**
 * Workout storage operations
 */

import { WorkoutLog, ExerciseLog, SetLog } from '../../types';
import { getDb } from './db';
import { generateId } from './utils';
import { syncService } from '../sync';
import { logError } from '../../utils/logger';

interface WorkoutRow {
  id: string;
  user_id: string;
  date: string;
  name: string;
  duration: number | null;
  notes: string | null;
  completed: number;
  created: string;
}

interface ExerciseRow {
  id: string;
  workout_id: string;
  exercise_name: string;
  notes: string | null;
  order_index: number;
}

interface SetRow {
  exercise_log_id: string;
  reps: number;
  weight: number;
  rpe: number | null;
  completed: number;
  order_index: number;
}

/**
 * Batch load exercises and sets for multiple workouts in 2 queries instead of N+M
 * This eliminates the N+1 query problem
 */
const batchLoadWorkoutData = async (workoutIds: string[]): Promise<{
  exercisesByWorkout: Map<string, ExerciseLog[]>;
}> => {
  if (workoutIds.length === 0) {
    return { exercisesByWorkout: new Map() };
  }

  const db = await getDb();
  const placeholders = workoutIds.map(() => '?').join(',');

  // Single query for all exercises across all workouts
  const exerciseRows = await db.getAllAsync<ExerciseRow>(
    `SELECT id, workout_id, exercise_name, notes, order_index
     FROM exercise_logs
     WHERE workout_id IN (${placeholders})
     ORDER BY workout_id, order_index`,
    workoutIds
  );

  if (exerciseRows.length === 0) {
    return { exercisesByWorkout: new Map() };
  }

  const exerciseIds = exerciseRows.map(e => e.id);
  const exercisePlaceholders = exerciseIds.map(() => '?').join(',');

  // Single query for all sets across all exercises
  const setRows = await db.getAllAsync<SetRow>(
    `SELECT exercise_log_id, reps, weight, rpe, completed, order_index
     FROM set_logs
     WHERE exercise_log_id IN (${exercisePlaceholders})
     ORDER BY exercise_log_id, order_index`,
    exerciseIds
  );

  // Group sets by exercise_log_id
  const setsByExercise = new Map<string, SetLog[]>();
  for (const s of setRows) {
    const sets = setsByExercise.get(s.exercise_log_id) || [];
    sets.push({
      reps: s.reps,
      weight: s.weight,
      rpe: s.rpe || undefined,
      completed: s.completed === 1,
    });
    setsByExercise.set(s.exercise_log_id, sets);
  }

  // Group exercises by workout_id and attach sets
  const exercisesByWorkout = new Map<string, ExerciseLog[]>();
  for (const ex of exerciseRows) {
    const exercises = exercisesByWorkout.get(ex.workout_id) || [];
    exercises.push({
      id: ex.id,
      exerciseName: ex.exercise_name,
      notes: ex.notes || undefined,
      sets: setsByExercise.get(ex.id) || [],
    });
    exercisesByWorkout.set(ex.workout_id, exercises);
  }

  return { exercisesByWorkout };
};

/**
 * Convert workout rows to WorkoutLog objects with pre-loaded exercise data
 */
const rowsToWorkoutLogs = (
  rows: WorkoutRow[],
  exercisesByWorkout: Map<string, ExerciseLog[]>
): WorkoutLog[] => {
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    name: row.name,
    duration: row.duration || undefined,
    notes: row.notes || undefined,
    completed: row.completed === 1,
    created: row.created,
    exercises: exercisesByWorkout.get(row.id) || [],
  }));
};

export const getWorkouts = async (userId: string): Promise<WorkoutLog[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<WorkoutRow>(
      'SELECT * FROM workout_logs WHERE user_id = ? ORDER BY date DESC, created DESC',
      [userId]
    );

    // Batch load all exercises and sets in 2 queries instead of N+M
    const workoutIds = rows.map(r => r.id);
    const { exercisesByWorkout } = await batchLoadWorkoutData(workoutIds);

    return rowsToWorkoutLogs(rows, exercisesByWorkout);
  } catch (error) {
    logError('Error getting workouts', error);
    return [];
  }
};

export const saveWorkout = async (workout: WorkoutLog): Promise<void> => {
  try {
    const db = await getDb();

    await db.withTransactionAsync(async () => {
      // Insert/update workout
      await db.runAsync(
        `INSERT OR REPLACE INTO workout_logs (id, user_id, date, name, duration, notes, completed, created)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [workout.id, workout.userId, workout.date, workout.name, workout.duration || null, workout.notes || null, workout.completed ? 1 : 0, workout.created]
      );

      // Delete existing exercises (cascade deletes sets)
      await db.runAsync('DELETE FROM exercise_logs WHERE workout_id = ?', [workout.id]);

      // Insert exercises and sets
      for (let i = 0; i < workout.exercises.length; i++) {
        const ex = workout.exercises[i];
        await db.runAsync(
          `INSERT INTO exercise_logs (id, workout_id, exercise_name, notes, order_index)
           VALUES (?, ?, ?, ?, ?)`,
          [ex.id, workout.id, ex.exerciseName, ex.notes || null, i]
        );

        for (let j = 0; j < ex.sets.length; j++) {
          const set = ex.sets[j];
          await db.runAsync(
            `INSERT INTO set_logs (id, exercise_log_id, reps, weight, rpe, completed, order_index)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [generateId(), ex.id, set.reps, set.weight, set.rpe || null, set.completed ? 1 : 0, j]
          );
        }
      }
    });

    // Queue for cloud sync (workout_logs table, Supabase expects snake_case)
    await syncService.queueMutation('workout_logs', workout.id, 'UPSERT', {
      id: workout.id,
      user_id: workout.userId,
      date: workout.date,
      name: workout.name,
      duration: workout.duration || null,
      notes: workout.notes || null,
      completed: workout.completed,
      created_at: workout.created,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    logError('Error saving workout', error);
  }
};

export const deleteWorkout = async (workoutId: string): Promise<void> => {
  try {
    const db = await getDb();
    // Cascade delete handles exercises and sets
    await db.runAsync('DELETE FROM workout_logs WHERE id = ?', [workoutId]);

    // Queue for cloud sync
    await syncService.queueMutation('workout_logs', workoutId, 'DELETE');
  } catch (error) {
    logError('Error deleting workout', error);
  }
};

export const getWorkoutsByDate = async (date: string, userId: string): Promise<WorkoutLog[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<WorkoutRow>(
      'SELECT * FROM workout_logs WHERE date = ? AND user_id = ? ORDER BY created DESC',
      [date, userId]
    );

    const workoutIds = rows.map(r => r.id);
    const { exercisesByWorkout } = await batchLoadWorkoutData(workoutIds);

    return rowsToWorkoutLogs(rows, exercisesByWorkout);
  } catch (error) {
    logError('Error getting workouts by date', error);
    return [];
  }
};

export const getWorkoutsInRange = async (startDate: string, endDate: string, userId: string): Promise<WorkoutLog[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<WorkoutRow>(
      'SELECT * FROM workout_logs WHERE date BETWEEN ? AND ? AND user_id = ? ORDER BY date DESC',
      [startDate, endDate, userId]
    );

    const workoutIds = rows.map(r => r.id);
    const { exercisesByWorkout } = await batchLoadWorkoutData(workoutIds);

    return rowsToWorkoutLogs(rows, exercisesByWorkout);
  } catch (error) {
    logError('Error getting workouts in range', error);
    return [];
  }
};
