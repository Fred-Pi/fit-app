/**
 * User storage operations
 */

import { User } from '../../types';
import { getDb } from './db';
import { generateId } from './utils';
import { logError } from '../../utils/logger';

export const getUser = async (): Promise<User | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      id: string;
      name: string;
      email: string | null;
      age: number | null;
      height: number | null;
      height_unit: 'cm' | 'ft' | null;
      weight: number | null;
      bmi: number | null;
      daily_calorie_target: number;
      daily_step_goal: number;
      preferred_weight_unit: 'kg' | 'lbs';
      goal_weight: number | null;
      onboarding_completed: string | null;
      created: string;
    }>('SELECT * FROM users LIMIT 1');

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email || undefined,
      age: row.age || undefined,
      height: row.height || undefined,
      heightUnit: row.height_unit || undefined,
      weight: row.weight || undefined,
      bmi: row.bmi || undefined,
      dailyCalorieTarget: row.daily_calorie_target,
      dailyStepGoal: row.daily_step_goal,
      preferredWeightUnit: row.preferred_weight_unit,
      goalWeight: row.goal_weight || undefined,
      onboardingCompleted: row.onboarding_completed || undefined,
      created: row.created,
    };
  } catch (error) {
    logError('Error getting user', error);
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO users (id, name, email, age, height, height_unit, weight, bmi, daily_calorie_target, daily_step_goal, preferred_weight_unit, goal_weight, onboarding_completed, created)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.name,
        user.email || null,
        user.age || null,
        user.height || null,
        user.heightUnit || null,
        user.weight || null,
        user.bmi || null,
        user.dailyCalorieTarget,
        user.dailyStepGoal,
        user.preferredWeightUnit,
        user.goalWeight || null,
        user.onboardingCompleted || null,
        user.created,
      ]
    );
  } catch (error) {
    logError('Error saving user', error);
    throw error;
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
