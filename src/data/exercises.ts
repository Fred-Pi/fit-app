export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Arms'
  | 'Legs'
  | 'Core'
  | 'Cardio';

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  defaultSets?: number;
  defaultReps?: number;
}

export interface ExerciseCategory {
  name: MuscleGroup;
  icon: string;
  color: string;
}

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  { name: 'Chest', icon: 'fitness-outline', color: '#FF6B6B' },
  { name: 'Back', icon: 'body-outline', color: '#4ECDC4' },
  { name: 'Shoulders', icon: 'triangle-outline', color: '#95E1D3' },
  { name: 'Arms', icon: 'hand-left-outline', color: '#F38181' },
  { name: 'Legs', icon: 'walk-outline', color: '#FFE66D' },
  { name: 'Core', icon: 'square-outline', color: '#A8DADC' },
  { name: 'Cardio', icon: 'heart-outline', color: '#FF8B94' },
];

export const EXERCISE_DATABASE: Exercise[] = [
  // Chest (8 exercises)
  { id: 'chest_001', name: 'Bench Press', category: 'Chest', defaultSets: 4, defaultReps: 8 },
  { id: 'chest_002', name: 'Incline Bench Press', category: 'Chest', defaultSets: 3, defaultReps: 10 },
  { id: 'chest_003', name: 'Decline Bench Press', category: 'Chest', defaultSets: 3, defaultReps: 10 },
  { id: 'chest_004', name: 'Dumbbell Chest Press', category: 'Chest', defaultSets: 3, defaultReps: 10 },
  { id: 'chest_005', name: 'Incline Dumbbell Press', category: 'Chest', defaultSets: 3, defaultReps: 10 },
  { id: 'chest_006', name: 'Cable Flyes', category: 'Chest', defaultSets: 3, defaultReps: 12 },
  { id: 'chest_007', name: 'Dumbbell Flyes', category: 'Chest', defaultSets: 3, defaultReps: 12 },
  { id: 'chest_008', name: 'Push-ups', category: 'Chest', defaultSets: 3, defaultReps: 15 },

  // Back (10 exercises)
  { id: 'back_001', name: 'Deadlift', category: 'Back', defaultSets: 4, defaultReps: 5 },
  { id: 'back_002', name: 'Barbell Rows', category: 'Back', defaultSets: 4, defaultReps: 8 },
  { id: 'back_003', name: 'Dumbbell Rows', category: 'Back', defaultSets: 3, defaultReps: 10 },
  { id: 'back_004', name: 'Pull-ups', category: 'Back', defaultSets: 3, defaultReps: 8 },
  { id: 'back_005', name: 'Chin-ups', category: 'Back', defaultSets: 3, defaultReps: 8 },
  { id: 'back_006', name: 'Lat Pulldown', category: 'Back', defaultSets: 3, defaultReps: 10 },
  { id: 'back_007', name: 'Cable Rows', category: 'Back', defaultSets: 3, defaultReps: 10 },
  { id: 'back_008', name: 'T-Bar Rows', category: 'Back', defaultSets: 3, defaultReps: 10 },
  { id: 'back_009', name: 'Face Pulls', category: 'Back', defaultSets: 3, defaultReps: 15 },
  { id: 'back_010', name: 'Shrugs', category: 'Back', defaultSets: 3, defaultReps: 12 },

  // Shoulders (7 exercises)
  { id: 'shoulders_001', name: 'Overhead Press', category: 'Shoulders', defaultSets: 4, defaultReps: 8 },
  { id: 'shoulders_002', name: 'Dumbbell Shoulder Press', category: 'Shoulders', defaultSets: 3, defaultReps: 10 },
  { id: 'shoulders_003', name: 'Arnold Press', category: 'Shoulders', defaultSets: 3, defaultReps: 10 },
  { id: 'shoulders_004', name: 'Lateral Raises', category: 'Shoulders', defaultSets: 3, defaultReps: 12 },
  { id: 'shoulders_005', name: 'Front Raises', category: 'Shoulders', defaultSets: 3, defaultReps: 12 },
  { id: 'shoulders_006', name: 'Rear Delt Flyes', category: 'Shoulders', defaultSets: 3, defaultReps: 12 },
  { id: 'shoulders_007', name: 'Upright Rows', category: 'Shoulders', defaultSets: 3, defaultReps: 10 },

  // Arms (8 exercises)
  { id: 'arms_001', name: 'Barbell Curl', category: 'Arms', defaultSets: 3, defaultReps: 10 },
  { id: 'arms_002', name: 'Dumbbell Curl', category: 'Arms', defaultSets: 3, defaultReps: 10 },
  { id: 'arms_003', name: 'Hammer Curls', category: 'Arms', defaultSets: 3, defaultReps: 10 },
  { id: 'arms_004', name: 'Preacher Curls', category: 'Arms', defaultSets: 3, defaultReps: 10 },
  { id: 'arms_005', name: 'Tricep Dips', category: 'Arms', defaultSets: 3, defaultReps: 10 },
  { id: 'arms_006', name: 'Close-Grip Bench Press', category: 'Arms', defaultSets: 3, defaultReps: 10 },
  { id: 'arms_007', name: 'Tricep Pushdown', category: 'Arms', defaultSets: 3, defaultReps: 12 },
  { id: 'arms_008', name: 'Overhead Tricep Extension', category: 'Arms', defaultSets: 3, defaultReps: 12 },

  // Legs (10 exercises)
  { id: 'legs_001', name: 'Squat', category: 'Legs', defaultSets: 4, defaultReps: 8 },
  { id: 'legs_002', name: 'Front Squat', category: 'Legs', defaultSets: 3, defaultReps: 8 },
  { id: 'legs_003', name: 'Leg Press', category: 'Legs', defaultSets: 3, defaultReps: 10 },
  { id: 'legs_004', name: 'Romanian Deadlift', category: 'Legs', defaultSets: 3, defaultReps: 10 },
  { id: 'legs_005', name: 'Leg Curl', category: 'Legs', defaultSets: 3, defaultReps: 12 },
  { id: 'legs_006', name: 'Leg Extension', category: 'Legs', defaultSets: 3, defaultReps: 12 },
  { id: 'legs_007', name: 'Lunges', category: 'Legs', defaultSets: 3, defaultReps: 10 },
  { id: 'legs_008', name: 'Bulgarian Split Squat', category: 'Legs', defaultSets: 3, defaultReps: 10 },
  { id: 'legs_009', name: 'Calf Raises', category: 'Legs', defaultSets: 4, defaultReps: 15 },
  { id: 'legs_010', name: 'Hip Thrusts', category: 'Legs', defaultSets: 3, defaultReps: 12 },

  // Core (6 exercises)
  { id: 'core_001', name: 'Plank', category: 'Core', defaultSets: 3, defaultReps: 60 },
  { id: 'core_002', name: 'Crunches', category: 'Core', defaultSets: 3, defaultReps: 20 },
  { id: 'core_003', name: 'Russian Twists', category: 'Core', defaultSets: 3, defaultReps: 20 },
  { id: 'core_004', name: 'Leg Raises', category: 'Core', defaultSets: 3, defaultReps: 15 },
  { id: 'core_005', name: 'Ab Wheel Rollouts', category: 'Core', defaultSets: 3, defaultReps: 10 },
  { id: 'core_006', name: 'Mountain Climbers', category: 'Core', defaultSets: 3, defaultReps: 20 },

  // Cardio (5 exercises)
  { id: 'cardio_001', name: 'Running', category: 'Cardio', defaultSets: 1, defaultReps: 30 },
  { id: 'cardio_002', name: 'Cycling', category: 'Cardio', defaultSets: 1, defaultReps: 30 },
  { id: 'cardio_003', name: 'Rowing', category: 'Cardio', defaultSets: 1, defaultReps: 20 },
  { id: 'cardio_004', name: 'Jump Rope', category: 'Cardio', defaultSets: 3, defaultReps: 100 },
  { id: 'cardio_005', name: 'Burpees', category: 'Cardio', defaultSets: 3, defaultReps: 15 },
];

// Helper function to get exercises by category
export const getExercisesByCategory = (category: MuscleGroup): Exercise[] => {
  return EXERCISE_DATABASE.filter(exercise => exercise.category === category);
};

// Helper function to search exercises
export const searchExercises = (query: string): Exercise[] => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return EXERCISE_DATABASE;

  return EXERCISE_DATABASE.filter(exercise =>
    exercise.name.toLowerCase().includes(lowerQuery)
  );
};

// Helper function to get exercise by name
export const getExerciseByName = (name: string): Exercise | undefined => {
  return EXERCISE_DATABASE.find(
    exercise => exercise.name.toLowerCase() === name.toLowerCase()
  );
};
