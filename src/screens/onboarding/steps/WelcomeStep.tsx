import React from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../components/GlassCard';
import { colors, glass, gradients, spacing, typography, radius } from '../../../utils/theme';

interface WelcomeStepProps {
  name: string;
  onNameChange: (name: string) => void;
  error?: string;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ name, onNameChange, error }) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={gradients.workout as [string, string, string]}
          style={styles.iconGradient}
        >
          <Ionicons name="fitness" size={64} color={colors.text} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Welcome to FitTrack</Text>
      <Text style={styles.subtitle}>Let's personalize your experience</Text>

      <View style={styles.formContainer}>
        <GlassCard accent="none" glowIntensity="none" padding="lg">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>What's your name?</Text>
            <View style={[styles.inputContainer, error && styles.inputContainerError]}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={onNameChange}
                placeholder="Enter your name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoFocus
              />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </GlassCard>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: spacing['3xl'],
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.extrabold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  formContainer: {
    marginTop: spacing['2xl'],
    width: '100%',
  },
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: glass.border,
    gap: spacing.sm,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: typography.size.lg,
    color: colors.text,
    paddingVertical: spacing.lg,
    outlineStyle: 'none',
  } as any,
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

export default WelcomeStep;
