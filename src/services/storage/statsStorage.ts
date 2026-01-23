/**
 * Weekly stats storage operations
 */

import { User, WeeklyStats } from '../../types';
import { getWorkoutsInRange } from './workoutStorage';
import { getNutritionInRange } from './nutritionStorage';
import { getStepsInRange } from './stepsStorage';

export const calculateWeeklyStats = async (
  weekStart: string,
  weekEnd: string,
  user: User
): Promise<WeeklyStats> => {
  const workouts = await getWorkoutsInRange(weekStart, weekEnd);
  const nutrition = await getNutritionInRange(weekStart, weekEnd);
  const steps = await getStepsInRange(weekStart, weekEnd);

  const totalWorkouts = workouts.filter(w => w.completed).length;
  const uniqueWorkoutDates = new Set(workouts.map(w => w.date));
  const daysActive = uniqueWorkoutDates.size;

  const totalCalories = nutrition.reduce((sum, n) => {
    const dailyTotal = n.meals.reduce((mealSum, meal) => mealSum + meal.calories, 0);
    return sum + dailyTotal;
  }, 0);
  const avgCalories = nutrition.length > 0 ? Math.round(totalCalories / nutrition.length) : 0;
  const calorieTarget = user.dailyCalorieTarget * 7;

  const totalSteps = steps.reduce((sum, s) => sum + s.steps, 0);
  const avgSteps = steps.length > 0 ? Math.round(totalSteps / steps.length) : 0;
  const stepGoal = user.dailyStepGoal * 7;

  return {
    weekStart,
    weekEnd,
    totalWorkouts,
    totalCalories,
    avgCalories,
    calorieTarget,
    totalSteps,
    avgSteps,
    stepGoal,
    daysActive,
  };
};
