/**
 * Body weight storage operations
 */

import { DailyWeight } from '../../types';
import { getDb } from './db';

export const getWeights = async (userId: string): Promise<DailyWeight[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      weight: number;
      unit: string;
      source: string;
      created: string;
    }>(
      'SELECT * FROM daily_weights WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      date: r.date,
      weight: r.weight,
      unit: r.unit as 'kg' | 'lbs',
      source: r.source as 'manual' | 'smart_scale',
      created: r.created,
    }));
  } catch (error) {
    console.error('Error getting weights:', error);
    return [];
  }
};

export const getWeightByDate = async (date: string, userId: string): Promise<DailyWeight | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      date: string;
      weight: number;
      unit: string;
      source: string;
      created: string;
    }>(
      'SELECT * FROM daily_weights WHERE date = ? AND user_id = ?',
      [date, userId]
    );

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      date: row.date,
      weight: row.weight,
      unit: row.unit as 'kg' | 'lbs',
      source: row.source as 'manual' | 'smart_scale',
      created: row.created,
    };
  } catch (error) {
    console.error('Error getting weight by date:', error);
    return null;
  }
};

export const saveWeight = async (weight: DailyWeight): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO daily_weights (id, user_id, date, weight, unit, source, created)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [weight.id, weight.userId, weight.date, weight.weight, weight.unit, weight.source, weight.created]
    );
  } catch (error) {
    console.error('Error saving weight:', error);
  }
};

export const deleteWeight = async (weightId: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM daily_weights WHERE id = ?', [weightId]);
  } catch (error) {
    console.error('Error deleting weight:', error);
  }
};

export const getWeightsInRange = async (startDate: string, endDate: string, userId: string): Promise<DailyWeight[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      weight: number;
      unit: string;
      source: string;
      created: string;
    }>(
      'SELECT * FROM daily_weights WHERE date BETWEEN ? AND ? AND user_id = ? ORDER BY date ASC',
      [startDate, endDate, userId]
    );

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      date: r.date,
      weight: r.weight,
      unit: r.unit as 'kg' | 'lbs',
      source: r.source as 'manual' | 'smart_scale',
      created: r.created,
    }));
  } catch (error) {
    console.error('Error getting weights in range:', error);
    return [];
  }
};
