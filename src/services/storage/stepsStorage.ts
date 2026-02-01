/**
 * Steps storage operations
 */

import { DailySteps } from '../../types';
import { getDb } from './db';
import { syncService } from '../sync';
import { logError } from '../../utils/logger';

export const getSteps = async (userId: string): Promise<DailySteps[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      steps: number;
      step_goal: number;
      source: string;
    }>(
      'SELECT * FROM daily_steps WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      date: r.date,
      steps: r.steps,
      stepGoal: r.step_goal,
      source: r.source as 'manual' | 'apple_health' | 'google_fit',
    }));
  } catch (error) {
    logError('Error getting steps', error);
    return [];
  }
};

export const getStepsByDate = async (date: string, userId: string): Promise<DailySteps | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      date: string;
      steps: number;
      step_goal: number;
      source: string;
    }>(
      'SELECT * FROM daily_steps WHERE date = ? AND user_id = ?',
      [date, userId]
    );

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      date: row.date,
      steps: row.steps,
      stepGoal: row.step_goal,
      source: row.source as 'manual' | 'apple_health' | 'google_fit',
    };
  } catch (error) {
    logError('Error getting steps by date', error);
    return null;
  }
};

export const saveSteps = async (steps: DailySteps): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO daily_steps (id, user_id, date, steps, step_goal, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [steps.id, steps.userId, steps.date, steps.steps, steps.stepGoal, steps.source]
    );

    // Queue for cloud sync
    await syncService.queueMutation('daily_steps', steps.id, 'UPSERT', {
      id: steps.id,
      user_id: steps.userId,
      date: steps.date,
      steps: steps.steps,
      step_goal: steps.stepGoal,
      source: steps.source,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    logError('Error saving steps', error);
  }
};

export const getStepsInRange = async (startDate: string, endDate: string, userId: string): Promise<DailySteps[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      steps: number;
      step_goal: number;
      source: string;
    }>(
      'SELECT * FROM daily_steps WHERE date BETWEEN ? AND ? AND user_id = ? ORDER BY date',
      [startDate, endDate, userId]
    );

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      date: r.date,
      steps: r.steps,
      stepGoal: r.step_goal,
      source: r.source as 'manual' | 'apple_health' | 'google_fit',
    }));
  } catch (error) {
    logError('Error getting steps in range', error);
    return [];
  }
};
