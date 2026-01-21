import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import SwipeableRow from '../components/SwipeableRow';
import ExpandableFAB from '../components/ExpandableFAB';
import { CardSkeleton, ListSkeleton } from '../components/SkeletonLoader';
import { getTodayDate } from '../services/storage';
import { Meal } from '../types';
import { colors } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';
import { formatNumber } from '../utils/formatters';
import { warningHaptic } from '../utils/haptics';
import {
  useUserStore,
  useUIStore,
  useNutritionStore,
} from '../stores';

const NutritionScreen = () => {
  const { contentMaxWidth } = useResponsive();
  const date = getTodayDate();

  // User Store
  const user = useUserStore((s) => s.user);

  // UI Store
  const openAddMeal = useUIStore((s) => s.openAddMeal);
  const openEditMeal = useUIStore((s) => s.openEditMeal);
  const openConfirmDialog = useUIStore((s) => s.openConfirmDialog);

  // Nutrition Store
  const todayNutrition = useNutritionStore((s) => s.todayNutrition);
  const isLoading = useNutritionStore((s) => s.isLoading);
  const fetchNutritionByDate = useNutritionStore((s) => s.fetchNutritionByDate);
  const deleteMeal = useNutritionStore((s) => s.deleteMeal);
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
      iconColor: '#FF3B30',
      onConfirm: async () => {
        await deleteMeal(meal.id);
      },
    });
  };

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
        { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
      ]}>
        {/* Daily Summary */}
        <Card>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryContainer}>
            <ProgressBar
              current={totalCalories}
              target={todayNutrition?.calorieTarget || user?.dailyCalorieTarget || 2200}
              unit="cal"
              color="#FF6B6B"
            />
          </View>
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{formatNumber(Math.round(totalProtein))}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{formatNumber(Math.round(totalCarbs))}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{formatNumber(Math.round(totalFats))}g</Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>
        </Card>

        {/* Meals List */}
        <View style={styles.mealsHeader}>
          <Text style={styles.mealsTitle}>Meals</Text>
        </View>

        {!todayNutrition?.meals.length ? (
          <Card>
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No meals logged today</Text>
            </View>
          </Card>
        ) : (
          todayNutrition.meals.map((meal) => (
            <SwipeableRow
              key={meal.id}
              onEdit={() => {
                openEditMeal(meal);
              }}
              onDelete={() => handleDeleteMeal(meal)}
            >
              <Card>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealTime}>
                    {new Date(meal.time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.mealMacros}>
                  <Text style={styles.mealCalories}>{formatNumber(meal.calories)} cal</Text>
                  <Text style={styles.mealMacroDetail}>
                    P: {formatNumber(meal.protein)}g • C: {formatNumber(meal.carbs)}g • F: {formatNumber(meal.fats)}g
                  </Text>
                </View>
              </Card>
            </SwipeableRow>
          ))
        )}
      </ScrollView>

      <ExpandableFAB
        mainColor="#FF6B6B"
        actions={[
          {
            icon: 'restaurant',
            label: 'Add Meal',
            onPress: () => openAddMeal(),
            color: '#FF6B6B',
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  mealsHeader: {
    marginVertical: 16,
  },
  mealsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 17,
    color: colors.textSecondary,
    marginTop: 16,
    fontWeight: '500',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  mealTime: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  mealMacros: {
    marginTop: 4,
  },
  mealCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  mealMacroDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default NutritionScreen;
