/**
 * Personal Records storage operations
 */

import { PersonalRecord, WorkoutLog } from '../../types';
import { getDb } from './db';
import { generateId } from './utils';
import { syncService } from '../sync';

export const getPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      exercise_name: string;
      weight: number;
      reps: number;
      date: string;
      workout_id: string | null;
      created: string;
    }>(
      'SELECT * FROM personal_records WHERE user_id = ? ORDER BY weight DESC',
      [userId]
    );

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      exerciseName: r.exercise_name,
      weight: r.weight,
      reps: r.reps,
      date: r.date,
      workoutId: r.workout_id || '',
      created: r.created,
    }));
  } catch (error) {
    console.error('Error getting personal records:', error);
    return [];
  }
};

export const savePersonalRecord = async (pr: PersonalRecord): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO personal_records (id, user_id, exercise_name, weight, reps, date, workout_id, created)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pr.id, pr.userId, pr.exerciseName, pr.weight, pr.reps, pr.date, pr.workoutId || null, pr.created]
    );

    // Queue for cloud sync
    await syncService.queueMutation('personal_records', pr.id, 'UPSERT', {
      id: pr.id,
      user_id: pr.userId,
      exercise_name: pr.exerciseName,
      weight: pr.weight,
      reps: pr.reps,
      date: pr.date,
      workout_id: pr.workoutId || null,
      created_at: pr.created,
    });
  } catch (error) {
    console.error('Error saving personal record:', error);
  }
};

export const deletePersonalRecord = async (prId: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM personal_records WHERE id = ?', [prId]);

    // Queue for cloud sync
    await syncService.queueMutation('personal_records', prId, 'DELETE');
  } catch (error) {
    console.error('Error deleting personal record:', error);
  }
};

export const getPersonalRecordByExercise = async (exerciseName: string, userId: string): Promise<PersonalRecord | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      exercise_name: string;
      weight: number;
      reps: number;
      date: string;
      workout_id: string | null;
      created: string;
    }>(
      'SELECT * FROM personal_records WHERE LOWER(exercise_name) = LOWER(?) AND user_id = ?',
      [exerciseName, userId]
    );

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      exerciseName: row.exercise_name,
      weight: row.weight,
      reps: row.reps,
      date: row.date,
      workoutId: row.workout_id || '',
      created: row.created,
    };
  } catch (error) {
    console.error('Error getting PR by exercise:', error);
    return null;
  }
};

export const checkAndUpdatePRs = async (workout: WorkoutLog): Promise<PersonalRecord[]> => {
  const newPRs: PersonalRecord[] = [];
  const existingPRs = await getPersonalRecords(workout.userId);

  for (const exercise of workout.exercises) {
    let bestSet = exercise.sets[0];
    for (const set of exercise.sets) {
      if (set.weight > bestSet.weight ||
          (set.weight === bestSet.weight && set.reps > bestSet.reps)) {
        bestSet = set;
      }
    }

    const existingPR = existingPRs.find(
      pr => pr.exerciseName.toLowerCase() === exercise.exerciseName.toLowerCase()
    );

    const isNewPR = !existingPR ||
                     bestSet.weight > existingPR.weight ||
                     (bestSet.weight === existingPR.weight && bestSet.reps > existingPR.reps);

    if (isNewPR && bestSet.weight > 0) {
      const newPR: PersonalRecord = {
        id: existingPR?.id || generateId(),
        userId: workout.userId,
        exerciseName: exercise.exerciseName,
        weight: bestSet.weight,
        reps: bestSet.reps,
        date: workout.date,
        workoutId: workout.id,
        created: new Date().toISOString(),
      };

      await savePersonalRecord(newPR);
      newPRs.push(newPR);
    }
  }

  return newPRs;
};

export const getLastExercisePerformance = async (
  exerciseName: string,
  userId: string,
  excludeWorkoutId?: string
): Promise<{
  date: string;
  sets: number;
  reps: number;
  weight: number;
  workoutName: string;
} | null> => {
  try {
    const db = await getDb();

    // Use SQL to find the most recent workout with this exercise
    const query = excludeWorkoutId
      ? `SELECT w.id, w.date, w.name as workout_name
         FROM workout_logs w
         JOIN exercise_logs e ON e.workout_id = w.id
         WHERE w.user_id = ? AND LOWER(e.exercise_name) = LOWER(?) AND w.id != ?
         ORDER BY w.date DESC
         LIMIT 1`
      : `SELECT w.id, w.date, w.name as workout_name
         FROM workout_logs w
         JOIN exercise_logs e ON e.workout_id = w.id
         WHERE w.user_id = ? AND LOWER(e.exercise_name) = LOWER(?)
         ORDER BY w.date DESC
         LIMIT 1`;

    const params = excludeWorkoutId
      ? [userId, exerciseName, excludeWorkoutId]
      : [userId, exerciseName];

    const workoutRow = await db.getFirstAsync<{
      id: string;
      date: string;
      workout_name: string;
    }>(query, params);

    if (!workoutRow) return null;

    // Get the exercise and its sets
    const exerciseRow = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM exercise_logs WHERE workout_id = ? AND LOWER(exercise_name) = LOWER(?)',
      [workoutRow.id, exerciseName]
    );

    if (!exerciseRow) return null;

    const setRows = await db.getAllAsync<{ reps: number; weight: number }>(
      'SELECT reps, weight FROM set_logs WHERE exercise_log_id = ? ORDER BY order_index LIMIT 1',
      [exerciseRow.id]
    );

    const setCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM set_logs WHERE exercise_log_id = ?',
      [exerciseRow.id]
    );

    if (setRows.length === 0) return null;

    return {
      date: workoutRow.date,
      sets: setCount?.count || 0,
      reps: setRows[0].reps,
      weight: setRows[0].weight,
      workoutName: workoutRow.workout_name,
    };
  } catch (error) {
    console.error('Error getting last exercise performance:', error);
    return null;
  }
};
