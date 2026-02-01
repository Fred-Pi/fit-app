import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FoodPreset, Meal } from '../types';
import { generateId } from '../services/storage';
import { successHaptic, lightHaptic } from '../utils/haptics';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import ModalHeader from './ModalHeader';
import ResponsiveModal from './ResponsiveModal';
import { modalStyles } from '../styles/modalStyles';

interface LogPresetModalProps {
  visible: boolean;
  onClose: () => void;
  onLog: (meal: Meal) => void;
  preset: FoodPreset | null;
}

const MULTIPLIER_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

const LogPresetModal: React.FC<LogPresetModalProps> = ({
  visible,
  onClose,
  onLog,
  preset,
}) => {
  const [multiplier, setMultiplier] = useState(1);

  // Reset multiplier when modal opens with a new preset
  useEffect(() => {
    if (visible) {
      setMultiplier(1);
    }
  }, [visible, preset?.id]);

  const calculatedNutrition = useMemo(() => {
    if (!preset) return null;
    return {
      servingSize: Math.round(preset.servingSize * multiplier * 10) / 10,
      calories: Math.round(preset.calories * multiplier),
      protein: Math.round(preset.protein * multiplier * 10) / 10,
      carbs: Math.round(preset.carbs * multiplier * 10) / 10,
      fats: Math.round(preset.fats * multiplier * 10) / 10,
    };
  }, [preset, multiplier]);

  const handleLog = () => {
    if (!preset || !calculatedNutrition) return;

    const meal: Meal = {
      id: generateId(),
      name: preset.name,
      calories: calculatedNutrition.calories,
      protein: calculatedNutrition.protein,
      carbs: calculatedNutrition.carbs,
      fats: calculatedNutrition.fats,
      time: new Date().toISOString(),
      presetId: preset.id,
      servingMultiplier: multiplier,
    };

    successHaptic();
    onLog(meal);
    onClose();
  };

  const handleMultiplierChange = (value: number) => {
    lightHaptic();
    setMultiplier(value);
  };

  const handleIncrement = () => {
    lightHaptic();
    setMultiplier((prev) => Math.min(prev + 0.5, 10));
  };

  const handleDecrement = () => {
    lightHaptic();
    setMultiplier((prev) => Math.max(prev - 0.5, 0.5));
  };

  if (!preset) return null;

  return (
    <ResponsiveModal visible={visible} onClose={onClose} size="md">
      <View style={styles.container}>
        <ModalHeader
          title="Log Meal"
          onCancel={onClose}
          onSave={handleLog}
          saveText="Add to Today"
        />

        <ScrollView
          style={modalStyles.content}
          contentContainerStyle={modalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Preset Header */}
          <View style={styles.presetCard}>
            <LinearGradient
              colors={[colors.nutritionLight, colors.nutrition]}
              style={styles.presetIcon}
            >
              <Ionicons name="restaurant" size={24} color={colors.text} />
            </LinearGradient>
            <View style={styles.presetInfo}>
              <Text style={styles.presetName}>{preset.name}</Text>
              <Text style={styles.presetServing}>
                Base: {preset.servingSize} {preset.servingUnit}
              </Text>
            </View>
          </View>

          {/* Multiplier Selector */}
          <View style={styles.multiplierCard}>
            <Text style={styles.multiplierLabel}>Serving Size</Text>

            <View style={styles.multiplierRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.multiplierButton,
                  pressed && styles.multiplierButtonPressed,
                ]}
                onPress={handleDecrement}
              >
                <Ionicons name="remove" size={24} color={colors.text} />
              </Pressable>

              <View style={styles.multiplierDisplay}>
                <Text style={styles.multiplierValue}>{multiplier}x</Text>
                <Text style={styles.multiplierSubtext}>
                  {calculatedNutrition?.servingSize} {preset.servingUnit}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.multiplierButton,
                  pressed && styles.multiplierButtonPressed,
                ]}
                onPress={handleIncrement}
              >
                <Ionicons name="add" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Quick Select Options */}
            <View style={styles.quickOptions}>
              {MULTIPLIER_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.quickOption,
                    multiplier === option.value && styles.quickOptionSelected,
                  ]}
                  onPress={() => handleMultiplierChange(option.value)}
                >
                  <Text
                    style={[
                      styles.quickOptionText,
                      multiplier === option.value && styles.quickOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Nutrition Summary */}
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>Nutrition</Text>

            {/* Calories */}
            <View style={styles.calorieRow}>
              <LinearGradient
                colors={[colors.primaryLight, colors.primary]}
                style={styles.calorieIcon}
              >
                <Ionicons name="flame" size={20} color={colors.text} />
              </LinearGradient>
              <Text style={styles.calorieLabel}>Calories</Text>
              <Text style={styles.calorieValue}>
                {calculatedNutrition?.calories}
              </Text>
            </View>

            {/* Macros */}
            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <View style={[styles.macroBar, { backgroundColor: colors.primary }]} />
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{calculatedNutrition?.protein}g</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroBar, { backgroundColor: colors.warning }]} />
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{calculatedNutrition?.carbs}g</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroBar, { backgroundColor: colors.nutrition }]} />
                <Text style={styles.macroLabel}>Fats</Text>
                <Text style={styles.macroValue}>{calculatedNutrition?.fats}g</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: glass.border,
    ...shadows.sm,
  },
  presetIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold as '600',
    color: colors.text,
    marginBottom: 4,
  },
  presetServing: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  multiplierCard: {
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: glass.border,
    ...shadows.sm,
  },
  multiplierLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold as '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  multiplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  multiplierButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: glass.background,
    borderWidth: 1,
    borderColor: glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplierButtonPressed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  multiplierDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  multiplierValue: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold as '700',
    color: colors.text,
  },
  multiplierSubtext: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: glass.background,
    borderWidth: 1,
    borderColor: glass.border,
    alignItems: 'center',
  },
  quickOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickOptionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium as '500',
    color: colors.textSecondary,
  },
  quickOptionTextSelected: {
    color: colors.text,
  },
  nutritionCard: {
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: glass.border,
    ...shadows.sm,
  },
  nutritionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold as '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  calorieIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieLabel: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text,
  },
  calorieValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold as '700',
    color: colors.primary,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  macroBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.xs,
  },
  macroLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
  macroValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold as '600',
    color: colors.text,
  },
});

export default LogPresetModal;
