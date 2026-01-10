/**
 * Unified Design System
 *
 * Color palette based on modern design principles with
 * consistent contrast ratios and accessibility in mind.
 */

// ============ COLOR PRIMITIVES ============

const palette = {
  // Neutrals (Zinc scale)
  zinc: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },
  // Primary Blue
  blue: {
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  // Success Green
  emerald: {
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
  },
  // Warning Yellow
  amber: {
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },
  // Error Red
  red: {
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
  },
  // Nutrition Pink/Rose
  rose: {
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
  },
  // Analytics Purple
  violet: {
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
  },
  // Gold for achievements
  gold: {
    400: '#FCD34D',
    500: '#FBBF24',
    600: '#F59E0B',
  },
};

// ============ SEMANTIC TOKENS ============

export const colors = {
  // Backgrounds
  background: palette.zinc[950],
  surface: palette.zinc[900],
  surfaceElevated: palette.zinc[800],
  surfaceHighlight: palette.zinc[700],

  // Text
  text: palette.zinc[50],
  textSecondary: palette.zinc[400],
  textTertiary: palette.zinc[500],
  textMuted: palette.zinc[600],

  // Borders
  border: palette.zinc[800],
  borderLight: palette.zinc[700],
  borderFocus: palette.blue[500],

  // Primary actions
  primary: palette.blue[500],
  primaryHover: palette.blue[600],
  primaryMuted: `${palette.blue[500]}20`,

  // Status colors
  success: palette.emerald[500],
  successMuted: `${palette.emerald[500]}20`,
  warning: palette.amber[500],
  warningMuted: `${palette.amber[500]}20`,
  error: palette.red[500],
  errorMuted: `${palette.red[500]}20`,

  // Feature colors
  workout: palette.blue[500],
  workoutMuted: `${palette.blue[500]}15`,
  nutrition: palette.rose[500],
  nutritionMuted: `${palette.rose[500]}15`,
  steps: palette.emerald[500],
  stepsMuted: `${palette.emerald[500]}15`,
  analytics: palette.violet[500],
  analyticsMuted: `${palette.violet[500]}15`,

  // Special
  gold: palette.gold[500],
  goldMuted: `${palette.gold[500]}20`,

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

// ============ SPACING ============

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

// ============ TYPOGRAPHY ============

export const typography = {
  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  // Font weights
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  // Line heights
  leading: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ============ BORDER RADIUS ============

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// ============ SHADOWS ============

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

// ============ LEGACY THEME INTERFACE ============
// Maintained for backward compatibility during migration

export interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    workout: string;
    nutrition: string;
    steps: string;
    success: string;
    error: string;
    warning: string;
    modalOverlay: string;
    input: string;
    inputBorder: string;
  };
  isDark: boolean;
}

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    background: colors.background,
    surface: colors.surface,
    surfaceAlt: colors.surfaceElevated,
    text: colors.text,
    textSecondary: colors.textSecondary,
    border: colors.border,
    primary: colors.primary,
    workout: colors.workout,
    nutrition: colors.nutrition,
    steps: colors.steps,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    modalOverlay: colors.overlay,
    input: colors.surface,
    inputBorder: colors.border,
  },
};

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    background: palette.zinc[100],
    surface: '#FFFFFF',
    surfaceAlt: palette.zinc[50],
    text: palette.zinc[900],
    textSecondary: palette.zinc[600],
    border: palette.zinc[200],
    primary: colors.primary,
    workout: colors.workout,
    nutrition: colors.nutrition,
    steps: colors.steps,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    modalOverlay: colors.overlayLight,
    input: palette.zinc[50],
    inputBorder: palette.zinc[300],
  },
};
