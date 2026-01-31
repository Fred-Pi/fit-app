import { StyleSheet, Platform, Dimensions } from 'react-native';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';

/**
 * Desktop modal constraints
 * Modals should not take full screen on desktop - constrain to reasonable width
 */
const MODAL_MAX_WIDTH = 560;
const MODAL_DESKTOP_MARGIN = 48;

/**
 * Shared modal styles for consistent glass morphism design
 */
export const modalStyles = StyleSheet.create({
  // Container - centers content on desktop
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...Platform.select({
      web: {
        maxWidth: MODAL_MAX_WIDTH,
        alignSelf: 'center' as const,
        width: '100%',
        marginVertical: MODAL_DESKTOP_MARGIN,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: glass.border,
        overflow: 'hidden' as const,
      },
      default: {},
    }),
  },

  // Content area
  content: {
    flex: 1,
    padding: spacing.xl,
  },

  scrollContent: {
    paddingBottom: spacing['3xl'],
  },

  // Section styling
  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: 0.2,
  },

  sectionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  // Label
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  requiredLabel: {
    color: colors.primary,
  },

  // Glass Input styling
  input: {
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    fontSize: typography.size.base,
    color: colors.text,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },

  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: glass.background,
  },

  textArea: {
    minHeight: 100,
    paddingTop: spacing.lg,
    textAlignVertical: 'top',
  },

  // Row layout
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  rowItem: {
    flex: 1,
  },

  // Glass Card styling for form sections
  formCard: {
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },

  // List items
  listItem: {
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  listItemText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },

  listItemSubtext: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Action buttons in forms
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },

  actionButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },

  // Help/info section
  helpSection: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },

  helpText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Picker button styling
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },

  pickerButtonText: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },

  pickerButtonTextSelected: {
    color: colors.text,
    fontWeight: typography.weight.medium,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: glass.border,
    marginVertical: spacing.xl,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },

  emptyStateText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

// Input placeholder color
export const placeholderColor = colors.textTertiary;

/**
 * Desktop modal wrapper styles
 * Use these to wrap Modal content on web for proper centering with backdrop
 */
export const desktopModalStyles = StyleSheet.create({
  // Backdrop overlay for desktop
  backdrop: {
    ...Platform.select({
      web: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: MODAL_DESKTOP_MARGIN,
      },
      default: {
        flex: 1,
      },
    }),
  },

  // Modal card container
  modalCard: {
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: MODAL_MAX_WIDTH,
        backgroundColor: colors.background,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: glass.border,
        overflow: 'hidden' as const,
        ...shadows.xl,
      },
      default: {
        flex: 1,
        backgroundColor: colors.background,
      },
    }),
  },
});

/**
 * Constants for responsive modal sizing
 */
export const MODAL_CONSTANTS = {
  maxWidth: MODAL_MAX_WIDTH,
  desktopMargin: MODAL_DESKTOP_MARGIN,
};
