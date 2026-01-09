/**
 * Progressive Overload Calculation Utility
 *
 * Calculates smart suggestions for weight/rep progression based on
 * the user's last performance.
 */

export interface ProgressionSuggestion {
  suggestedWeight: number
  suggestedReps: number
  suggestedSets: number
  increase: string // "+5 lbs" or "+2 reps"
  strategy: 'weight' | 'reps'
}

// Compound exercises that benefit from larger weight jumps
const COMPOUND_EXERCISES = [
  'squat', 'deadlift', 'bench press', 'overhead press', 'barbell row',
  'pull-up', 'chin-up', 'dip', 'leg press', 'romanian deadlift',
  'front squat', 'incline bench', 'decline bench', 'hip thrust',
  'pendlay row', 'bent over row', 'military press', 'push press'
]

/**
 * Determines if an exercise is a compound movement
 */
function isCompoundExercise(exerciseName: string): boolean {
  const nameLower = exerciseName.toLowerCase()
  return COMPOUND_EXERCISES.some(compound => nameLower.includes(compound))
}

/**
 * Rounds weight to nearest practical increment
 * - Compounds: round to nearest 5
 * - Isolation: round to nearest 2.5
 */
function roundWeight(weight: number, isCompound: boolean): number {
  const increment = isCompound ? 5 : 2.5
  return Math.round(weight / increment) * increment
}

/**
 * Calculate progressive overload suggestion based on last performance
 *
 * Strategy:
 * - If last reps < 12: increase weight (maintain reps)
 * - If last reps >= 12: could increase weight OR suggest user can handle more
 * - Compounds get +5 lbs, isolation gets +2.5 lbs
 */
export function calculateProgression(
  exerciseName: string,
  lastWeight: number,
  lastReps: number,
  lastSets: number,
  weightUnit: 'lbs' | 'kg' = 'lbs'
): ProgressionSuggestion {
  const isCompound = isCompoundExercise(exerciseName)

  // Weight increment based on exercise type
  const weightIncrement = isCompound ? 5 : 2.5

  // Default strategy: increase weight, keep reps
  let suggestedWeight = lastWeight + weightIncrement
  let suggestedReps = lastReps
  let strategy: 'weight' | 'reps' = 'weight'
  let increase = `+${weightIncrement} ${weightUnit}`

  // If user hit high reps (12+), they might want to increase weight more
  // but we still suggest modest increase to be safe
  if (lastReps >= 12) {
    // Still increase weight but could also note they're ready for more
    suggestedWeight = lastWeight + weightIncrement
    increase = `+${weightIncrement} ${weightUnit}`
  }

  // If weight is 0 or very low (bodyweight exercise), suggest rep increase
  if (lastWeight <= 0) {
    suggestedWeight = 0
    suggestedReps = lastReps + 1
    strategy = 'reps'
    increase = '+1 rep'
  }

  // Round the suggested weight to practical increments
  if (suggestedWeight > 0) {
    suggestedWeight = roundWeight(suggestedWeight, isCompound)
  }

  return {
    suggestedWeight,
    suggestedReps,
    suggestedSets: lastSets,
    increase,
    strategy
  }
}

/**
 * Format suggestion for display
 * e.g., "3×10 @ 140 lbs"
 */
export function formatSuggestion(
  sets: number,
  reps: number,
  weight: number,
  unit: 'lbs' | 'kg' = 'lbs'
): string {
  if (weight <= 0) {
    return `${sets}×${reps}`
  }
  return `${sets}×${reps} @ ${weight} ${unit}`
}
