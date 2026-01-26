/**
 * Unified Design System
 *
 * Modern glass morphism design with depth, blur effects,
 * and consistent contrast ratios for accessibility.
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
  // Primary Blue - Enhanced vibrancy
  blue: {
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  // Success Green - Vibrant emerald
  emerald: {
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
  },
  // Warning Yellow
  amber: {
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },
  // Error Red
  red: {
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
  },
  // Nutrition Pink/Rose - More vibrant
  rose: {
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
  },
  // Analytics Purple - Rich violet
  violet: {
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
  },
  // Gold for achievements
  gold: {
    300: '#FDE68A',
    400: '#FCD34D',
    500: '#FBBF24',
    600: '#F59E0B',
  },
  // Cyan for accents
  cyan: {
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
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
  primaryLight: palette.blue[400],
  primaryHover: palette.blue[600],
  primaryMuted: `${palette.blue[500]}20`,

  // Status colors
  success: palette.emerald[500],
  successLight: palette.emerald[400],
  successMuted: `${palette.emerald[500]}20`,
  warning: palette.amber[500],
  warningLight: palette.amber[400],
  warningMuted: `${palette.amber[500]}20`,
  error: palette.red[500],
  errorLight: palette.red[400],
  errorMuted: `${palette.red[500]}20`,

  // Feature colors with gradients
  workout: palette.blue[500],
  workoutLight: palette.blue[400],
  workoutMuted: `${palette.blue[500]}15`,
  nutrition: palette.rose[500],
  nutritionLight: palette.rose[400],
  nutritionMuted: `${palette.rose[500]}15`,
  steps: palette.emerald[500],
  stepsLight: palette.emerald[400],
  stepsMuted: `${palette.emerald[500]}15`,
  analytics: palette.violet[500],
  analyticsLight: palette.violet[400],
  analyticsMuted: `${palette.violet[500]}15`,

  // Special
  gold: palette.gold[500],
  goldLight: palette.gold[400],
  goldMuted: `${palette.gold[500]}20`,
  cyan: palette.cyan[500],
  cyanLight: palette.cyan[400],

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

// ============ GLASS MORPHISM ============

export const glass = {
  // Background colors with transparency for glass effect
  background: 'rgba(24, 24, 27, 0.7)',
  backgroundLight: 'rgba(39, 39, 42, 0.6)',
  backgroundDark: 'rgba(9, 9, 11, 0.8)',

  // Border colors for glass edges
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  borderAccent: 'rgba(255, 255, 255, 0.15)',

  // Glow effects
  glow: {
    blue: 'rgba(59, 130, 246, 0.3)',
    emerald: 'rgba(16, 185, 129, 0.3)',
    rose: 'rgba(244, 63, 94, 0.3)',
    violet: 'rgba(139, 92, 246, 0.3)',
    gold: 'rgba(251, 191, 36, 0.3)',
    cyan: 'rgba(6, 182, 212, 0.3)',
  },

  // Gradient overlays
  shimmer: 'rgba(255, 255, 255, 0.05)',
};

// ============ GRADIENTS ============

export const gradients = {
  // Card gradients
  card: ['rgba(39, 39, 42, 0.8)', 'rgba(24, 24, 27, 0.9)'],
  cardHover: ['rgba(63, 63, 70, 0.6)', 'rgba(39, 39, 42, 0.7)'],

  // Feature gradients
  workout: [palette.blue[600], palette.blue[500], palette.cyan[500]],
  nutrition: [palette.rose[600], palette.rose[500], palette.amber[500]],
  steps: [palette.emerald[600], palette.emerald[500], palette.cyan[500]],
  analytics: [palette.violet[600], palette.violet[500], palette.blue[500]],
  gold: [palette.gold[600], palette.gold[500], palette.amber[400]],

  // Progress bar gradients
  progressBlue: [palette.blue[500], palette.cyan[400]],
  progressGreen: [palette.emerald[500], palette.cyan[400]],
  progressRose: [palette.rose[500], palette.amber[400]],
  progressViolet: [palette.violet[500], palette.blue[400]],
  progressGold: [palette.gold[500], palette.amber[400]],

  // Background gradients
  backgroundRadial: ['rgba(59, 130, 246, 0.1)', 'transparent'],
  screenTop: ['rgba(39, 39, 42, 0.5)', 'transparent'],
};

// ============ ANIMATION TIMINGS ============

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springBouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
  },
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
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  // Colored glow shadows
  glow: (color: string, intensity: number = 0.4) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 12,
    elevation: 8,
  }),
  // Inner shadow simulation (via border)
  inner: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
