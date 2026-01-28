/**
 * Achievement storage operations
 */

import { Achievement, MuscleGroup } from '../../types';
import { getDb } from './db';
import { isDateInRange } from './utils';
import { getWeekDates } from '../../utils/dateUtils';
import { achievementDefinitions } from '../../data/achievements';
import { calculateWorkoutStreak } from '../../utils/analyticsCalculations';
import { getWorkouts } from './workoutStorage';
import { getPersonalRecords } from './prStorage';
import { getSteps } from './stepsStorage';
import { getNutrition } from './nutritionStorage';
import { getCustomExercises } from './exerciseStorage';

export const getAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      title: string;
      description: string;
      icon: string;
      category: string;
      target_value: number;
      current_value: number;
      is_unlocked: number;
      unlocked_date: string | null;
    }>('SELECT * FROM achievements WHERE user_id = ?', [userId]);

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      description: r.description,
      icon: r.icon,
      category: r.category as Achievement['category'],
      targetValue: r.target_value,
      currentValue: r.current_value,
      isUnlocked: r.is_unlocked === 1,
      unlockedDate: r.unlocked_date || undefined,
    }));
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
};

export const saveAchievements = async (achievements: Achievement[]): Promise<void> => {
  try {
    const db = await getDb();

    await db.withTransactionAsync(async () => {
      for (const a of achievements) {
        await db.runAsync(
          `INSERT OR REPLACE INTO achievements (id, user_id, title, description, icon, category, target_value, current_value, is_unlocked, unlocked_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [a.id, a.userId, a.title, a.description, a.icon, a.category, a.targetValue, a.currentValue, a.isUnlocked ? 1 : 0, a.unlockedDate || null]
        );
      }
    });
  } catch (error) {
    console.error('Error saving achievements:', error);
  }
};

export const initializeAchievements = async (userId: string): Promise<Achievement[]> => {
  const existing = await getAchievements(userId);
  if (existing.length > 0) {
    return existing;
  }

  const achievements: Achievement[] = achievementDefinitions.map(def => ({
    ...def,
    userId,
    currentValue: 0,
    isUnlocked: false,
  }));

  await saveAchievements(achievements);
  return achievements;
};

export const checkAndUpdateAchievements = async (userId: string): Promise<Achievement[]> => {
  const achievements = await initializeAchievements(userId);
  const newlyUnlocked: Achievement[] = [];

  const workouts = await getWorkouts(userId);
  const prs = await getPersonalRecords(userId);
  const steps = await getSteps(userId);
  const nutrition = await getNutrition(userId);

  const totalWorkouts = workouts.filter(w => w.completed).length;
  const streak = calculateWorkoutStreak(workouts);
  const totalPRs = prs.length;

  const daysStepGoalMet = steps.filter(s => s.steps >= s.stepGoal).length;
  const daysNutritionLogged = nutrition.filter(n => n.meals.length > 0).length;

  const { start: weekStart, end: weekEnd } = getWeekDates(new Date());
  const weekWorkouts = workouts.filter(w => isDateInRange(w.date, weekStart, weekEnd));
  const muscleGroupsTrained = new Set<MuscleGroup>();

  const { EXERCISE_DATABASE } = await import('../../data/exercises');
  const customExercises = await getCustomExercises(userId);
  const allExercises = [...EXERCISE_DATABASE, ...customExercises];

  weekWorkouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const exerciseInfo = allExercises.find(
        e => e.name.toLowerCase() === ex.exerciseName.toLowerCase()
      );
      if (exerciseInfo) {
        muscleGroupsTrained.add(exerciseInfo.category);
      }
    });
  });

  for (const achievement of achievements) {
    if (achievement.isUnlocked) continue;

    let newValue = 0;

    switch (achievement.id) {
      case 'first_workout':
      case 'dedicated_10':
      case 'warrior_50':
        newValue = totalWorkouts;
        break;
      case 'streak_7':
      case 'streak_30':
        newValue = streak.longest;
        break;
      case 'pr_5':
      case 'pr_25':
        newValue = totalPRs;
        break;
      case 'steps_7_days':
        newValue = daysStepGoalMet;
        break;
      case 'nutrition_7_days':
        newValue = daysNutritionLogged;
        break;
      case 'well_rounded':
        newValue = muscleGroupsTrained.size;
        break;
    }

    achievement.currentValue = newValue;

    if (newValue >= achievement.targetValue && !achievement.isUnlocked) {
      achievement.isUnlocked = true;
      achievement.unlockedDate = new Date().toISOString();
      newlyUnlocked.push(achievement);
    }
  }

  await saveAchievements(achievements);
  return newlyUnlocked;
};
