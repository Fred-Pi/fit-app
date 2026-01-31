import React from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../components/GlassCard';
import { colors, glass, spacing, typography, radius } from '../../../utils/theme';
import { lightHaptic } from '../../../utils/haptics';

interface GoalsStepProps {
  calorieTarget: string;
  onCalorieTargetChange: (value: string) => void;
  stepGoal: string;
  onStepGoalChange: (value: string) => void;
  errors: {
    calories?: string;
    steps?: string;
  };
}

const CALORIE_PRESETS = [1500, 2000, 2500, 3000];
const STEP_PRESETS = [5000, 7500, 10000, 15000];

const GoalsStep: React.FC<GoalsStepProps> = ({
  calorieTarget,
  onCalorieTargetChange,
  stepGoal,
  onStepGoalChange,
  errors,
}) => {
  const handleCaloriePreset = (value: number) => {
    lightHaptic();
    onCalorieTargetChange(value.toString());
  };

  const handleStepPreset = (value: number) => {
    lightHaptic();
    onStepGoalChange(value.toString());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Your Goals</Text>
      <Text style={styles.subtitle}>We'll help you track these daily</Text>

      <View style={styles.formContainer}>
        <GlassCard accent="none" glowIntensity="none" padding="lg">
          {/* Calorie Target */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Daily Calorie Target</Text>
            <View style={[styles.inputContainer, errors.calories && styles.inputContainerError]}>
              <Ionicons name="flame-outline" size={20} color={colors.nutrition} />
              <TextInput
                style={styles.input}
                value={calorieTarget}
                onChangeText={onCalorieTargetChange}
                placeholder="2000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Text style={styles.inputSuffix}>kcal</Text>
            </View>
            {errors.calories && <Text style={styles.errorText}>{errors.calories}</Text>}

            <View style={styles.presetsContainer}>
              {CALORIE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    calorieTarget === preset.toString() && styles.presetChipActive,
                  ]}
                  onPress={() => handleCaloriePreset(preset)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetText,
                      calorieTarget === preset.toString() && styles.presetTextActive,
                    ]}
                  >
                    {preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Step Goal */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Daily Step Goal</Text>
            <View style={[styles.inputContainer, errors.steps && styles.inputContainerError]}>
              <Ionicons name="footsteps-outline" size={20} color={colors.steps} />
              <TextInput
                style={styles.input}
                value={stepGoal}
                onChangeText={onStepGoalChange}
                placeholder="10000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Text style={styles.inputSuffix}>steps</Text>
            </View>
            {errors.steps && <Text style={styles.errorText}>{errors.steps}</Text>}

            <View style={styles.presetsContainer}>
              {STEP_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    stepGoal === preset.toString() && styles.presetChipActive,
                  ]}
                  onPress={() => handleStepPreset(preset)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetText,
                      stepGoal === preset.toString() && styles.presetTextActive,
                    ]}
                  >
                    {preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
    fontSize: typography.size.base,
    color: colors.text,
    paddingVertical: spacing.md,
    outlineStyle: 'none',
  } as any,
  inputSuffix: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    fontWeight: typography.weight.medium,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  presetChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
  },
  presetChipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  presetText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  presetTextActive: {
    color: colors.primary,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

export default GoalsStep;
