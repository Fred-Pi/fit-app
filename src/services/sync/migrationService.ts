/**
 * Migration Service
 *
 * Handles migrating local data to the cloud when a user signs up or logs in.
 * This allows users who were using the app locally to sync their data.
 * Works on all platforms (iOS, Android, Web).
 */

import { getDatabase } from '../database';
import { syncService } from './syncService';

interface MigrationStats {
  workouts: number;
  nutrition: number;
  steps: number;
  weights: number;
  templates: number;
  personalRecords: number;
  customExercises: number;
  achievements: number;
}

class MigrationService {
  /**
   * Check if there's local data that needs to be migrated
   * Returns true if there's data without a proper user_id (old local data)
   */
  async hasLocalDataToMigrate(): Promise<boolean> {
    const db = await getDatabase();
    if (!db) return false;

    // Check for workouts with old local userId (starts with 'local_' or any other indicator)
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM workout_logs WHERE user_id LIKE 'local_%' OR user_id = '1'`
    );

    return (result?.count || 0) > 0;
  }

  /**
   * Get statistics about local data to be migrated
   */
  async getMigrationStats(): Promise<MigrationStats> {
    const db = await getDatabase();
    if (!db) {
      return {
        workouts: 0,
        nutrition: 0,
        steps: 0,
        weights: 0,
        templates: 0,
        personalRecords: 0,
        customExercises: 0,
        achievements: 0,
      };
    }

    const localUserFilter = `user_id LIKE 'local_%' OR user_id = '1'`;

    const [workouts, nutrition, steps, weights, templates, prs, exercises, achievements] =
      await Promise.all([
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM workout_logs WHERE ${localUserFilter}`
        ),
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM daily_nutrition WHERE ${localUserFilter}`
        ),
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM daily_steps WHERE ${localUserFilter}`
        ),
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM daily_weights WHERE ${localUserFilter}`
        ),
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM workout_templates WHERE ${localUserFilter}`
        ),
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM personal_records WHERE ${localUserFilter}`
        ),
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM custom_exercises WHERE ${localUserFilter}`
        ),
        db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM achievements WHERE ${localUserFilter}`
        ),
      ]);

    return {
      workouts: workouts?.count || 0,
      nutrition: nutrition?.count || 0,
      steps: steps?.count || 0,
      weights: weights?.count || 0,
      templates: templates?.count || 0,
      personalRecords: prs?.count || 0,
      customExercises: exercises?.count || 0,
      achievements: achievements?.count || 0,
    };
  }

  /**
   * Migrate all local data to a new cloud user
   * Updates all records with the new userId and queues them for sync
   */
  async migrateToCloud(newUserId: string): Promise<void> {
    const db = await getDatabase();
    if (!db) return;

    const localUserFilter = `user_id LIKE 'local_%' OR user_id = '1'`;

    await db.withTransactionAsync(async () => {
      // Migrate workout_logs
      await db.runAsync(
        `UPDATE workout_logs SET user_id = ? WHERE ${localUserFilter}`,
        [newUserId]
      );

      // Migrate daily_nutrition
      await db.runAsync(
        `UPDATE daily_nutrition SET user_id = ? WHERE ${localUserFilter}`,
        [newUserId]
      );

      // Migrate daily_steps
      await db.runAsync(
        `UPDATE daily_steps SET user_id = ? WHERE ${localUserFilter}`,
        [newUserId]
      );

      // Migrate daily_weights
      await db.runAsync(
        `UPDATE daily_weights SET user_id = ? WHERE ${localUserFilter}`,
        [newUserId]
      );

      // Migrate workout_templates
      await db.runAsync(
        `UPDATE workout_templates SET user_id = ? WHERE ${localUserFilter}`,
        [newUserId]
      );

      // Migrate personal_records
      await db.runAsync(
        `UPDATE personal_records SET user_id = ? WHERE ${localUserFilter}`,
        [newUserId]
      );

      // Migrate custom_exercises
      await db.runAsync(
        `UPDATE custom_exercises SET user_id = ? WHERE ${localUserFilter}`,
        [newUserId]
      );

      // Migrate achievements
      await db.runAsync(
        `UPDATE achievements SET user_id = ? WHERE ${localUserFilter}`,
        [newUserId]
      );
    });

    // Now queue all migrated data for sync to cloud
    await this.queueAllDataForSync(newUserId);
  }

  /**
   * Queue all local data for sync to the cloud
   */
  private async queueAllDataForSync(userId: string): Promise<void> {
    const db = await getDatabase();
    if (!db) return;

    // Queue workouts
    const workouts = await db.getAllAsync<{ id: string; date: string; name: string; duration: number | null; notes: string | null; completed: number; created: string }>(
      'SELECT * FROM workout_logs WHERE user_id = ?',
      [userId]
    );

    for (const w of workouts) {
      await syncService.queueMutation('workout_logs', w.id, 'UPSERT', {
        id: w.id,
        user_id: userId,
        date: w.date,
        name: w.name,
        duration: w.duration,
        notes: w.notes,
        completed: w.completed === 1,
        created_at: w.created,
        updated_at: new Date().toISOString(),
      });
    }

    // Queue nutrition
    const nutrition = await db.getAllAsync<{ id: string; date: string; calorie_target: number }>(
      'SELECT * FROM daily_nutrition WHERE user_id = ?',
      [userId]
    );

    for (const n of nutrition) {
      await syncService.queueMutation('daily_nutrition', n.id, 'UPSERT', {
        id: n.id,
        user_id: userId,
        date: n.date,
        calorie_target: n.calorie_target,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Queue steps
    const steps = await db.getAllAsync<{ id: string; date: string; steps: number; step_goal: number; source: string }>(
      'SELECT * FROM daily_steps WHERE user_id = ?',
      [userId]
    );

    for (const s of steps) {
      await syncService.queueMutation('daily_steps', s.id, 'UPSERT', {
        id: s.id,
        user_id: userId,
        date: s.date,
        steps: s.steps,
        step_goal: s.step_goal,
        source: s.source,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Queue weights
    const weights = await db.getAllAsync<{ id: string; date: string; weight: number; unit: string; source: string; created: string }>(
      'SELECT * FROM daily_weights WHERE user_id = ?',
      [userId]
    );

    for (const w of weights) {
      await syncService.queueMutation('daily_weights', w.id, 'UPSERT', {
        id: w.id,
        user_id: userId,
        date: w.date,
        weight: w.weight,
        unit: w.unit,
        source: w.source,
        created_at: w.created,
        updated_at: new Date().toISOString(),
      });
    }

    // Queue templates
    const templates = await db.getAllAsync<{ id: string; name: string; created: string }>(
      'SELECT * FROM workout_templates WHERE user_id = ?',
      [userId]
    );

    for (const t of templates) {
      await syncService.queueMutation('workout_templates', t.id, 'UPSERT', {
        id: t.id,
        user_id: userId,
        name: t.name,
        created_at: t.created,
      });
    }

    // Queue personal records
    const prs = await db.getAllAsync<{ id: string; exercise_name: string; weight: number; reps: number; date: string; workout_id: string | null; created: string }>(
      'SELECT * FROM personal_records WHERE user_id = ?',
      [userId]
    );

    for (const pr of prs) {
      await syncService.queueMutation('personal_records', pr.id, 'UPSERT', {
        id: pr.id,
        user_id: userId,
        exercise_name: pr.exercise_name,
        weight: pr.weight,
        reps: pr.reps,
        date: pr.date,
        workout_id: pr.workout_id,
        created_at: pr.created,
      });
    }

    // Queue custom exercises
    const exercises = await db.getAllAsync<{ id: string; name: string; category: string; default_sets: number | null; default_reps: number | null }>(
      'SELECT * FROM custom_exercises WHERE user_id = ?',
      [userId]
    );

    for (const e of exercises) {
      await syncService.queueMutation('custom_exercises', e.id, 'UPSERT', {
        id: e.id,
        user_id: userId,
        name: e.name,
        category: e.category,
        default_sets: e.default_sets,
        default_reps: e.default_reps,
        created_at: new Date().toISOString(),
      });
    }

    // Try to process the queue immediately
    await syncService.processQueue();
  }
}

// Export singleton instance
export const migrationService = new MigrationService();
