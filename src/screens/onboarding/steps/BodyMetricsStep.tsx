import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../components/GlassCard';
import FormRow from '../../../components/FormRow';
import UnitToggle from '../components/UnitToggle';
import { colors, glass, spacing, typography, radius } from '../../../utils/theme';
import { feetToCm, cmToFeet, lbsToKg, kgToLbs } from '../../../utils/bmiCalculator';

interface BodyMetricsStepProps {
  age: string;
  onAgeChange: (age: string) => void;
  heightCm: number;
  onHeightChange: (heightCm: number) => void;
  heightUnit: 'cm' | 'ft';
  onHeightUnitChange: (unit: 'cm' | 'ft') => void;
  weightKg: number;
  onWeightChange: (weightKg: number) => void;
  weightUnit: 'kg' | 'lbs';
  onWeightUnitChange: (unit: 'kg' | 'lbs') => void;
  errors: {
    age?: string;
    height?: string;
    weight?: string;
  };
}

const BodyMetricsStep: React.FC<BodyMetricsStepProps> = ({
  age,
  onAgeChange,
  heightCm,
  onHeightChange,
  heightUnit,
  onHeightUnitChange,
  weightKg,
  onWeightChange,
  weightUnit,
  onWeightUnitChange,
  errors,
}) => {
  // Local display values for height
  const [heightDisplay, setHeightDisplay] = useState('');
  const [feetDisplay, setFeetDisplay] = useState('');
  const [inchesDisplay, setInchesDisplay] = useState('');

  // Local display value for weight
  const [weightDisplay, setWeightDisplay] = useState('');

  // Initialize display values
  useEffect(() => {
    if (heightCm > 0) {
      if (heightUnit === 'cm') {
        setHeightDisplay(Math.round(heightCm).toString());
      } else {
        const { feet, inches } = cmToFeet(heightCm);
        setFeetDisplay(feet.toString());
        setInchesDisplay(inches.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heightUnit]);

  useEffect(() => {
    if (weightKg > 0) {
      if (weightUnit === 'kg') {
        setWeightDisplay(Math.round(weightKg * 10) / 10 + '');
      } else {
        setWeightDisplay(Math.round(kgToLbs(weightKg) * 10) / 10 + '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightUnit]);

  const handleHeightCmChange = (text: string) => {
    setHeightDisplay(text);
    const value = parseFloat(text);
    if (!isNaN(value)) {
      onHeightChange(value);
    } else if (text === '') {
      onHeightChange(0);
    }
  };

  const handleFeetChange = (text: string) => {
    setFeetDisplay(text);
    const feet = parseInt(text) || 0;
    const inches = parseInt(inchesDisplay) || 0;
    onHeightChange(feetToCm(feet, inches));
  };

  const handleInchesChange = (text: string) => {
    setInchesDisplay(text);
    const feet = parseInt(feetDisplay) || 0;
    const inches = parseInt(text) || 0;
    onHeightChange(feetToCm(feet, inches));
  };

  const handleWeightChange = (text: string) => {
    setWeightDisplay(text);
    const value = parseFloat(text);
    if (!isNaN(value)) {
      if (weightUnit === 'kg') {
        onWeightChange(value);
      } else {
        onWeightChange(lbsToKg(value));
      }
    } else if (text === '') {
      onWeightChange(0);
    }
  };

  const handleHeightUnitChange = (unit: 'cm' | 'ft') => {
    if (unit === 'cm' && heightCm > 0) {
      setHeightDisplay(Math.round(heightCm).toString());
    } else if (unit === 'ft' && heightCm > 0) {
      const { feet, inches } = cmToFeet(heightCm);
      setFeetDisplay(feet.toString());
      setInchesDisplay(inches.toString());
    }
    onHeightUnitChange(unit);
  };

  const handleWeightUnitChange = (unit: 'kg' | 'lbs') => {
    if (weightKg > 0) {
      if (unit === 'kg') {
        setWeightDisplay((Math.round(weightKg * 10) / 10).toString());
      } else {
        setWeightDisplay((Math.round(kgToLbs(weightKg) * 10) / 10).toString());
      }
    }
    onWeightUnitChange(unit);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>About You</Text>
      <Text style={styles.subtitle}>This helps us calculate your fitness metrics</Text>

      <View style={styles.formContainer}>
        <GlassCard accent="none" glowIntensity="none" padding="lg">
          {/* Age Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <View style={[styles.inputContainer, errors.age && styles.inputContainerError]}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={onAgeChange}
                placeholder="25"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.inputSuffix}>years</Text>
            </View>
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>

          {/* Height + Weight - side by side on desktop */}
          <FormRow gap={spacing.lg}>
            {/* Height Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Height</Text>
                <UnitToggle
                  value={heightUnit}
                  options={[
                    { value: 'cm', label: 'cm' },
                    { value: 'ft', label: 'ft' },
                  ]}
                  onChange={handleHeightUnitChange}
                />
              </View>
              {heightUnit === 'cm' ? (
                <View style={[styles.inputContainer, errors.height && styles.inputContainerError]}>
                  <Ionicons name="resize-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={heightDisplay}
                    onChangeText={handleHeightCmChange}
                    placeholder="170"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={styles.inputSuffix}>cm</Text>
                </View>
              ) : (
                <View style={styles.feetInputRow}>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.feetInput,
                      errors.height && styles.inputContainerError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      value={feetDisplay}
                      onChangeText={handleFeetChange}
                      placeholder="5"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      maxLength={1}
                    />
                    <Text style={styles.inputSuffix}>ft</Text>
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.feetInput,
                      errors.height && styles.inputContainerError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      value={inchesDisplay}
                      onChangeText={handleInchesChange}
                      placeholder="10"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.inputSuffix}>in</Text>
                  </View>
                </View>
              )}
              {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
            </View>

            {/* Weight Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Weight</Text>
                <UnitToggle
                  value={weightUnit}
                  options={[
                    { value: 'kg', label: 'kg' },
                    { value: 'lbs', label: 'lbs' },
                  ]}
                  onChange={handleWeightUnitChange}
                />
              </View>
              <View style={[styles.inputContainer, errors.weight && styles.inputContainerError]}>
                <Ionicons name="scale-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={weightDisplay}
                  onChangeText={handleWeightChange}
                  placeholder={weightUnit === 'kg' ? '70' : '154'}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                <Text style={styles.inputSuffix}>{weightUnit}</Text>
              </View>
              {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
            </View>
          </FormRow>
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
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
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
  } as Record<string, unknown>,
  inputSuffix: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    fontWeight: typography.weight.medium,
  },
  feetInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  feetInput: {
    flex: 1,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

export default BodyMetricsStep;
