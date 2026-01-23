import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../utils/theme';

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  title?: string;
  showDetails?: boolean;
}

/**
 * Fallback UI displayed when an error boundary catches an error.
 * Provides a user-friendly error message and recovery option.
 */
export default function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  showDetails = __DEV__,
}: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.error} />
        </View>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.message}>
          We encountered an unexpected error. Please try again or restart the app if the problem persists.
        </Text>

        {showDetails && error && (
          <ScrollView style={styles.detailsContainer} nestedScrollEnabled>
            <Text style={styles.detailsLabel}>Error Details:</Text>
            <Text style={styles.detailsText}>{error.message}</Text>
            {error.stack && (
              <Text style={styles.stackText}>{error.stack}</Text>
            )}
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={resetError}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color={colors.text} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.errorMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.size.base * typography.leading.relaxed,
    marginBottom: spacing['2xl'],
  },
  detailsContainer: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing['2xl'],
  },
  detailsLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailsText: {
    fontSize: typography.size.sm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  stackText: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
    fontFamily: 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
});
