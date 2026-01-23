import {
  calculateWorkoutVolume,
  calculateWeeklyVolume,
  getStrengthProgression,
  calculateFrequencyHeatmap,
  calculateWorkoutStreak,
  formatVolume,
} from '../../utils/analyticsCalculations';
import { WorkoutLog } from '../../types';

// Helper to create mock workout
const createMockWorkout = (
  id: string,
  date: string,
  exercises: Array<{
    exerciseName: string;
    sets: Array<{ weight: number; reps: number }>;
  }> = []
): WorkoutLog => ({
  id,
  userId: 'user-1',
  date,
  name: 'Test Workout',
  completed: true,
  created: new Date().toISOString(),
  exercises: exercises.map((ex, i) => ({
    id: `ex-${i}`,
    exerciseName: ex.exerciseName,
    sets: ex.sets.map(s => ({ ...s, completed: true })),
  })),
});

describe('calculateWorkoutVolume', () => {
  it('should return 0 for empty workout', () => {
    const workout = createMockWorkout('1', '2024-01-01', []);
    expect(calculateWorkoutVolume(workout)).toBe(0);
  });

  it('should calculate volume correctly for single exercise', () => {
    const workout = createMockWorkout('1', '2024-01-01', [
      {
        exerciseName: 'Bench Press',
        sets: [
          { weight: 135, reps: 10 },
          { weight: 135, reps: 10 },
          { weight: 135, reps: 8 },
        ],
      },
    ]);
    // 135*10 + 135*10 + 135*8 = 1350 + 1350 + 1080 = 3780
    expect(calculateWorkoutVolume(workout)).toBe(3780);
  });

  it('should calculate volume correctly for multiple exercises', () => {
    const workout = createMockWorkout('1', '2024-01-01', [
      {
        exerciseName: 'Squat',
        sets: [{ weight: 225, reps: 5 }],
      },
      {
        exerciseName: 'Deadlift',
        sets: [{ weight: 315, reps: 3 }],
      },
    ]);
    // 225*5 + 315*3 = 1125 + 945 = 2070
    expect(calculateWorkoutVolume(workout)).toBe(2070);
  });

  it('should handle zero weight sets', () => {
    const workout = createMockWorkout('1', '2024-01-01', [
      {
        exerciseName: 'Bodyweight Squats',
        sets: [{ weight: 0, reps: 20 }],
      },
    ]);
    expect(calculateWorkoutVolume(workout)).toBe(0);
  });
});

describe('calculateWeeklyVolume', () => {
  it('should return empty array for no workouts', () => {
    expect(calculateWeeklyVolume([])).toEqual([]);
  });

  it('should group workouts by week', () => {
    const workouts = [
      createMockWorkout('1', '2024-01-01', [
        { exerciseName: 'Bench', sets: [{ weight: 100, reps: 10 }] },
      ]),
      createMockWorkout('2', '2024-01-02', [
        { exerciseName: 'Squat', sets: [{ weight: 100, reps: 10 }] },
      ]),
    ];
    const result = calculateWeeklyVolume(workouts);
    expect(result.length).toBe(1);
    expect(result[0].volume).toBe(2000);
    expect(result[0].workouts).toBe(2);
  });
});

describe('getStrengthProgression', () => {
  it('should return empty array when no matching exercises', () => {
    const workouts = [
      createMockWorkout('1', '2024-01-01', [
        { exerciseName: 'Bench Press', sets: [{ weight: 135, reps: 10 }] },
      ]),
    ];
    expect(getStrengthProgression(workouts, 'Squat')).toEqual([]);
  });

  it('should find max weight for each workout', () => {
    const workouts = [
      createMockWorkout('1', '2024-01-01', [
        {
          exerciseName: 'Bench Press',
          sets: [
            { weight: 135, reps: 10 },
            { weight: 155, reps: 8 },
            { weight: 175, reps: 5 },
          ],
        },
      ]),
    ];
    const result = getStrengthProgression(workouts, 'Bench Press');
    expect(result.length).toBe(1);
    expect(result[0].weight).toBe(175);
    expect(result[0].reps).toBe(5);
  });

  it('should be case insensitive', () => {
    const workouts = [
      createMockWorkout('1', '2024-01-01', [
        { exerciseName: 'BENCH PRESS', sets: [{ weight: 135, reps: 10 }] },
      ]),
    ];
    const result = getStrengthProgression(workouts, 'bench press');
    expect(result.length).toBe(1);
  });
});

describe('calculateFrequencyHeatmap', () => {
  it('should return empty array for no workouts', () => {
    expect(calculateFrequencyHeatmap([])).toEqual([]);
  });

  it('should count multiple workouts on same date', () => {
    const workouts = [
      createMockWorkout('1', '2024-01-01', []),
      createMockWorkout('2', '2024-01-01', []),
      createMockWorkout('3', '2024-01-02', []),
    ];
    const result = calculateFrequencyHeatmap(workouts);
    expect(result.find(d => d.date === '2024-01-01')?.count).toBe(2);
    expect(result.find(d => d.date === '2024-01-02')?.count).toBe(1);
  });
});

describe('calculateWorkoutStreak', () => {
  it('should return 0 for no workouts', () => {
    const result = calculateWorkoutStreak([]);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
  });

  it('should calculate longest streak correctly', () => {
    // Consecutive days in the past (not connected to today)
    const workouts = [
      createMockWorkout('1', '2024-01-01', []),
      createMockWorkout('2', '2024-01-02', []),
      createMockWorkout('3', '2024-01-03', []),
      createMockWorkout('4', '2024-01-05', []), // gap
    ];
    const result = calculateWorkoutStreak(workouts);
    expect(result.longest).toBeGreaterThanOrEqual(3);
  });
});

describe('formatVolume', () => {
  it('should format small numbers', () => {
    expect(formatVolume(500)).toBe('500');
    expect(formatVolume(999)).toBe('999');
  });

  it('should format thousands with k suffix', () => {
    expect(formatVolume(1000)).toBe('1.0k');
    expect(formatVolume(5500)).toBe('5.5k');
    expect(formatVolume(12500)).toBe('12.5k');
  });

  it('should format millions with M suffix', () => {
    expect(formatVolume(1000000)).toBe('1.0M');
    expect(formatVolume(2500000)).toBe('2.5M');
  });

  it('should include unit when provided', () => {
    expect(formatVolume(5000, 'lbs')).toBe('5.0k lbs');
    expect(formatVolume(500, 'kg')).toBe('500 kg');
  });
});
