/**
 * Food preset storage operations
 */

import { FoodPreset } from '../../types';
import { getDb } from './db';
import { generateId } from './utils';
import { syncService } from '../sync';

interface PresetRow {
  id: string;
  user_id: string;
  name: string;
  serving_size: number;
  serving_unit: 'g' | 'ml' | 'piece';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  created_at: string;
  last_used_at: string | null;
}

const rowToPreset = (row: PresetRow): FoodPreset => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  servingSize: row.serving_size,
  servingUnit: row.serving_unit,
  calories: row.calories,
  protein: row.protein,
  carbs: row.carbs,
  fats: row.fats,
  createdAt: row.created_at,
  lastUsedAt: row.last_used_at,
});

export const getPresets = async (userId: string): Promise<FoodPreset[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<PresetRow>(
      'SELECT * FROM food_presets WHERE user_id = ? ORDER BY name',
      [userId]
    );
    return rows.map(rowToPreset);
  } catch (error) {
    console.error('Error getting presets:', error);
    return [];
  }
};

export const getPresetById = async (id: string): Promise<FoodPreset | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<PresetRow>(
      'SELECT * FROM food_presets WHERE id = ?',
      [id]
    );
    return row ? rowToPreset(row) : null;
  } catch (error) {
    console.error('Error getting preset by id:', error);
    return null;
  }
};

export const savePreset = async (preset: FoodPreset): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO food_presets
       (id, user_id, name, serving_size, serving_unit, calories, protein, carbs, fats, created_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        preset.id,
        preset.userId,
        preset.name,
        preset.servingSize,
        preset.servingUnit,
        preset.calories,
        preset.protein,
        preset.carbs,
        preset.fats,
        preset.createdAt,
        preset.lastUsedAt,
      ]
    );

    await syncService.queueMutation('food_presets', preset.id, 'UPSERT', {
      id: preset.id,
      user_id: preset.userId,
      name: preset.name,
      serving_size: preset.servingSize,
      serving_unit: preset.servingUnit,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fats: preset.fats,
      created_at: preset.createdAt,
      last_used_at: preset.lastUsedAt,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving preset:', error);
    throw error;
  }
};

export const deletePreset = async (id: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM food_presets WHERE id = ?', [id]);

    await syncService.queueMutation('food_presets', id, 'DELETE');
  } catch (error) {
    console.error('Error deleting preset:', error);
    throw error;
  }
};

export const updatePresetLastUsed = async (id: string): Promise<void> => {
  try {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE food_presets SET last_used_at = ? WHERE id = ?',
      [now, id]
    );
  } catch (error) {
    console.error('Error updating preset last used:', error);
  }
};

export const getRecentPresets = async (userId: string, limit: number = 5): Promise<FoodPreset[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<PresetRow>(
      `SELECT * FROM food_presets
       WHERE user_id = ? AND last_used_at IS NOT NULL
       ORDER BY last_used_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows.map(rowToPreset);
  } catch (error) {
    console.error('Error getting recent presets:', error);
    return [];
  }
};

export const createPreset = (
  userId: string,
  data: Omit<FoodPreset, 'id' | 'userId' | 'createdAt' | 'lastUsedAt'>
): FoodPreset => ({
  id: generateId(),
  userId,
  ...data,
  createdAt: new Date().toISOString(),
  lastUsedAt: null,
});
