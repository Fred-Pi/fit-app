/**
 * Workout Store Tests
 *
 * Tests for selector functions and core store logic.
 */

import { WorkoutLog } from '../../types';
import { calculateWorkoutStreak, calculateWorkoutVolume } from '../../utils/analyticsCalculations';

// Mock workout data for testing
const createMockWorkout = (
  id: string,
  date: string,
  name: string,
  completed: boolean = true
): WorkoutLog => ({
  id,
  userId: 'test-user',
  date,
  name,
  exercises: [
    {
      id: `${id}-ex1`,
      exerciseName: 'Bench Press',
      sets: [
        { reps: 10, weight: 135, completed: true },
        { reps: 8, weight: 155, completed: true },
      ],
    },
  ],
  completed,
  created: date,
});

describe('calculateWorkoutStreak', () => {
  it('should return 0 for empty workouts', () => {
    const result = calculateWorkoutStreak([]);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
  });

  it('should calculate streak for consecutive days', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const workouts = [
      createMockWorkout('1', today.toISOString().split('T')[0], 'Push'),
      createMockWorkout('2', yesterday.toISOString().split('T')[0], 'Pull'),
      createMockWorkout('3', twoDaysAgo.toISOString().split('T')[0], 'Legs'),
    ];

    const result = calculateWorkoutStreak(workouts);
    expect(result.current).toBe(3);
    expect(result.longest).toBeGreaterThanOrEqual(3);
  });

  it('should reset current streak when no recent workout', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const workouts = [
      createMockWorkout('1', threeDaysAgo.toISOString().split('T')[0], 'Push'),
      createMockWorkout('2', fourDaysAgo.toISOString().split('T')[0], 'Pull'),
    ];

    const result = calculateWorkoutStreak(workouts);
    // Current streak should be 0 (no workout today or yesterday)
    expect(result.current).toBe(0);
    // But longest should reflect the past consecutive days
    expect(result.longest).toBe(2);
  });

  it('should count all workouts regardless of completed status', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const workouts = [
      createMockWorkout('1', today.toISOString().split('T')[0], 'Push', true),
      createMockWorkout('2', yesterday.toISOString().split('T')[0], 'Pull', false),
    ];

    const result = calculateWorkoutStreak(workouts);
    // Both workouts count toward streak (completed status not checked)
    expect(result.current).toBe(2);
  });
});

describe('calculateWorkoutVolume', () => {
  it('should calculate workout volume correctly', () => {
    const workout: WorkoutLog = {
      id: '1',
      userId: 'test',
      date: '2024-01-01',
      name: 'Test',
      exercises: [
        {
          id: 'ex1',
          exerciseName: 'Bench Press',
          sets: [
            { reps: 10, weight: 100, completed: true },
            { reps: 8, weight: 100, completed: true },
          ],
        },
      ],
      completed: true,
      created: '2024-01-01',
    };

    // Volume = (10 * 100) + (8 * 100) = 1000 + 800 = 1800
    const result = calculateWorkoutVolume(workout);
    expect(result).toBe(1800);
  });

  it('should handle zero weight sets', () => {
    const workout: WorkoutLog = {
      id: '1',
      userId: 'test',
      date: '2024-01-01',
      name: 'Test',
      exercises: [
        {
          id: 'ex1',
          exerciseName: 'Pull-ups',
          sets: [
            { reps: 10, weight: 0, completed: true },
            { reps: 8, weight: 0, completed: true },
          ],
        },
      ],
      completed: true,
      created: '2024-01-01',
    };

    // Bodyweight exercises with 0 weight = 0 volume
    const result = calculateWorkoutVolume(workout);
    expect(result).toBe(0);
  });

  it('should handle multiple exercises', () => {
    const workout: WorkoutLog = {
      id: '1',
      userId: 'test',
      date: '2024-01-01',
      name: 'Test',
      exercises: [
        {
          id: 'ex1',
          exerciseName: 'Bench Press',
          sets: [{ reps: 10, weight: 100, completed: true }],
        },
        {
          id: 'ex2',
          exerciseName: 'Squat',
          sets: [{ reps: 5, weight: 200, completed: true }],
        },
      ],
      completed: true,
      created: '2024-01-01',
    };

    // Volume = (10 * 100) + (5 * 200) = 1000 + 1000 = 2000
    const result = calculateWorkoutVolume(workout);
    expect(result).toBe(2000);
  });
});

describe('Workout filtering', () => {
  const mockWorkouts: WorkoutLog[] = [
    createMockWorkout('1', '2024-01-15', 'Push'),
    createMockWorkout('2', '2024-01-14', 'Pull'),
    createMockWorkout('3', '2024-01-13', 'Legs'),
    createMockWorkout('4', '2024-01-10', 'Push'),
  ];

  it('should filter workouts in date range', () => {
    const start = '2024-01-13';
    const end = '2024-01-15';

    const filtered = mockWorkouts.filter((w) => w.date >= start && w.date <= end);

    expect(filtered.length).toBe(3);
    expect(filtered.every((w) => w.date >= start && w.date <= end)).toBe(true);
  });

  it('should get recent unique workouts by name', () => {
    const allWorkouts = [
      createMockWorkout('1', '2024-01-15', 'Push'),
      createMockWorkout('2', '2024-01-14', 'Pull'),
      createMockWorkout('3', '2024-01-13', 'Push'), // Duplicate name
      createMockWorkout('4', '2024-01-12', 'Legs'),
    ];

    const seen = new Set<string>();
    const unique: WorkoutLog[] = [];
    for (const w of allWorkouts) {
      if (!seen.has(w.name) && w.completed) {
        seen.add(w.name);
        unique.push(w);
        if (unique.length >= 3) break;
      }
    }

    expect(unique.length).toBe(3);
    expect(unique.map((w) => w.name)).toEqual(['Push', 'Pull', 'Legs']);
  });
});
