/**
 * MealDetailPanel
 *
 * A standalone panel component for displaying meal details.
 * Used in desktop master-detail layouts where navigation is not needed.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from './GlassCard';
import ConfirmDialog from './ConfirmDialog';
import { Meal } from '../types';
import { colors, glass, spacing, typography, radius } from '../utils/theme';
import { useUIStore, useNutritionStore } from '../stores';
import { lightHaptic, warningHaptic } from '../utils/haptics';
import { formatNumber } from '../utils/formatters';

interface MealDetailPanelProps {
  mealId: string;
  onClose?: () => void;
  onDeleted?: () => void;
}

const MealDetailPanel: React.FC<MealDetailPanelProps> = ({
  mealId,
  onClose,
  onDeleted,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const openEditMeal = useUIStore((s) => s.openEditMeal);
  const selectMeal = useUIStore((s) => s.selectMeal);

  const todayNutrition = useNutritionStore((s) => s.todayNutrition);
  const deleteMeal = useNutritionStore((s) => s.deleteMeal);

  // Find the meal in today's nutrition
  const meal = todayNutrition?.meals.find((m) => m.id === mealId) || null;

  const handleEdit = () => {
    if (!meal) return;
    lightHaptic();
    openEditMeal(meal);
  };

  const handleDelete = async () => {
    warningHaptic();
    await deleteMeal(mealId);
    setShowDeleteDialog(false);
    selectMeal(null);
    onDeleted?.();
  };

  if (!meal) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="restaurant-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Meal not found</Text>
      </View>
    );
  }

  const formattedTime = new Date(meal.time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formattedDate = new Date(meal.time).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Close button for panel */}
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header Card */}
        <GlassCard accent="rose" glowIntensity="medium">
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <LinearGradient
                  colors={[colors.nutritionLight, colors.nutrition]}
                  style={styles.iconGradient}
                >
                  <Ionicons name="restaurant" size={24} color={colors.text} />
                </LinearGradient>
                <View style={styles.headerText}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.mealTime}>{formattedTime}</Text>
                    <Text style={styles.mealDate}>{formattedDate}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleEdit}
                accessibilityLabel="Edit meal"
              >
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => { lightHaptic(); setShowDeleteDialog(true); }}
                accessibilityLabel="Delete meal"
              >
                <Ionicons name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Calories Highlight */}
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesValue}>{formatNumber(meal.calories)}</Text>
            <Text style={styles.caloriesUnit}>calories</Text>
          </View>
        </GlassCard>

        {/* Macros Card */}
        <GlassCard accent="none" glowIntensity="none">
          <View style={styles.macrosHeader}>
            <Ionicons name="pie-chart-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.macrosTitle}>Macronutrients</Text>
          </View>

          <View style={styles.macrosGrid}>
            <MacroCard
              label="Protein"
              value={meal.protein}
              icon="egg"
              color={colors.primary}
            />
            <MacroCard
              label="Carbs"
              value={meal.carbs}
              icon="leaf"
              color={colors.warning}
            />
            <MacroCard
              label="Fats"
              value={meal.fats}
              icon="water"
              color={colors.nutrition}
            />
          </View>

          {/* Macro Breakdown Bar */}
          <View style={styles.macroBarContainer}>
            <Text style={styles.macroBarLabel}>Macro Distribution</Text>
            <MacroBar
              protein={meal.protein}
              carbs={meal.carbs}
              fats={meal.fats}
            />
          </View>
        </GlassCard>

        {/* Caloric Breakdown */}
        <GlassCard accent="none" glowIntensity="none">
          <View style={styles.breakdownHeader}>
            <Ionicons name="calculator-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.breakdownTitle}>Caloric Breakdown</Text>
          </View>

          <View style={styles.breakdownItems}>
            <BreakdownItem
              label="Protein"
              grams={meal.protein}
              caloriesPerGram={4}
              color={colors.primary}
            />
            <BreakdownItem
              label="Carbs"
              grams={meal.carbs}
              caloriesPerGram={4}
              color={colors.warning}
            />
            <BreakdownItem
              label="Fats"
              grams={meal.fats}
              caloriesPerGram={9}
              color={colors.nutrition}
            />
          </View>

          <View style={styles.breakdownTotal}>
            <Text style={styles.breakdownTotalLabel}>Calculated Total</Text>
            <Text style={styles.breakdownTotalValue}>
              {formatNumber(meal.protein * 4 + meal.carbs * 4 + meal.fats * 9)} cal
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Meal?"
        message={`Are you sure you want to delete "${meal.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        icon="restaurant"
        iconColor={colors.error}
      />
    </View>
  );
};

// Macro Card Component
const MacroCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) => (
  <View style={styles.macroCard}>
    <View style={[styles.macroIconBg, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.macroValue}>{formatNumber(value)}g</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

// Macro Distribution Bar
const MacroBar = ({
  protein,
  carbs,
  fats,
}: {
  protein: number;
  carbs: number;
  fats: number;
}) => {
  const total = protein + carbs + fats;
  if (total === 0) return null;

  const proteinPct = (protein / total) * 100;
  const carbsPct = (carbs / total) * 100;
  const fatsPct = (fats / total) * 100;

  return (
    <View style={styles.macroBarWrapper}>
      <View style={styles.macroBar}>
        <View style={[styles.macroBarSegment, { width: `${proteinPct}%`, backgroundColor: colors.primary }]} />
        <View style={[styles.macroBarSegment, { width: `${carbsPct}%`, backgroundColor: colors.warning }]} />
        <View style={[styles.macroBarSegment, { width: `${fatsPct}%`, backgroundColor: colors.nutrition }]} />
      </View>
      <View style={styles.macroBarLegend}>
        <View style={styles.macroBarLegendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>{Math.round(proteinPct)}% P</Text>
        </View>
        <View style={styles.macroBarLegendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>{Math.round(carbsPct)}% C</Text>
        </View>
        <View style={styles.macroBarLegendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.nutrition }]} />
          <Text style={styles.legendText}>{Math.round(fatsPct)}% F</Text>
        </View>
      </View>
    </View>
  );
};

// Breakdown Item Component
const BreakdownItem = ({
  label,
  grams,
  caloriesPerGram,
  color,
}: {
  label: string;
  grams: number;
  caloriesPerGram: number;
  color: string;
}) => {
  const calories = grams * caloriesPerGram;
  return (
    <View style={styles.breakdownItem}>
      <View style={styles.breakdownItemLeft}>
        <View style={[styles.breakdownDot, { backgroundColor: color }]} />
        <Text style={styles.breakdownItemLabel}>{label}</Text>
      </View>
      <View style={styles.breakdownItemRight}>
        <Text style={styles.breakdownItemGrams}>{formatNumber(grams)}g</Text>
        <Text style={styles.breakdownItemCalc}>x {caloriesPerGram}</Text>
        <Text style={styles.breakdownItemCals}>{formatNumber(calories)} cal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: glass.backgroundLight,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  headerText: {
    flex: 1,
  },
  mealName: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  mealTime: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  mealDate: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: glass.backgroundLight,
  },

  // Calories
  caloriesContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  caloriesValue: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
    color: colors.nutrition,
  },
  caloriesUnit: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
    marginTop: spacing.xs,
  },

  // Macros Card
  macrosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  macrosTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
  },
  macroIconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  macroValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  macroLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Macro Bar
  macroBarContainer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  macroBarLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  macroBarWrapper: {
    gap: spacing.sm,
  },
  macroBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: glass.background,
  },
  macroBarSegment: {
    height: '100%',
  },
  macroBarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  macroBarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },

  // Breakdown Card
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  breakdownTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  breakdownItems: {
    gap: spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.md,
  },
  breakdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownItemLabel: {
    fontSize: typography.size.base,
    color: colors.text,
  },
  breakdownItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  breakdownItemGrams: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
  breakdownItemCalc: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
  },
  breakdownItemCals: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    minWidth: 60,
    textAlign: 'right',
  },
  breakdownTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  breakdownTotalLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  breakdownTotalValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.nutrition,
  },
});

export default MealDetailPanel;
