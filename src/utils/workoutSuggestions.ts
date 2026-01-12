/**
 * Smart Workout Suggestions
 *
 * Analyzes recent workouts and recommends which muscle groups
 * to focus on based on recency, volume balance, and recovery time.
 */

import { WorkoutLog, MuscleGroup } from '../types';
import { calculateMuscleGroupHeatmap, getExerciseMuscleGroup } from './muscleGroupCalculations';

export interface WorkoutSuggestion {
  muscleGroup: MuscleGroup;
  reason: string;
  priority: 'high' | 'medium';
  daysSinceTraining: number | null;
  weekSets: number;
}

export interface SuggestionData {
  suggestions: WorkoutSuggestion[];
  mostTrained: MuscleGroup | null;
  mostTrainedSets: number;
  hasEnoughData: boolean;
}

// Minimum workouts needed for meaningful suggestions
const MIN_WORKOUTS_FOR_SUGGESTIONS = 3;

// Recovery time in hours (48 hours)
const RECOVERY_HOURS = 48;

// Muscle groups to suggest (exclude Cardio from suggestions)
const SUGGESTABLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'
];

/**
 * Calculate days since a date string (YYYY-MM-DD)
 */
function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if muscle group has had enough recovery time (48h+)
 */
function hasRecovered(lastTrained: string | null): boolean {
  if (!lastTrained) return true; // Never trained = ready
  const date = new Date(lastTrained);
  const now = new Date();
  const hoursSince = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return hoursSince >= RECOVERY_HOURS;
}

/**
 * Calculate recency score (0-100)
 * Higher score = longer since trained = higher priority
 */
function getRecencyScore(daysSinceTraining: number | null): number {
  if (daysSinceTraining === null) return 100; // Never trained
  if (daysSinceTraining >= 5) return 100;
  if (daysSinceTraining === 4) return 80;
  if (daysSinceTraining === 3) return 60;
  if (daysSinceTraining === 2) return 40;
  return 0; // 0-1 days = needs recovery
}

/**
 * Calculate volume deficit score (0-100)
 * Higher score = more undertrained compared to average
 */
function getVolumeDeficitScore(sets: number, avgSets: number): number {
  if (avgSets === 0) return 50; // No baseline
  const ratio = sets / avgSets;
  if (ratio <= 0.25) return 100;  // Severely undertrained
  if (ratio <= 0.5) return 75;    // Undertrained
  if (ratio <= 0.75) return 50;   // Slightly below average
  if (ratio <= 1.0) return 25;    // At average
  return 0; // Above average
}

/**
 * Generate a human-readable reason for the suggestion
 */
function generateReason(
  daysSinceTraining: number | null,
  sets: number,
  avgSets: number
): string {
  // Prioritize recency-based reasons
  if (daysSinceTraining === null) {
    return 'Not trained recently';
  }
  if (daysSinceTraining >= 5) {
    return `Last trained ${daysSinceTraining} days ago`;
  }
  if (daysSinceTraining >= 3) {
    return `Last trained ${daysSinceTraining} days ago`;
  }

  // Fall back to volume-based reasons
  if (sets === 0) {
    return 'No sets this week';
  }
  if (avgSets > 0 && sets < avgSets * 0.5) {
    return `Only ${sets} set${sets === 1 ? '' : 's'} this week`;
  }

  return `${sets} set${sets === 1 ? '' : 's'} this week`;
}

/**
 * Calculate workout suggestions based on recent training data
 */
export function calculateWorkoutSuggestions(
  workouts: WorkoutLog[]
): SuggestionData {
  // Check if we have enough data
  const completedWorkouts = workouts.filter(w => w.completed);
  if (completedWorkouts.length < MIN_WORKOUTS_FOR_SUGGESTIONS) {
    return {
      suggestions: [],
      mostTrained: null,
      mostTrainedSets: 0,
      hasEnoughData: false,
    };
  }

  // Get muscle group data for the last 14 days
  const heatmapData = calculateMuscleGroupHeatmap(workouts, 14);

  // Calculate average sets per muscle group (excluding zero values and cardio)
  const nonZeroSets = heatmapData.scores
    .filter(s => s.sets > 0 && s.name !== 'Cardio')
    .map(s => s.sets);
  const avgSets = nonZeroSets.length > 0
    ? nonZeroSets.reduce((a, b) => a + b, 0) / nonZeroSets.length
    : 0;

  // Score each suggestable muscle group
  const scoredGroups = SUGGESTABLE_GROUPS.map(group => {
    const scoreData = heatmapData.scores.find(s => s.name === group);
    if (!scoreData) return null;

    const days = daysSince(scoreData.lastTrained);
    const recovered = hasRecovered(scoreData.lastTrained);

    // Skip if not recovered (trained in last 48h)
    if (!recovered) return null;

    // Calculate combined score
    const recencyScore = getRecencyScore(days);
    const volumeDeficitScore = getVolumeDeficitScore(scoreData.sets, avgSets);
    const recoveryBonus = recovered ? 100 : 0;

    const totalScore =
      (recencyScore * 0.5) +
      (volumeDeficitScore * 0.3) +
      (recoveryBonus * 0.2);

    return {
      muscleGroup: group,
      score: totalScore,
      daysSinceTraining: days,
      weekSets: scoreData.sets,
      avgSets,
    };
  }).filter(Boolean) as Array<{
    muscleGroup: MuscleGroup;
    score: number;
    daysSinceTraining: number | null;
    weekSets: number;
    avgSets: number;
  }>;

  // Sort by score and take top 2
  const topGroups = scoredGroups
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .filter(g => g.score >= 40); // Minimum threshold to suggest

  // Convert to suggestions
  const suggestions: WorkoutSuggestion[] = topGroups.map((group, index) => ({
    muscleGroup: group.muscleGroup,
    reason: generateReason(group.daysSinceTraining, group.weekSets, group.avgSets),
    priority: index === 0 ? 'high' : 'medium',
    daysSinceTraining: group.daysSinceTraining,
    weekSets: group.weekSets,
  }));

  // Find most trained muscle group
  const mostTrainedScore = heatmapData.scores
    .filter(s => s.name !== 'Cardio')
    .sort((a, b) => b.sets - a.sets)[0];

  return {
    suggestions,
    mostTrained: mostTrainedScore?.sets > 0 ? mostTrainedScore.name : null,
    mostTrainedSets: mostTrainedScore?.sets || 0,
    hasEnoughData: true,
  };
}
