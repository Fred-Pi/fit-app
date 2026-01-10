/**
 * 1RM (One Rep Max) Calculator Utilities
 *
 * Implements multiple proven formulas to estimate the maximum weight
 * a person can lift for one repetition based on submaximal lifts.
 */

export interface OneRepMaxResult {
  epley: number
  brzycki: number
  lander: number
  lombardi: number
  average: number
}

/**
 * Epley Formula: weight × (1 + reps/30)
 * Most commonly used, works well for reps 1-10
 */
export function epleyFormula(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps <= 0 || weight <= 0) return 0
  return weight * (1 + reps / 30)
}

/**
 * Brzycki Formula: weight × (36 / (37 - reps))
 * Very accurate for reps under 10
 */
export function brzyckiFormula(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps <= 0 || weight <= 0 || reps >= 37) return 0
  return weight * (36 / (37 - reps))
}

/**
 * Lander Formula: weight × (100 / (101.3 - 2.67123 × reps))
 * Good for moderate rep ranges
 */
export function landerFormula(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps <= 0 || weight <= 0) return 0
  const denominator = 101.3 - 2.67123 * reps
  if (denominator <= 0) return 0
  return weight * (100 / denominator)
}

/**
 * Lombardi Formula: weight × reps^0.10
 * Simple power formula
 */
export function lombardiFormula(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps <= 0 || weight <= 0) return 0
  return weight * Math.pow(reps, 0.10)
}

/**
 * Calculate 1RM using all formulas and return averaged result
 */
export function calculateOneRepMax(weight: number, reps: number): OneRepMaxResult {
  const epley = epleyFormula(weight, reps)
  const brzycki = brzyckiFormula(weight, reps)
  const lander = landerFormula(weight, reps)
  const lombardi = lombardiFormula(weight, reps)

  // Filter out invalid results (0 values) before averaging
  const validResults = [epley, brzycki, lander, lombardi].filter(v => v > 0)
  const average = validResults.length > 0
    ? validResults.reduce((sum, v) => sum + v, 0) / validResults.length
    : 0

  return {
    epley: Math.round(epley * 10) / 10,
    brzycki: Math.round(brzycki * 10) / 10,
    lander: Math.round(lander * 10) / 10,
    lombardi: Math.round(lombardi * 10) / 10,
    average: Math.round(average * 10) / 10,
  }
}

/**
 * Calculate weight needed for a target rep range given a 1RM
 * Useful for programming: "What weight should I use for 8 reps?"
 */
export function calculateWeightForReps(oneRepMax: number, targetReps: number): number {
  if (targetReps === 1) return oneRepMax
  if (targetReps <= 0 || oneRepMax <= 0) return 0

  // Using Epley formula reversed: weight = 1RM / (1 + reps/30)
  return Math.round(oneRepMax / (1 + targetReps / 30))
}

/**
 * Generate a rep-weight table from 1RM
 */
export function generateRepTable(oneRepMax: number): { reps: number; weight: number; percentage: number }[] {
  const repRanges = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20]

  return repRanges.map(reps => {
    const weight = calculateWeightForReps(oneRepMax, reps)
    const percentage = Math.round((weight / oneRepMax) * 100)
    return { reps, weight, percentage }
  })
}
