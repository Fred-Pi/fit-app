import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import AnimatedNumber from '../components/AnimatedNumber';
import SwipeableRow from '../components/SwipeableRow';
import ExpandableFAB from '../components/ExpandableFAB';
import SelectionToolbar from '../components/SelectionToolbar';
import { CardSkeleton, ListSkeleton } from '../components/SkeletonLoader';
import { getTodayDate } from '../services/storage';
import { Meal } from '../types';
import { colors, glass, spacing, typography, radius } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';
import { formatNumber } from '../utils/formatters';
import { warningHaptic, lightHaptic } from '../utils/haptics';
import {
  useUserStore,
  useUIStore,
  useNutritionStore,
} from '../stores';

type NutritionVariant = 'full' | 'list';

interface NutritionScreenProps {
  variant?: NutritionVariant;
  onSelectMeal?: (mealId: string | null) => void;
  selectedMealId?: string | null;
}

const NutritionScreen: React.FC<NutritionScreenProps> = ({
  variant = 'full',
  onSelectMeal,
  selectedMealId,
}) => {
  const { contentMaxWidth } = useResponsive();
  const date = getTodayDate();

  // User Store
  const user = useUserStore((s) => s.user);

  // UI Store
  const openAddMeal = useUIStore((s) => s.openAddMeal);
  const openEditMeal = useUIStore((s) => s.openEditMeal);
  const openConfirmDialog = useUIStore((s) => s.openConfirmDialog);
  const selectedMealIds = useUIStore((s) => s.selectedMealIds);
  const toggleMealSelection = useUIStore((s) => s.toggleMealSelection);
  const selectAllMeals = useUIStore((s) => s.selectAllMeals);
  const clearMealSelection = useUIStore((s) => s.clearMealSelection);

  // Nutrition Store
  const todayNutrition = useNutritionStore((s) => s.todayNutrition);
  const isLoading = useNutritionStore((s) => s.isLoading);
  const fetchNutritionByDate = useNutritionStore((s) => s.fetchNutritionByDate);
  const deleteMeal = useNutritionStore((s) => s.deleteMeal);
  const deleteMultipleMeals = useNutritionStore((s) => s.deleteMultipleMeals);

  const isWeb = Platform.OS === 'web';
  const getTotalCalories = useNutritionStore((s) => s.getTotalCalories);
  const getTotalProtein = useNutritionStore((s) => s.getTotalProtein);
  const getTotalCarbs = useNutritionStore((s) => s.getTotalCarbs);
  const getTotalFats = useNutritionStore((s) => s.getTotalFats);

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;
    await fetchNutritionByDate(date, user.id, user.dailyCalorieTarget);
  }, [user, date, fetchNutritionByDate]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteMeal = (meal: Meal) => {
    warningHaptic();
    openConfirmDialog({
      title: 'Delete Meal?',
      message: `Are you sure you want to delete "${meal.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      icon: 'restaurant',
      iconColor: colors.error,
      onConfirm: async () => {
        await deleteMeal(meal.id);
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedMealIds.length === 0) return;
    warningHaptic();
    openConfirmDialog({
      title: `Delete ${selectedMealIds.length} Meal${selectedMealIds.length > 1 ? 's' : ''}?`,
      message: `Are you sure you want to delete ${selectedMealIds.length} meal${selectedMealIds.length > 1 ? 's' : ''}? This cannot be undone.`,
      confirmText: 'Delete All',
      icon: 'restaurant',
      iconColor: colors.error,
      onConfirm: async () => {
        await deleteMultipleMeals(selectedMealIds);
        clearMealSelection();
      },
    });
  };

  const handleCheckboxPress = (mealId: string) => {
    lightHaptic();
    toggleMealSelection(mealId);
  };

  const handleMealPress = (meal: Meal) => {
    if (onSelectMeal) {
      // Desktop master-detail mode
      onSelectMeal(meal.id);
    } else {
      // Mobile mode - open edit modal
      openEditMeal(meal);
    }
  };

  // List variant - compact meal list for master panel
  if (variant === 'list') {
    return (
      <View style={styles.listContainer}>
        {/* List Header */}
        <View style={styles.listHeader}>
          <View style={styles.listHeaderLeft}>
            <Ionicons name="restaurant" size={20} color={colors.nutrition} />
            <Text style={styles.listTitle}>Today's Meals</Text>
          </View>
          <TouchableOpacity
            style={styles.addButtonSmall}
            onPress={() => openAddMeal()}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Calorie Summary */}
        <View style={styles.listSummary}>
          <Text style={styles.listSummaryValue}>{formatNumber(getTotalCalories())}</Text>
          <Text style={styles.listSummaryLabel}>
            / {formatNumber(todayNutrition?.calorieTarget || user?.dailyCalorieTarget || 2200)} cal
          </Text>
        </View>

        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
          {isLoading && !todayNutrition ? (
            <ListSkeleton count={3} />
          ) : !todayNutrition?.meals.length ? (
            <View style={styles.listEmptyState}>
              <Ionicons name="restaurant-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.listEmptyText}>No meals logged</Text>
              <TouchableOpacity
                style={styles.listEmptyButton}
                onPress={() => openAddMeal()}
              >
                <Text style={styles.listEmptyButtonText}>Add Meal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todayNutrition.meals.map((meal) => {
              const isSelected = selectedMealId === meal.id;
              const isChecked = selectedMealIds.includes(meal.id);
              return (
                <View key={meal.id} style={styles.listItemRow}>
                  {/* Checkbox (web only) */}
                  {isWeb && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.checkbox,
                        isChecked && styles.checkboxChecked,
                        pressed && styles.checkboxPressed,
                      ]}
                      onPress={() => handleCheckboxPress(meal.id)}
                    >
                      {isChecked && (
                        <Ionicons name="checkmark" size={14} color={colors.text} />
                      )}
                    </Pressable>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.listItem,
                      isSelected && styles.listItemSelected,
                      isWeb && styles.listItemWithCheckbox,
                    ]}
                    onPress={() => handleMealPress(meal)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemName} numberOfLines={1}>
                        {meal.name}
                      </Text>
                      <Text style={styles.listItemTime}>
                        {new Date(meal.time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemCalories}>{formatNumber(meal.calories)}</Text>
                      <Text style={styles.listItemCaloriesUnit}>cal</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Multi-select toolbar (web only) */}
        <SelectionToolbar
          selectedCount={selectedMealIds.length}
          totalCount={todayNutrition?.meals.length || 0}
          onSelectAll={() => selectAllMeals(todayNutrition?.meals.map((m) => m.id) || [])}
          onClear={clearMealSelection}
          onDelete={handleBatchDelete}
          itemLabel="meal"
        />
      </View>
    );
  }

  if (isLoading && !todayNutrition) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <CardSkeleton />
          <View style={{ marginTop: 24 }}>
            <ListSkeleton count={3} />
          </View>
        </View>
      </View>
    );
  }

  const totalCalories = getTotalCalories();
  const totalProtein = getTotalProtein();
  const totalCarbs = getTotalCarbs();
  const totalFats = getTotalFats();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[
        styles.contentContainer,
        { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingBottom: 120 }
      ]}>
        {/* Daily Summary */}
        <GlassCard accent="rose" glowIntensity="medium">
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[colors.nutritionLight, colors.nutrition]}
              style={styles.iconGradient}
            >
              <Ionicons name="flame" size={22} color={colors.text} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Today's Summary</Text>
          </View>

          <View style={styles.summaryContainer}>
            <AnimatedProgressBar
              current={totalCalories}
              target={todayNutrition?.calorieTarget || user?.dailyCalorieTarget || 2200}
              unit="cal"
              theme="rose"
            />
          </View>

          <View style={styles.macrosContainer}>
            <MacroItem
              value={totalProtein}
              label="Protein"
              color={colors.primary}
              icon="egg"
            />
            <View style={styles.macroDivider} />
            <MacroItem
              value={totalCarbs}
              label="Carbs"
              color={colors.warning}
              icon="leaf"
            />
            <View style={styles.macroDivider} />
            <MacroItem
              value={totalFats}
              label="Fats"
              color={colors.nutrition}
              icon="water"
            />
          </View>
        </GlassCard>

        {/* Meals List */}
        <View style={styles.mealsHeader}>
          <Text style={styles.mealsTitle}>Meals</Text>
          <Text style={styles.mealCount}>
            {todayNutrition?.meals.length || 0} logged
          </Text>
        </View>

        {!todayNutrition?.meals.length ? (
          <GlassCard accent="none" glowIntensity="none">
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={[colors.nutritionMuted, 'transparent']}
                style={styles.emptyIconBg}
              >
                <Ionicons name="restaurant-outline" size={40} color={colors.textTertiary} />
              </LinearGradient>
              <Text style={styles.emptyText}>No meals logged today</Text>
              <Text style={styles.emptySubtext}>Tap the button below to add your first meal</Text>
              <View style={styles.emptyButtonContainer}>
                <GlassButton
                  title="Add First Meal"
                  icon="add"
                  onPress={() => openAddMeal()}
                  variant="primary"
                />
              </View>
            </View>
          </GlassCard>
        ) : (
          todayNutrition.meals.map((meal, index) => (
            <SwipeableRow
              key={meal.id}
              onEdit={() => openEditMeal(meal)}
              onDelete={() => handleDeleteMeal(meal)}
            >
              <GlassCard
                accent="none"
                glowIntensity="none"
                style={styles.mealCard}
              >
                <View style={styles.mealHeader}>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <View style={styles.mealTimeContainer}>
                      <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                      <Text style={styles.mealTime}>
                        {new Date(meal.time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.mealCaloriesBadge}>
                    <Text style={styles.mealCalories}>{formatNumber(meal.calories)}</Text>
                    <Text style={styles.mealCaloriesUnit}>cal</Text>
                  </View>
                </View>
                <View style={styles.mealMacros}>
                  <View style={styles.mealMacroPill}>
                    <Text style={styles.mealMacroValue}>{formatNumber(meal.protein)}g</Text>
                    <Text style={styles.mealMacroLabel}>protein</Text>
                  </View>
                  <View style={styles.mealMacroPill}>
                    <Text style={styles.mealMacroValue}>{formatNumber(meal.carbs)}g</Text>
                    <Text style={styles.mealMacroLabel}>carbs</Text>
                  </View>
                  <View style={styles.mealMacroPill}>
                    <Text style={styles.mealMacroValue}>{formatNumber(meal.fats)}g</Text>
                    <Text style={styles.mealMacroLabel}>fats</Text>
                  </View>
                </View>
              </GlassCard>
            </SwipeableRow>
          ))
        )}
      </ScrollView>

      <ExpandableFAB
        mainColor={colors.nutrition}
        actions={[
          {
            icon: 'restaurant',
            label: 'Add Meal',
            onPress: () => openAddMeal(),
            color: colors.nutrition,
          },
        ]}
      />
    </View>
  );
};

// Macro Item Component
const MacroItem = ({ value, label, color, icon }: {
  value: number;
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) => (
  <View style={styles.macroItem}>
    <View style={[styles.macroIconBg, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <AnimatedNumber
      value={value}
      decimals={0}
      suffix="g"
      size="md"
      color={colors.text}
    />
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  sectionTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: 0.2,
  },
  summaryContainer: {
    marginBottom: spacing.xl,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroIconBg: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  macroLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  macroDivider: {
    width: 1,
    height: 50,
    backgroundColor: glass.border,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  mealsTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  mealCount: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.size.lg,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyButtonContainer: {
    marginTop: spacing.xl,
  },
  mealCard: {
    marginBottom: spacing.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    letterSpacing: 0.2,
  },
  mealTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  mealTime: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
  },
  mealCaloriesBadge: {
    backgroundColor: colors.nutritionMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  mealCalories: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.nutrition,
  },
  mealCaloriesUnit: {
    fontSize: typography.size.xs,
    color: colors.nutrition,
    marginTop: -2,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealMacroPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: glass.backgroundLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  mealMacroValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  mealMacroLabel: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
  },

  // List variant styles
  listContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  addButtonSmall: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.nutrition,
  },
  listSummary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: glass.backgroundLight,
  },
  listSummaryValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.nutrition,
  },
  listSummaryLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  listScroll: {
    flex: 1,
  },
  listEmptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  listEmptyText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listEmptyButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.nutrition,
    borderRadius: radius.md,
  },
  listEmptyButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    marginLeft: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  checkboxChecked: {
    backgroundColor: colors.nutrition,
    borderColor: colors.nutrition,
  },
  checkboxPressed: {
    opacity: 0.7,
  },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  listItemWithCheckbox: {
    paddingLeft: spacing.md,
  },
  listItemSelected: {
    backgroundColor: colors.nutritionMuted,
    borderLeftWidth: 3,
    borderLeftColor: colors.nutrition,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  listItemTime: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemCalories: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.nutrition,
  },
  listItemCaloriesUnit: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
  },
});

export default NutritionScreen;
