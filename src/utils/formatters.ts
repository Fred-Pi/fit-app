/**
 * Number and text formatting utilities
 */

/**
 * Format a number with thousand separators
 * @example formatNumber(10000) => "10,000"
 * @example formatNumber(1234567) => "1,234,567"
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Format a number with thousand separators and a unit
 * @example formatNumberWithUnit(10000, 'steps') => "10,000 steps"
 * @example formatNumberWithUnit(2500, 'cal') => "2,500 cal"
 */
export const formatNumberWithUnit = (num: number, unit: string): string => {
  return `${formatNumber(num)} ${unit}`;
};

/**
 * Format a decimal number with specified precision
 * @example formatDecimal(185.5, 1) => "185.5"
 * @example formatDecimal(72.333, 1) => "72.3"
 */
export const formatDecimal = (num: number, decimals: number = 1): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format weight with unit
 * @example formatWeight(185.5, 'lbs') => "185.5 lbs"
 */
export const formatWeight = (weight: number, unit: string): string => {
  return `${formatDecimal(weight, 1)} ${unit}`;
};

/**
 * Compact number formatting for large numbers
 * @example formatCompact(1500) => "1.5K"
 * @example formatCompact(1500000) => "1.5M"
 */
export const formatCompact = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};
