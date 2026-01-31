/**
 * SetRow - Individual set row with checkbox, reps, and weight inputs
 *
 * Used in ActiveExerciseCard for set-level workout tracking.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActiveSetLog } from '../stores/activeWorkoutStore';
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import { lightHaptic } from '../utils/haptics';

interface SetRowProps {
  setNumber: number;
  set: ActiveSetLog;
  weightUnit: 'kg' | 'lbs';
  previousSet?: { reps: number; weight: number };
  onUpdate: (data: Partial<ActiveSetLog>) => void;
  onComplete: () => void;
  onRemove: () => void;
  isLastSet?: boolean;
}

const SetRow: React.FC<SetRowProps> = ({
  setNumber,
  set,
  weightUnit,
  previousSet,
  onUpdate,
  onComplete,
  onRemove,
  isLastSet = false,
}) => {
  const [repsValue, setRepsValue] = useState(set.reps.toString());
  const [weightValue, setWeightValue] = useState(set.weight.toString());

  const handleRepsChange = (text: string) => {
    setRepsValue(text);
    const num = parseInt(text) || 0;
    if (num !== set.reps) {
      onUpdate({ reps: num });
    }
  };

  const handleWeightChange = (text: string) => {
    setWeightValue(text);
    const num = parseFloat(text) || 0;
    if (num !== set.weight) {
      onUpdate({ weight: num });
    }
  };

  const handleRepsBlur = () => {
    const num = parseInt(repsValue) || 0;
    setRepsValue(num.toString());
    onUpdate({ reps: num });
  };

  const handleWeightBlur = () => {
    const num = parseFloat(weightValue) || 0;
    setWeightValue(num.toString());
    onUpdate({ weight: num });
  };

  const handleCheckboxPress = () => {
    if (!set.completed) {
      lightHaptic();
      onComplete();
    }
  };

  const handleRemove = () => {
    lightHaptic();
    onRemove();
  };

  return (
    <View style={[styles.container, set.completed && styles.containerCompleted]}>
      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, set.completed && styles.checkboxCompleted]}
        onPress={handleCheckboxPress}
        disabled={set.completed}
        activeOpacity={0.7}
      >
        {set.completed && (
          <Ionicons name="checkmark" size={18} color={colors.text} />
        )}
      </TouchableOpacity>

      {/* Set Number */}
      <View style={styles.setNumberContainer}>
        <Text style={[styles.setNumber, set.completed && styles.textCompleted]}>
          Set {setNumber}
        </Text>
      </View>

      {/* Reps Input */}
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, set.completed && styles.inputCompleted]}
          value={repsValue}
          onChangeText={handleRepsChange}
          onBlur={handleRepsBlur}
          keyboardType="number-pad"
          selectTextOnFocus
          editable={!set.completed}
          maxLength={3}
        />
        <Text style={[styles.inputLabel, set.completed && styles.textCompleted]}>
          reps
        </Text>
      </View>

      {/* Weight Input */}
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, styles.weightInput, set.completed && styles.inputCompleted]}
          value={weightValue}
          onChangeText={handleWeightChange}
          onBlur={handleWeightBlur}
          keyboardType="decimal-pad"
          selectTextOnFocus
          editable={!set.completed}
          maxLength={6}
        />
        <Text style={[styles.inputLabel, set.completed && styles.textCompleted]}>
          {weightUnit}
        </Text>
      </View>

      {/* Previous indicator or remove button */}
      {!set.completed && previousSet && (
        <View style={styles.previousHint}>
          <Ionicons name="arrow-back" size={12} color={colors.textTertiary} />
          <Text style={styles.previousText}>
            {previousSet.reps}×{previousSet.weight}
          </Text>
        </View>
      )}

      {/* Remove button - only show for incomplete sets */}
      {!set.completed && (
        <Pressable
          style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
          onPress={handleRemove}
        >
          <Ionicons name="close" size={16} color={colors.textTertiary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: glass.border,
    gap: spacing.sm,
  },
  containerCompleted: {
    backgroundColor: `${colors.success}10`,
    borderColor: `${colors.success}30`,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  setNumberContainer: {
    minWidth: 48,
  },
  setNumber: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  input: {
    width: 48,
    height: 36,
    backgroundColor: glass.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: glass.border,
    textAlign: 'center',
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    paddingHorizontal: spacing.xs,
  },
  weightInput: {
    width: 64,
  },
  inputCompleted: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: colors.success,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
  },
  previousHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm,
  },
  previousText: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
  },
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  removeButtonPressed: {
    opacity: 0.5,
  },
  textCompleted: {
    color: colors.success,
  },
});

export default SetRow;
