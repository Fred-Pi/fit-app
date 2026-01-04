import {
  WorkoutLog,
  ExerciseLog,
  DailyNutrition,
  Meal,
  DailySteps,
} from '../types';
import {
  generateId,
  formatDate,
  saveWorkout,
  saveNutrition,
  saveSteps,
  getUser,
} from '../services/storage';

/**
 * Utility to create sample data for testing the app
 * Call this from the Profile screen or during development
 */
export const createSampleData = async () => {
  const user = await getUser();
  if (!user) {
    console.error('No user found');
    return;
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Sample Workout 1 (Today)
  const workout1: WorkoutLog = {
    id: generateId(),
    userId: user.id,
    date: formatDate(today),
    name: 'Push Day A',
    duration: 65,
    completed: true,
    exercises: [
      {
        id: generateId(),
        exerciseName: 'Bench Press',
        sets: [
          { reps: 8, weight: 185, completed: true, rpe: 8 },
          { reps: 8, weight: 185, completed: true, rpe: 8 },
          { reps: 7, weight: 185, completed: true, rpe: 9 },
          { reps: 6, weight: 185, completed: true, rpe: 9 },
        ],
      },
      {
        id: generateId(),
        exerciseName: 'Overhead Press',
        sets: [
          { reps: 10, weight: 95, completed: true, rpe: 7 },
          { reps: 9, weight: 95, completed: true, rpe: 8 },
          { reps: 8, weight: 95, completed: true, rpe: 9 },
        ],
      },
      {
        id: generateId(),
        exerciseName: 'Incline Dumbbell Press',
        sets: [
          { reps: 12, weight: 60, completed: true },
          { reps: 11, weight: 60, completed: true },
          { reps: 10, weight: 60, completed: true },
        ],
      },
      {
        id: generateId(),
        exerciseName: 'Lateral Raises',
        sets: [
          { reps: 15, weight: 20, completed: true },
          { reps: 15, weight: 20, completed: true },
          { reps: 14, weight: 20, completed: true },
        ],
      },
    ],
    created: new Date().toISOString(),
  };

  // Sample Workout 2 (Yesterday)
  const workout2: WorkoutLog = {
    id: generateId(),
    userId: user.id,
    date: formatDate(yesterday),
    name: 'Pull Day',
    duration: 70,
    completed: true,
    exercises: [
      {
        id: generateId(),
        exerciseName: 'Deadlift',
        sets: [
          { reps: 5, weight: 315, completed: true, rpe: 8 },
          { reps: 5, weight: 315, completed: true, rpe: 9 },
          { reps: 4, weight: 315, completed: true, rpe: 9 },
        ],
      },
      {
        id: generateId(),
        exerciseName: 'Pull-ups',
        sets: [
          { reps: 10, weight: 0, completed: true },
          { reps: 9, weight: 0, completed: true },
          { reps: 8, weight: 0, completed: true },
          { reps: 7, weight: 0, completed: true },
        ],
      },
      {
        id: generateId(),
        exerciseName: 'Barbell Rows',
        sets: [
          { reps: 10, weight: 135, completed: true },
          { reps: 10, weight: 135, completed: true },
          { reps: 9, weight: 135, completed: true },
        ],
      },
    ],
    created: new Date().toISOString(),
  };

  // Sample Workout 3 (Two days ago)
  const workout3: WorkoutLog = {
    id: generateId(),
    userId: user.id,
    date: formatDate(twoDaysAgo),
    name: 'Leg Day',
    duration: 80,
    completed: true,
    exercises: [
      {
        id: generateId(),
        exerciseName: 'Squat',
        sets: [
          { reps: 8, weight: 225, completed: true, rpe: 8 },
          { reps: 8, weight: 225, completed: true, rpe: 8 },
          { reps: 7, weight: 225, completed: true, rpe: 9 },
          { reps: 6, weight: 225, completed: true, rpe: 9 },
        ],
      },
      {
        id: generateId(),
        exerciseName: 'Romanian Deadlift',
        sets: [
          { reps: 10, weight: 185, completed: true },
          { reps: 10, weight: 185, completed: true },
          { reps: 9, weight: 185, completed: true },
        ],
      },
      {
        id: generateId(),
        exerciseName: 'Leg Press',
        sets: [
          { reps: 12, weight: 360, completed: true },
          { reps: 12, weight: 360, completed: true },
          { reps: 11, weight: 360, completed: true },
        ],
      },
    ],
    created: new Date().toISOString(),
  };

  // Sample Nutrition (Today)
  const nutrition1: DailyNutrition = {
    id: generateId(),
    userId: user.id,
    date: formatDate(today),
    calorieTarget: user.dailyCalorieTarget,
    meals: [
      {
        id: generateId(),
        name: 'Breakfast - Oatmeal & Eggs',
        calories: 520,
        protein: 32,
        carbs: 48,
        fats: 18,
        time: new Date(today.setHours(8, 30, 0)).toISOString(),
      },
      {
        id: generateId(),
        name: 'Lunch - Chicken & Rice',
        calories: 680,
        protein: 55,
        carbs: 72,
        fats: 12,
        time: new Date(today.setHours(13, 0, 0)).toISOString(),
      },
      {
        id: generateId(),
        name: 'Post-Workout Shake',
        calories: 350,
        protein: 40,
        carbs: 35,
        fats: 6,
        time: new Date(today.setHours(16, 30, 0)).toISOString(),
      },
      {
        id: generateId(),
        name: 'Dinner - Salmon & Veggies',
        calories: 580,
        protein: 48,
        carbs: 35,
        fats: 26,
        time: new Date(today.setHours(19, 0, 0)).toISOString(),
      },
    ],
  };

  // Sample Nutrition (Yesterday)
  const nutrition2: DailyNutrition = {
    id: generateId(),
    userId: user.id,
    date: formatDate(yesterday),
    calorieTarget: user.dailyCalorieTarget,
    meals: [
      {
        id: generateId(),
        name: 'Breakfast Burrito',
        calories: 650,
        protein: 38,
        carbs: 55,
        fats: 28,
        time: new Date(yesterday.setHours(9, 0, 0)).toISOString(),
      },
      {
        id: generateId(),
        name: 'Grilled Chicken Salad',
        calories: 450,
        protein: 42,
        carbs: 28,
        fats: 18,
        time: new Date(yesterday.setHours(13, 30, 0)).toISOString(),
      },
      {
        id: generateId(),
        name: 'Protein Bar',
        calories: 220,
        protein: 20,
        carbs: 22,
        fats: 8,
        time: new Date(yesterday.setHours(16, 0, 0)).toISOString(),
      },
      {
        id: generateId(),
        name: 'Steak & Potatoes',
        calories: 720,
        protein: 52,
        carbs: 48,
        fats: 32,
        time: new Date(yesterday.setHours(19, 30, 0)).toISOString(),
      },
    ],
  };

  // Sample Steps
  const steps1: DailySteps = {
    id: generateId(),
    userId: user.id,
    date: formatDate(today),
    steps: 8234,
    stepGoal: user.dailyStepGoal,
    source: 'manual',
  };

  const steps2: DailySteps = {
    id: generateId(),
    userId: user.id,
    date: formatDate(yesterday),
    steps: 12458,
    stepGoal: user.dailyStepGoal,
    source: 'manual',
  };

  const steps3: DailySteps = {
    id: generateId(),
    userId: user.id,
    date: formatDate(twoDaysAgo),
    steps: 9876,
    stepGoal: user.dailyStepGoal,
    source: 'manual',
  };

  // Save all sample data
  try {
    await saveWorkout(workout1);
    await saveWorkout(workout2);
    await saveWorkout(workout3);
    await saveNutrition(nutrition1);
    await saveNutrition(nutrition2);
    await saveSteps(steps1);
    await saveSteps(steps2);
    await saveSteps(steps3);

    console.log('Sample data created successfully!');
    return true;
  } catch (error) {
    console.error('Error creating sample data:', error);
    return false;
  }
};
