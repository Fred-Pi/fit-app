import { StyleSheet, Platform } from 'react-native';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';

/**
 * Shared modal styles for consistent glass morphism design
 */
export const modalStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
