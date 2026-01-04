/**
 * Date utility functions for week calculations and formatting
 */

/**
 * Get the start and end dates of the week containing the given date
 * Week runs from Monday to Sunday
 * @param date Optional date (defaults to today)
 * @returns Object with start and end dates in YYYY-MM-DD format
 */
export const getWeekDates = (date?: Date): { start: string; end: string } => {
  const targetDate = date ? new Date(date) : new Date();

  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = targetDate.getDay();

  // Calculate days to subtract to get to Monday
  // If Sunday (0), go back 6 days; if Monday (1), go back 0 days, etc.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Get Monday of this week
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  // Get Sunday of this week (6 days after Monday)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: formatDateToISO(monday),
    end: formatDateToISO(sunday),
  };
};

/**
 * Get the start and end dates of the previous week
 * @param date Optional date (defaults to today)
 * @returns Object with start and end dates in YYYY-MM-DD format
 */
export const getPreviousWeekDates = (date?: Date): { start: string; end: string } => {
  const targetDate = date ? new Date(date) : new Date();

  // Get 7 days before the target date
  const previousWeekDate = new Date(targetDate);
  previousWeekDate.setDate(targetDate.getDate() - 7);

  // Get the week dates for that previous week
  return getWeekDates(previousWeekDate);
};

/**
 * Format a Date object to YYYY-MM-DD string
 * @param date Date to format
 * @returns ISO date string (YYYY-MM-DD)
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse ISO date string to Date object
 * @param isoString ISO date string (YYYY-MM-DD)
 * @returns Date object
 */
export const parseISODate = (isoString: string): Date => {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format a week range for display
 * @param start Start date in YYYY-MM-DD format
 * @param end End date in YYYY-MM-DD format
 * @returns Formatted string like "Jan 1 - Jan 7" or "Dec 30 - Jan 5" (for cross-month)
 */
export const formatWeekRange = (start: string, end: string): string => {
  const startDate = parseISODate(start);
  const endDate = parseISODate(end);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const startMonth = monthNames[startDate.getMonth()];
  const startDay = startDate.getDate();

  const endMonth = monthNames[endDate.getMonth()];
  const endDay = endDate.getDate();

  // If same month, show "Jan 1 - 7"
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }

  // If different months, show "Dec 30 - Jan 5"
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
};

/**
 * Calculate percentage change between two values
 * @param current Current value
 * @param previous Previous value
 * @returns Percentage change (positive or negative)
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * Calculate absolute difference between two values
 * @param current Current value
 * @param previous Previous value
 * @returns Difference (current - previous)
 */
export const calculateDifference = (current: number, previous: number): number => {
  return current - previous;
};

/**
 * Check if a date string is within a date range (inclusive)
 * @param date Date to check (YYYY-MM-DD)
 * @param start Start of range (YYYY-MM-DD)
 * @param end End of range (YYYY-MM-DD)
 * @returns True if date is within range
 */
export const isDateInRange = (date: string, start: string, end: string): boolean => {
  return date >= start && date <= end;
};

/**
 * Get the current date in YYYY-MM-DD format
 * @returns Today's date as ISO string
 */
export const getTodayISO = (): string => {
  return formatDateToISO(new Date());
};
