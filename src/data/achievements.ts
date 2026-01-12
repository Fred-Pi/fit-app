import { AchievementDefinition } from '../types';

// Category colors for UI
export const achievementCategoryColors: Record<string, string> = {
  Workouts: '#4ECDC4',
  Streaks: '#FF6B6B',
  Strength: '#9B59B6',
  Consistency: '#3498DB',
  Variety: '#2ECC71',
};

// All achievement definitions
export const achievementDefinitions: AchievementDefinition[] = [
  // Workouts category
  {
    id: 'first_workout',
    title: 'First Steps',
    description: 'Log your first workout',
    icon: 'footsteps',
    category: 'Workouts',
    targetValue: 1,
  },
  {
    id: 'dedicated_10',
    title: 'Dedicated',
    description: 'Log 10 workouts',
    icon: 'fitness',
    category: 'Workouts',
    targetValue: 10,
  },
  {
    id: 'warrior_50',
    title: 'Warrior',
    description: 'Log 50 workouts',
    icon: 'shield',
    category: 'Workouts',
    targetValue: 50,
  },

  // Streaks category
  {
    id: 'streak_7',
    title: 'On Fire',
    description: '7-day workout streak',
    icon: 'flame',
    category: 'Streaks',
    targetValue: 7,
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    description: '30-day workout streak',
    icon: 'rocket',
    category: 'Streaks',
    targetValue: 30,
  },

  // Strength category
  {
    id: 'pr_5',
    title: 'PR Hunter',
    description: 'Set 5 personal records',
    icon: 'trending-up',
    category: 'Strength',
    targetValue: 5,
  },
  {
    id: 'pr_25',
    title: 'Record Breaker',
    description: 'Set 25 personal records',
    icon: 'medal',
    category: 'Strength',
    targetValue: 25,
  },

  // Consistency category
  {
    id: 'steps_7_days',
    title: 'Step Master',
    description: 'Hit step goal 7 days',
    icon: 'walk',
    category: 'Consistency',
    targetValue: 7,
  },
  {
    id: 'nutrition_7_days',
    title: 'Nutrition Pro',
    description: 'Log meals for 7 days',
    icon: 'restaurant',
    category: 'Consistency',
    targetValue: 7,
  },

  // Variety category
  {
    id: 'well_rounded',
    title: 'Well-Rounded',
    description: 'Train all 6 muscle groups in one week',
    icon: 'body',
    category: 'Variety',
    targetValue: 6,
  },
];
