/**
 * User storage operations
 */

import { User } from '../../types';
import { getDb } from './db';
import { generateId } from './utils';

export const getUser = async (): Promise<User | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      id: string;
      name: string;
      email: string | null;
      daily_calorie_target: number;
      daily_step_goal: number;
      preferred_weight_unit: 'kg' | 'lbs';
      goal_weight: number | null;
      created: string;
    }>('SELECT * FROM users LIMIT 1');

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email || undefined,
      dailyCalorieTarget: row.daily_calorie_target,
      dailyStepGoal: row.daily_step_goal,
      preferredWeightUnit: row.preferred_weight_unit,
      goalWeight: row.goal_weight || undefined,
      created: row.created,
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO users (id, name, email, daily_calorie_target, daily_step_goal, preferred_weight_unit, goal_weight, created)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.name, user.email || null, user.dailyCalorieTarget, user.dailyStepGoal, user.preferredWeightUnit, user.goalWeight || null, user.created]
    );
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

export const createDefaultUser = (): User => {
  return {
    id: generateId(),
    name: 'User',
    dailyCalorieTarget: 2200,
    dailyStepGoal: 10000,
    preferredWeightUnit: 'kg',
    created: new Date().toISOString(),
  };
};
