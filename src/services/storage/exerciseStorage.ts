/**
 * Custom exercises storage operations
 */

import { Exercise, MuscleGroup } from '../../types';
import { getDb } from './db';

export const getCustomExercises = async (): Promise<Exercise[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      category: string;
      default_sets: number | null;
      default_reps: number | null;
    }>('SELECT * FROM custom_exercises ORDER BY name');

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category as MuscleGroup,
      defaultSets: r.default_sets || undefined,
      defaultReps: r.default_reps || undefined,
    }));
  } catch (error) {
    console.error('Error getting custom exercises:', error);
    return [];
  }
};

export const saveCustomExercise = async (exercise: Exercise): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO custom_exercises (id, name, category, default_sets, default_reps)
       VALUES (?, ?, ?, ?, ?)`,
      [exercise.id, exercise.name, exercise.category, exercise.defaultSets || null, exercise.defaultReps || null]
    );
  } catch (error) {
    console.error('Error saving custom exercise:', error);
  }
};

export const updateCustomExercise = async (exercise: Exercise): Promise<void> => {
  await saveCustomExercise(exercise);
};

export const deleteCustomExercise = async (exerciseId: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM custom_exercises WHERE id = ?', [exerciseId]);
  } catch (error) {
    console.error('Error deleting custom exercise:', error);
  }
};

export const getCustomExerciseById = async (id: string): Promise<Exercise | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      id: string;
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
      name: row.name,
      category: row.category as MuscleGroup,
      defaultSets: row.default_sets || undefined,
      defaultReps: row.default_reps || undefined,
    };
  } catch (error) {
    console.error('Error getting custom exercise by id:', error);
    return null;
  }
};
