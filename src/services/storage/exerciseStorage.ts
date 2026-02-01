/**
 * Custom exercises storage operations
 */

import { Exercise, MuscleGroup } from '../../types';
import { getDb } from './db';
import { syncService } from '../sync';
import { logError } from '../../utils/logger';

export const getCustomExercises = async (userId: string): Promise<Exercise[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      name: string;
      category: string;
      default_sets: number | null;
      default_reps: number | null;
    }>('SELECT * FROM custom_exercises WHERE user_id = ? ORDER BY name', [userId]);

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      category: r.category as MuscleGroup,
      defaultSets: r.default_sets || undefined,
      defaultReps: r.default_reps || undefined,
    }));
  } catch (error) {
    logError('Error getting custom exercises', error);
    return [];
  }
};

export const saveCustomExercise = async (exercise: Exercise): Promise<void> => {
  if (!exercise.userId) {
    logError('Cannot save custom exercise without userId');
    return;
  }

  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO custom_exercises (id, user_id, name, category, default_sets, default_reps)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exercise.id, exercise.userId, exercise.name, exercise.category, exercise.defaultSets || null, exercise.defaultReps || null]
    );

    // Queue for cloud sync
    await syncService.queueMutation('custom_exercises', exercise.id, 'UPSERT', {
      id: exercise.id,
      user_id: exercise.userId,
      name: exercise.name,
      category: exercise.category,
      default_sets: exercise.defaultSets || null,
      default_reps: exercise.defaultReps || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logError('Error saving custom exercise', error);
  }
};

export const updateCustomExercise = async (exercise: Exercise): Promise<void> => {
  await saveCustomExercise(exercise);
};

export const deleteCustomExercise = async (exerciseId: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM custom_exercises WHERE id = ?', [exerciseId]);

    // Queue for cloud sync
    await syncService.queueMutation('custom_exercises', exerciseId, 'DELETE');
  } catch (error) {
    logError('Error deleting custom exercise', error);
  }
};

export const getCustomExerciseById = async (id: string): Promise<Exercise | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      name: string;
      category: string;
      default_sets: number | null;
      default_reps: number | null;
    }>(
      'SELECT * FROM custom_exercises WHERE id = ?',
      [id]
    );

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      category: row.category as MuscleGroup,
      defaultSets: row.default_sets || undefined,
      defaultReps: row.default_reps || undefined,
    };
  } catch (error) {
    logError('Error getting custom exercise by id', error);
    return null;
  }
};
