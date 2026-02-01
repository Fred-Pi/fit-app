/**
 * Utility functions for storage operations
 */

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const getTodayDate = (): string => {
  return formatDate(new Date());
};

export const isDateInRange = (date: string, start: string, end: string): boolean => {
  return date >= start && date <= end;
};
