/**
 * Workout storage operations
 */

import { WorkoutLog, ExerciseLog, SetLog } from '../../types';
import { getDb } from './db';
import { generateId } from './utils';

// Helper to load exercises and sets for a workout
const loadWorkoutExercises = async (workoutId: string): Promise<ExerciseLog[]> => {
  const db = await getDb();

  const exerciseRows = await db.getAllAsync<{
    id: string;
    exercise_name: string;
    notes: string | null;
    order_index: number;
  }>(
    'SELECT * FROM exercise_logs WHERE workout_id = ? ORDER BY order_index',
    [workoutId]
  );

  const exercises: ExerciseLog[] = [];

  for (const exRow of exerciseRows) {
    const setRows = await db.getAllAsync<{
      reps: number;
      weight: number;
      rpe: number | null;
      completed: number;
    }>(
      'SELECT reps, weight, rpe, completed FROM set_logs WHERE exercise_log_id = ? ORDER BY order_index',
      [exRow.id]
    );

    const sets: SetLog[] = setRows.map(s => ({
      reps: s.reps,
      weight: s.weight,
      rpe: s.rpe || undefined,
      completed: s.completed === 1,
    }));

    exercises.push({
      id: exRow.id,
      exerciseName: exRow.exercise_name,
      notes: exRow.notes || undefined,
      sets,
    });
  }

  return exercises;
};

// Helper to convert workout row to WorkoutLog
const rowToWorkoutLog = async (row: {
  id: string;
  user_id: string;
  date: string;
  name: string;
  duration: number | null;
  notes: string | null;
  completed: number;
  created: string;
}): Promise<WorkoutLog> => {
  const exercises = await loadWorkoutExercises(row.id);

  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    name: row.name,
    duration: row.duration || undefined,
    notes: row.notes || undefined,
    completed: row.completed === 1,
    created: row.created,
    exercises,
  };
};

export const getWorkouts = async (): Promise<WorkoutLog[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      name: string;
      duration: number | null;
      notes: string | null;
      completed: number;
      created: string;
    }>('SELECT * FROM workout_logs ORDER BY date DESC, created DESC');

    return Promise.all(rows.map(rowToWorkoutLog));
  } catch (error) {
    console.error('Error getting workouts:', error);
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
  } catch (error) {
    console.error('Error saving workout:', error);
  }
};

export const deleteWorkout = async (workoutId: string): Promise<void> => {
  try {
    const db = await getDb();
    // Cascade delete handles exercises and sets
    await db.runAsync('DELETE FROM workout_logs WHERE id = ?', [workoutId]);
  } catch (error) {
    console.error('Error deleting workout:', error);
  }
};

export const getWorkoutsByDate = async (date: string): Promise<WorkoutLog[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      name: string;
      duration: number | null;
      notes: string | null;
      completed: number;
      created: string;
    }>(
      'SELECT * FROM workout_logs WHERE date = ? ORDER BY created DESC',
      [date]
    );

    return Promise.all(rows.map(rowToWorkoutLog));
  } catch (error) {
    console.error('Error getting workouts by date:', error);
    return [];
  }
};

export const getWorkoutsInRange = async (startDate: string, endDate: string): Promise<WorkoutLog[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      name: string;
      duration: number | null;
      notes: string | null;
      completed: number;
      created: string;
    }>(
      'SELECT * FROM workout_logs WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );

    return Promise.all(rows.map(rowToWorkoutLog));
  } catch (error) {
    console.error('Error getting workouts in range:', error);
    return [];
  }
};
