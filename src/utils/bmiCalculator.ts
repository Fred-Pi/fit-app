/**
 * BMI Calculator Utility
 *
 * Calculates Body Mass Index and provides category classifications
 * based on WHO standards.
 */

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface BMIResult {
  value: number;
  category: BMICategory;
  label: string;
  color: string;
}

/**
 * Calculate BMI from weight (kg) and height (cm)
 * Formula: BMI = weight(kg) / height(m)²
 */
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  if (weightKg <= 0 || heightCm <= 0) {
    return 0;
  }
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

/**
 * Get BMI category based on WHO standards
 */
export const getBMICategory = (bmi: number): BMICategory => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

/**
 * Get human-readable label for BMI category
 */
export const getBMICategoryLabel = (category: BMICategory): string => {
  switch (category) {
    case 'underweight':
      return 'Underweight';
    case 'normal':
      return 'Normal';
    case 'overweight':
      return 'Overweight';
    case 'obese':
      return 'Obese';
  }
};

/**
 * Get color for BMI category (using theme colors)
 */
export const getBMICategoryColor = (category: BMICategory): string => {
  switch (category) {
    case 'underweight':
      return '#3B82F6'; // Blue
    case 'normal':
      return '#10B981'; // Green/Emerald
    case 'overweight':
      return '#F59E0B'; // Amber/Yellow
    case 'obese':
      return '#F97316'; // Orange
  }
};

/**
 * Get complete BMI result with all metadata
 */
export const getBMIResult = (weightKg: number, heightCm: number): BMIResult => {
  const value = calculateBMI(weightKg, heightCm);
  const category = getBMICategory(value);
  return {
    value: Math.round(value * 10) / 10, // Round to 1 decimal
    category,
    label: getBMICategoryLabel(category),
    color: getBMICategoryColor(category),
  };
};

/**
 * Convert height from feet/inches to centimeters
 */
export const feetToCm = (feet: number, inches: number = 0): number => {
  return (feet * 12 + inches) * 2.54;
};

/**
 * Convert height from centimeters to feet and inches
 */
export const cmToFeet = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

/**
 * Convert weight from pounds to kilograms
 */
export const lbsToKg = (lbs: number): number => {
  return lbs * 0.453592;
};

/**
 * Convert weight from kilograms to pounds
 */
export const kgToLbs = (kg: number): number => {
  return kg / 0.453592;
};

/**
 * Format height for display
 */
export const formatHeight = (heightCm: number, unit: 'cm' | 'ft'): string => {
  if (unit === 'cm') {
    return `${Math.round(heightCm)} cm`;
  }
  const { feet, inches } = cmToFeet(heightCm);
  return `${feet}'${inches}"`;
};

/**
 * Format weight for display
 */
export const formatWeight = (weightKg: number, unit: 'kg' | 'lbs'): string => {
  if (unit === 'kg') {
    return `${Math.round(weightKg * 10) / 10} kg`;
  }
  return `${Math.round(kgToLbs(weightKg) * 10) / 10} lbs`;
};
