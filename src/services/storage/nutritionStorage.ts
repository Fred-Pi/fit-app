/**
 * Nutrition storage operations
 */

import { DailyNutrition, Meal } from '../../types';
import { getDb } from './db';

const loadNutritionMeals = async (nutritionId: string): Promise<Meal[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    time: string;
  }>(
    'SELECT * FROM meals WHERE nutrition_id = ? ORDER BY time',
    [nutritionId]
  );

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fats: r.fats,
    time: r.time,
  }));
};

export const getNutrition = async (): Promise<DailyNutrition[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      calorie_target: number;
    }>('SELECT * FROM daily_nutrition ORDER BY date DESC');

    const results: DailyNutrition[] = [];
    for (const row of rows) {
      const meals = await loadNutritionMeals(row.id);
      results.push({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        calorieTarget: row.calorie_target,
        meals,
      });
    }
    return results;
  } catch (error) {
    console.error('Error getting nutrition:', error);
    return [];
  }
};

export const getNutritionByDate = async (date: string): Promise<DailyNutrition | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      date: string;
      calorie_target: number;
    }>(
      'SELECT * FROM daily_nutrition WHERE date = ?',
      [date]
    );

    if (!row) return null;

    const meals = await loadNutritionMeals(row.id);
    return {
      id: row.id,
      userId: row.user_id,
      date: row.date,
      calorieTarget: row.calorie_target,
      meals,
    };
  } catch (error) {
    console.error('Error getting nutrition by date:', error);
    return null;
  }
};

export const saveNutrition = async (nutrition: DailyNutrition): Promise<void> => {
  try {
    const db = await getDb();

    await db.withTransactionAsync(async () => {
      // Insert/update nutrition record
      await db.runAsync(
        `INSERT OR REPLACE INTO daily_nutrition (id, user_id, date, calorie_target)
         VALUES (?, ?, ?, ?)`,
        [nutrition.id, nutrition.userId, nutrition.date, nutrition.calorieTarget]
      );

      // Delete existing meals
      await db.runAsync('DELETE FROM meals WHERE nutrition_id = ?', [nutrition.id]);

      // Insert meals
      for (const meal of nutrition.meals) {
        await db.runAsync(
          `INSERT INTO meals (id, nutrition_id, name, calories, protein, carbs, fats, time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [meal.id, nutrition.id, meal.name, meal.calories, meal.protein, meal.carbs, meal.fats, meal.time]
        );
      }
    });
  } catch (error) {
    console.error('Error saving nutrition:', error);
  }
};

export const getNutritionInRange = async (startDate: string, endDate: string): Promise<DailyNutrition[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      calorie_target: number;
    }>(
      'SELECT * FROM daily_nutrition WHERE date BETWEEN ? AND ? ORDER BY date',
      [startDate, endDate]
    );

    const results: DailyNutrition[] = [];
    for (const row of rows) {
      const meals = await loadNutritionMeals(row.id);
      results.push({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        calorieTarget: row.calorie_target,
        meals,
      });
    }
    return results;
  } catch (error) {
    console.error('Error getting nutrition in range:', error);
    return [];
  }
};
