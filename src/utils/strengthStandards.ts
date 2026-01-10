/**
 * Strength Standards
 *
 * Based on commonly accepted strength standards that use body weight ratios.
 * These are approximate guidelines based on population data from various
 * strength sports and fitness research.
 */

export type StrengthLevel = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Elite'

export interface StrengthStandard {
  exercise: string
  male: {
    beginner: number
    novice: number
    intermediate: number
    advanced: number
    elite: number
  }
  female: {
    beginner: number
    novice: number
    intermediate: number
    advanced: number
    elite: number
  }
}

/**
 * Strength standards as body weight multipliers
 * e.g., 1.5 means the lift should be 1.5x body weight
 */
export const STRENGTH_STANDARDS: StrengthStandard[] = [
  {
    exercise: 'Bench Press',
    male: { beginner: 0.5, novice: 0.75, intermediate: 1.0, advanced: 1.5, elite: 2.0 },
    female: { beginner: 0.25, novice: 0.5, intermediate: 0.75, advanced: 1.0, elite: 1.25 },
  },
  {
    exercise: 'Squat',
    male: { beginner: 0.75, novice: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
    female: { beginner: 0.5, novice: 0.75, intermediate: 1.0, advanced: 1.5, elite: 1.75 },
  },
  {
    exercise: 'Deadlift',
    male: { beginner: 1.0, novice: 1.25, intermediate: 1.75, advanced: 2.5, elite: 3.0 },
    female: { beginner: 0.5, novice: 0.75, intermediate: 1.25, advanced: 1.75, elite: 2.25 },
  },
  {
    exercise: 'Overhead Press',
    male: { beginner: 0.35, novice: 0.55, intermediate: 0.75, advanced: 1.0, elite: 1.25 },
    female: { beginner: 0.2, novice: 0.35, intermediate: 0.5, advanced: 0.65, elite: 0.85 },
  },
  {
    exercise: 'Barbell Row',
    male: { beginner: 0.5, novice: 0.7, intermediate: 0.9, advanced: 1.2, elite: 1.5 },
    female: { beginner: 0.3, novice: 0.45, intermediate: 0.6, advanced: 0.8, elite: 1.0 },
  },
]

export const STRENGTH_LEVEL_COLORS: Record<StrengthLevel, string> = {
  Beginner: '#9E9E9E',
  Novice: '#4CAF50',
  Intermediate: '#2196F3',
  Advanced: '#9C27B0',
  Elite: '#FFD700',
}

export const STRENGTH_LEVEL_DESCRIPTIONS: Record<StrengthLevel, string> = {
  Beginner: 'Just starting out - focus on form and consistency',
  Novice: 'Building a foundation - a few months of training',
  Intermediate: 'Solid progress - 1-2 years of consistent training',
  Advanced: 'Strong lifter - multiple years of dedicated training',
  Elite: 'Exceptional strength - competitive level',
}

/**
 * Find the matching exercise standard (fuzzy match)
 */
export function findExerciseStandard(exerciseName: string): StrengthStandard | null {
  const normalized = exerciseName.toLowerCase()

  // Direct matches and common variations
  const matchMap: Record<string, string> = {
    'bench press': 'Bench Press',
    'bench': 'Bench Press',
    'flat bench': 'Bench Press',
    'barbell bench': 'Bench Press',
    'barbell bench press': 'Bench Press',
    'squat': 'Squat',
    'back squat': 'Squat',
    'barbell squat': 'Squat',
    'barbell back squat': 'Squat',
    'deadlift': 'Deadlift',
    'conventional deadlift': 'Deadlift',
    'barbell deadlift': 'Deadlift',
    'overhead press': 'Overhead Press',
    'ohp': 'Overhead Press',
    'shoulder press': 'Overhead Press',
    'military press': 'Overhead Press',
    'standing press': 'Overhead Press',
    'barbell row': 'Barbell Row',
    'bent over row': 'Barbell Row',
    'bb row': 'Barbell Row',
    'pendlay row': 'Barbell Row',
  }

  const matchedName = matchMap[normalized]
  if (matchedName) {
    return STRENGTH_STANDARDS.find(s => s.exercise === matchedName) || null
  }

  // Partial match fallback
  for (const standard of STRENGTH_STANDARDS) {
    if (normalized.includes(standard.exercise.toLowerCase())) {
      return standard
    }
  }

  return null
}

/**
 * Calculate strength level based on 1RM and body weight
 */
export function calculateStrengthLevel(
  oneRepMax: number,
  bodyWeight: number,
  exerciseName: string,
  gender: 'male' | 'female' = 'male'
): {
  level: StrengthLevel
  ratio: number
  nextLevel: StrengthLevel | null
  progressToNext: number
  targetForNext: number
} | null {
  const standard = findExerciseStandard(exerciseName)
  if (!standard || bodyWeight <= 0) return null

  const ratio = oneRepMax / bodyWeight
  const standards = standard[gender]

  let level: StrengthLevel = 'Beginner'
  let nextLevel: StrengthLevel | null = 'Novice'

  if (ratio >= standards.elite) {
    level = 'Elite'
    nextLevel = null
  } else if (ratio >= standards.advanced) {
    level = 'Advanced'
    nextLevel = 'Elite'
  } else if (ratio >= standards.intermediate) {
    level = 'Intermediate'
    nextLevel = 'Advanced'
  } else if (ratio >= standards.novice) {
    level = 'Novice'
    nextLevel = 'Intermediate'
  } else if (ratio >= standards.beginner) {
    level = 'Beginner'
    nextLevel = 'Novice'
  }

  // Calculate progress to next level
  let progressToNext = 100
  let targetForNext = oneRepMax

  if (nextLevel) {
    const currentThreshold = standards[level.toLowerCase() as keyof typeof standards]
    const nextThreshold = standards[nextLevel.toLowerCase() as keyof typeof standards]
    const range = nextThreshold - currentThreshold
    const progress = ratio - currentThreshold

    progressToNext = Math.min(100, Math.max(0, (progress / range) * 100))
    targetForNext = Math.round(nextThreshold * bodyWeight)
  }

  return {
    level,
    ratio: Math.round(ratio * 100) / 100,
    nextLevel,
    progressToNext: Math.round(progressToNext),
    targetForNext,
  }
}

/**
 * Get all strength targets for an exercise at a given body weight
 */
export function getStrengthTargets(
  exerciseName: string,
  bodyWeight: number,
  gender: 'male' | 'female' = 'male'
): { level: StrengthLevel; weight: number }[] | null {
  const standard = findExerciseStandard(exerciseName)
  if (!standard || bodyWeight <= 0) return null

  const standards = standard[gender]

  return [
    { level: 'Beginner', weight: Math.round(standards.beginner * bodyWeight) },
    { level: 'Novice', weight: Math.round(standards.novice * bodyWeight) },
    { level: 'Intermediate', weight: Math.round(standards.intermediate * bodyWeight) },
    { level: 'Advanced', weight: Math.round(standards.advanced * bodyWeight) },
    { level: 'Elite', weight: Math.round(standards.elite * bodyWeight) },
  ]
}

/**
 * Check if an exercise has strength standards
 */
export function hasStrengthStandard(exerciseName: string): boolean {
  return findExerciseStandard(exerciseName) !== null
}

/**
 * Get list of exercises with strength standards
 */
export function getExercisesWithStandards(): string[] {
  return STRENGTH_STANDARDS.map(s => s.exercise)
}
