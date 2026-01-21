import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import WeeklyStatsCard from '../components/WeeklyStatsCard';
import WeightChart from '../components/WeightChart';
import StreakCard from '../components/StreakCard';
import WorkoutSuggestionsCard from '../components/WorkoutSuggestionsCard';
import { TodayScreenSkeleton } from '../components/SkeletonLoader';
import { calculateWorkoutSuggestions, SuggestionData } from '../utils/workoutSuggestions';
import { lightHaptic } from '../utils/haptics';
import { getTodayDate, generateId } from '../services/storage';
import { WorkoutLog, WorkoutTemplate } from '../types';
import { colors } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';
import {
  useUserStore,
  useUIStore,
  useWorkoutStore,
  useNutritionStore,
  useDailyTrackingStore,
} from '../stores';

const TodayScreen = () => {
  const { isDesktop, isTablet, contentMaxWidth } = useResponsive();
  const date = getTodayDate();

  // User Store
  const user = useUserStore((s) => s.user);

  // UI Store
  const openAddWorkout = useUIStore((s) => s.openAddWorkout);
  const openAddMeal = useUIStore((s) => s.openAddMeal);
  const openUpdateSteps = useUIStore((s) => s.openUpdateSteps);
  const openUpdateWeight = useUIStore((s) => s.openUpdateWeight);

  // Workout Store
  const workouts = useWorkoutStore((s) => s.workouts);
  const currentStreak = useWorkoutStore((s) => s.currentStreak);
  const longestStreak = useWorkoutStore((s) => s.longestStreak);
  const isWorkoutsLoading = useWorkoutStore((s) => s.isLoading);
  const isWorkoutsRefreshing = useWorkoutStore((s) => s.isRefreshing);
  const fetchWorkouts = useWorkoutStore((s) => s.fetchWorkouts);
  const getRecentWorkouts = useWorkoutStore((s) => s.getRecentWorkouts);
  const getTodayWorkout = useWorkoutStore((s) => s.getTodayWorkout);

  // Nutrition Store
  const todayNutrition = useNutritionStore((s) => s.todayNutrition);
  const fetchNutritionByDate = useNutritionStore((s) => s.fetchNutritionByDate);
  const getTotalCalories = useNutritionStore((s) => s.getTotalCalories);

  // Daily Tracking Store
  const todaySteps = useDailyTrackingStore((s) => s.todaySteps);
  const todayWeight = useDailyTrackingStore((s) => s.todayWeight);
  const recentWeights = useDailyTrackingStore((s) => s.recentWeights);
  const currentWeekStats = useDailyTrackingStore((s) => s.currentWeekStats);
  const previousWeekStats = useDailyTrackingStore((s) => s.previousWeekStats);
  const weekComparison = useDailyTrackingStore((s) => s.weekComparison);
  const fetchTodaySteps = useDailyTrackingStore((s) => s.fetchTodaySteps);
  const fetchTodayWeight = useDailyTrackingStore((s) => s.fetchTodayWeight);
  const fetchRecentWeights = useDailyTrackingStore((s) => s.fetchRecentWeights);
  const fetchWeeklyStats = useDailyTrackingStore((s) => s.fetchWeeklyStats);

  // Derived state
  const todayWorkout = getTodayWorkout(date);
  const recentWorkoutsForRepeat = getRecentWorkouts(3);
  const totalCalories = getTotalCalories();

  // Calculate suggestions from workouts
  const suggestions: SuggestionData | null = workouts.length > 0
    ? calculateWorkoutSuggestions(workouts)
    : null;

  // Load all data
  const loadData = useCallback(async () => {
    if (!user) return;

    await Promise.all([
      fetchWorkouts(),
      fetchNutritionByDate(date, user.id, user.dailyCalorieTarget),
      fetchTodaySteps(date, user.id, user.dailyStepGoal),
      fetchTodayWeight(date, user.id, user.preferredWeightUnit),
      fetchRecentWeights(date, 30),
      fetchWeeklyStats(user),
    ]);
  }, [user, date, fetchWorkouts, fetchNutritionByDate, fetchTodaySteps, fetchTodayWeight, fetchRecentWeights, fetchWeeklyStats]);

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

  // Refresh handler
  const onRefresh = useCallback(() => {
    fetchWorkouts(true); // Force refresh
    loadData();
  }, [fetchWorkouts, loadData]);

  // Helper functions
  const daysAgo = (dateStr: string): string => {
    const days = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const workoutToTemplate = (workout: WorkoutLog): WorkoutTemplate => ({
    id: generateId(),
    userId: workout.userId,
    name: workout.name,
    exercises: workout.exercises.map((ex, index) => ({
      id: generateId(),
      exerciseName: ex.exerciseName,
      targetSets: ex.sets.length,
      targetReps: ex.sets[0]?.reps || 10,
      targetWeight: ex.sets[0]?.weight || 0,
      order: index,
    })),
    created: new Date().toISOString(),
  });

  const handleQuickRepeat = (workoutToRepeat: WorkoutLog) => {
    const template = workoutToTemplate(workoutToRepeat);
    openAddWorkout(template);
  };

  // Loading state
  const isLoading = isWorkoutsLoading && !todayNutrition && !todaySteps;
  const isRefreshing = isWorkoutsRefreshing;

  if (isLoading) {
    return (
      <ScrollView style={styles.container}>
        <TodayScreenSkeleton />
      </ScrollView>
    );
  }

  const isWideScreen = isDesktop || isTablet;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary, colors.workout, colors.nutrition]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      {/* Weekly Stats Card */}
      {currentWeekStats && (
        <WeeklyStatsCard
          currentWeek={currentWeekStats}
          previousWeek={previousWeekStats || undefined}
          comparison={weekComparison || undefined}
        />
      )}

      {/* Streak Card */}
      <StreakCard
        currentStreak={currentStreak}
        longestStreak={longestStreak}
      />

      {/* Workout Suggestions Card */}
      {suggestions && suggestions.hasEnoughData && (
        <WorkoutSuggestionsCard suggestions={suggestions} />
      )}

      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>
          {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Cards Grid for tablet/desktop */}
      <View style={isWideScreen ? styles.cardsGrid : undefined}>
        {/* Workout Card */}
        <View style={isWideScreen ? styles.cardWrapper : undefined}>
          <Card gradient>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="barbell" size={24} color={colors.workout} />
                <Text style={styles.cardTitle}>Workout</Text>
              </View>
            </View>
            {todayWorkout ? (
              <View style={styles.workoutContent}>
                <Text style={styles.workoutName}>{todayWorkout.name}</Text>
                <Text style={styles.workoutDetails}>
                  {todayWorkout.exercises.length} exercises
                  {todayWorkout.duration && ` • ${Math.round(todayWorkout.duration)} min`}
                  {' • '}{todayWorkout.completed ? 'Completed' : 'In Progress'}
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    lightHaptic();
                    openAddWorkout();
                  }}
                >
                  <Text style={styles.addButtonText}>+ Log Workout</Text>
                </TouchableOpacity>
                {/* Quick Repeat Section */}
                {recentWorkoutsForRepeat.length > 0 && (
                  <View style={styles.quickRepeatSection}>
                    <Text style={styles.quickRepeatTitle}>Quick Repeat</Text>
                    {recentWorkoutsForRepeat.map(w => (
                      <TouchableOpacity
                        key={w.id}
                        style={styles.quickRepeatItem}
                        onPress={() => {
                          lightHaptic();
                          handleQuickRepeat(w);
                        }}
                      >
                        <Ionicons name="refresh" size={16} color={colors.primary} />
                        <View style={styles.quickRepeatInfo}>
                          <Text style={styles.quickRepeatName}>{w.name}</Text>
                          <Text style={styles.quickRepeatMeta}>
                            {w.exercises.length} exercises • {daysAgo(w.date)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </Card>
        </View>

        {/* Nutrition Card */}
        <View style={isWideScreen ? styles.cardWrapper : undefined}>
          <Card gradient>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="nutrition" size={24} color={colors.nutrition} />
                <Text style={styles.cardTitle}>Calories</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <ProgressBar
                current={totalCalories}
                target={todayNutrition?.calorieTarget || user?.dailyCalorieTarget || 2200}
                unit="cal"
                color={colors.nutrition}
              />
            </View>
            {todayNutrition && todayNutrition.meals.length > 0 ? (
              <View style={styles.mealsPreview}>
                <Text style={styles.mealsCount}>{todayNutrition.meals.length} meals logged</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  lightHaptic();
                  openAddMeal();
                }}
              >
                <Text style={styles.addButtonText}>+ Add Meal</Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        {/* Steps Card */}
        <View style={isWideScreen ? styles.cardWrapper : undefined}>
          <Card gradient>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="footsteps" size={24} color={colors.steps} />
                <Text style={styles.cardTitle}>Steps</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <ProgressBar
                current={todaySteps?.steps || 0}
                target={todaySteps?.stepGoal || user?.dailyStepGoal || 10000}
                unit="steps"
                color={colors.steps}
              />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                lightHaptic();
                openUpdateSteps();
              }}
            >
              <Text style={styles.addButtonText}>Update Steps</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Weight Card */}
        <View style={isWideScreen ? styles.cardWrapper : undefined}>
          <Card gradient>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="scale-outline" size={24} color={colors.gold} />
                <Text style={styles.cardTitle}>Body Weight</Text>
              </View>
            </View>
            {todayWeight && todayWeight.weight > 0 ? (
              <View>
                <View style={styles.weightDisplay}>
                  <Text style={styles.weightValue}>{todayWeight.weight.toFixed(1)}</Text>
                  <Text style={styles.weightUnit}>{todayWeight.unit}</Text>
                </View>
                <WeightChart weights={recentWeights} unit={todayWeight.unit} goalWeight={user?.goalWeight} />
              </View>
            ) : (
              <View style={styles.emptyWeightState}>
                <Text style={styles.emptyWeightText}>Track your weight to see trends</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                lightHaptic();
                openUpdateWeight();
              }}
            >
              <Text style={styles.addButtonText}>Update Weight</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  dateContainer: {
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  dateText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  workoutContent: {
    marginTop: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginBottom: 12,
  },
  mealsPreview: {
    marginTop: 8,
  },
  mealsCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: `${colors.primary}50`,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.gold,
    marginRight: 8,
  },
  weightUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyWeightState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyWeightText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
  },
  quickRepeatSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickRepeatTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickRepeatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  quickRepeatInfo: {
    flex: 1,
  },
  quickRepeatName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  quickRepeatMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default TodayScreen;
