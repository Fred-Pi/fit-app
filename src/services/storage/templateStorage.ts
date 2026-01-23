/**
 * Workout template storage operations
 */

import { WorkoutTemplate, ExerciseTemplate } from '../../types';
import { getDb } from './db';

const loadTemplateExercises = async (templateId: string): Promise<ExerciseTemplate[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    exercise_name: string;
    target_sets: number;
    target_reps: number;
    target_weight: number | null;
    order_index: number;
  }>(
    'SELECT * FROM exercise_templates WHERE template_id = ? ORDER BY order_index',
    [templateId]
  );

  return rows.map(r => ({
    id: r.id,
    exerciseName: r.exercise_name,
    targetSets: r.target_sets,
    targetReps: r.target_reps,
    targetWeight: r.target_weight || undefined,
    order: r.order_index,
  }));
};

export const getTemplates = async (): Promise<WorkoutTemplate[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      name: string;
      created: string;
    }>('SELECT * FROM workout_templates ORDER BY created DESC');

    const results: WorkoutTemplate[] = [];
    for (const row of rows) {
      const exercises = await loadTemplateExercises(row.id);
      results.push({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        created: row.created,
        exercises,
      });
    }
    return results;
  } catch (error) {
    console.error('Error getting templates:', error);
    return [];
  }
};

export const saveTemplate = async (template: WorkoutTemplate): Promise<void> => {
  try {
    const db = await getDb();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT OR REPLACE INTO workout_templates (id, user_id, name, created)
         VALUES (?, ?, ?, ?)`,
        [template.id, template.userId, template.name, template.created]
      );

      // Delete existing exercises
      await db.runAsync('DELETE FROM exercise_templates WHERE template_id = ?', [template.id]);

      // Insert exercises
      for (const ex of template.exercises) {
        await db.runAsync(
          `INSERT INTO exercise_templates (id, template_id, exercise_name, target_sets, target_reps, target_weight, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [ex.id, template.id, ex.exerciseName, ex.targetSets, ex.targetReps, ex.targetWeight || null, ex.order]
        );
      }
    });
  } catch (error) {
    console.error('Error saving template:', error);
  }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM workout_templates WHERE id = ?', [templateId]);
  } catch (error) {
    console.error('Error deleting template:', error);
  }
};

export const getTemplateById = async (templateId: string): Promise<WorkoutTemplate | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      name: string;
      created: string;
    }>(
      'SELECT * FROM workout_templates WHERE id = ?',
      [templateId]
    );

    if (!row) return null;

    const exercises = await loadTemplateExercises(row.id);
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      created: row.created,
      exercises,
    };
  } catch (error) {
    console.error('Error getting template by id:', error);
    return null;
  }
};
