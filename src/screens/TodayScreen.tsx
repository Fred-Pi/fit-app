import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import AnimatedNumber from '../components/AnimatedNumber';
import WeeklyStatsCard from '../components/WeeklyStatsCard';
import WeightChart from '../components/WeightChart';
import StreakCard from '../components/StreakCard';
import WorkoutSuggestionsCard from '../components/WorkoutSuggestionsCard';
import { TodayScreenSkeleton } from '../components/SkeletonLoader';
import { calculateWorkoutSuggestions, SuggestionData } from '../utils/workoutSuggestions';
import { lightHaptic } from '../utils/haptics';
import { getTodayDate, generateId } from '../services/storage';
import { WorkoutLog, WorkoutTemplate } from '../types';
import { colors, glass, spacing, typography, radius } from '../utils/theme';
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
        { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingBottom: 120 }
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
      {/* Greeting Header */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
        </Text>
        <Text style={styles.dateText}>
          {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

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

      {/* Cards Grid for tablet/desktop */}
      <View style={isWideScreen ? styles.cardsGrid : undefined}>
        {/* Workout Card */}
        <View style={isWideScreen ? styles.cardWrapper : undefined}>
          <GlassCard accent="blue" glowIntensity={todayWorkout ? 'medium' : 'subtle'}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <LinearGradient
                  colors={[colors.workoutLight, colors.workout]}
                  style={styles.iconGradient}
                >
                  <Ionicons name="barbell" size={20} color={colors.text} />
                </LinearGradient>
              </View>
              <Text style={styles.cardTitle}>Workout</Text>
            </View>
            {todayWorkout ? (
              <View style={styles.workoutContent}>
                <Text style={styles.workoutName}>{todayWorkout.name}</Text>
                <View style={styles.workoutBadges}>
                  <View style={styles.workoutBadge}>
                    <Ionicons name="fitness" size={14} color={colors.textSecondary} />
                    <Text style={styles.workoutBadgeText}>
                      {todayWorkout.exercises.length} exercises
                    </Text>
                  </View>
                  {todayWorkout.duration && (
                    <View style={styles.workoutBadge}>
                      <Ionicons name="time" size={14} color={colors.textSecondary} />
                      <Text style={styles.workoutBadgeText}>
                        {Math.round(todayWorkout.duration)} min
                      </Text>
                    </View>
                  )}
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: todayWorkout.completed ? colors.successMuted : colors.warningMuted }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      { color: todayWorkout.completed ? colors.success : colors.warning }
                    ]}>
                      {todayWorkout.completed ? 'Complete' : 'In Progress'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
                <GlassButton
                  title="Log Workout"
                  icon="add"
                  onPress={() => openAddWorkout()}
                  variant="primary"
                  fullWidth
                />
                {/* Quick Repeat Section */}
                {recentWorkoutsForRepeat.length > 0 && (
                  <View style={styles.quickRepeatSection}>
                    <Text style={styles.quickRepeatTitle}>Quick Repeat</Text>
                    {recentWorkoutsForRepeat.map(w => (
                      <GlassCard
                        key={w.id}
                        accent="none"
                        glowIntensity="none"
                        padding="sm"
                        onPress={() => handleQuickRepeat(w)}
                        style={styles.quickRepeatCard}
                      >
                        <View style={styles.quickRepeatContent}>
                          <Ionicons name="refresh" size={18} color={colors.primary} />
                          <View style={styles.quickRepeatInfo}>
                            <Text style={styles.quickRepeatName}>{w.name}</Text>
                            <Text style={styles.quickRepeatMeta}>
                              {w.exercises.length} exercises • {daysAgo(w.date)}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                        </View>
                      </GlassCard>
                    ))}
                  </View>
                )}
              </>
            )}
          </GlassCard>
        </View>

        {/* Nutrition Card */}
        <View style={isWideScreen ? styles.cardWrapper : undefined}>
          <GlassCard accent="rose" glowIntensity="subtle">
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <LinearGradient
                  colors={[colors.nutritionLight, colors.nutrition]}
                  style={styles.iconGradient}
                >
                  <Ionicons name="nutrition" size={20} color={colors.text} />
                </LinearGradient>
              </View>
              <Text style={styles.cardTitle}>Calories</Text>
            </View>
            <View style={styles.progressContainer}>
              <AnimatedProgressBar
                current={totalCalories}
                target={todayNutrition?.calorieTarget || user?.dailyCalorieTarget || 2200}
                unit="cal"
                theme="rose"
              />
            </View>
            {todayNutrition && todayNutrition.meals.length > 0 ? (
              <View style={styles.mealsPreview}>
                <View style={styles.mealsBadge}>
                  <Ionicons name="restaurant" size={14} color={colors.nutrition} />
                  <Text style={styles.mealsBadgeText}>
                    {todayNutrition.meals.length} {todayNutrition.meals.length === 1 ? 'meal' : 'meals'} logged
                  </Text>
                </View>
              </View>
            ) : (
              <GlassButton
                title="Add Meal"
                icon="add"
                onPress={() => openAddMeal()}
                variant="secondary"
                fullWidth
              />
            )}
          </GlassCard>
        </View>

        {/* Steps Card */}
        <View style={isWideScreen ? styles.cardWrapper : undefined}>
          <GlassCard accent="emerald" glowIntensity="subtle">
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <LinearGradient
                  colors={[colors.stepsLight, colors.steps]}
                  style={styles.iconGradient}
                >
                  <Ionicons name="footsteps" size={20} color={colors.text} />
                </LinearGradient>
              </View>
              <Text style={styles.cardTitle}>Steps</Text>
            </View>
            <View style={styles.progressContainer}>
              <AnimatedProgressBar
                current={todaySteps?.steps || 0}
                target={todaySteps?.stepGoal || user?.dailyStepGoal || 10000}
                unit="steps"
                theme="green"
              />
            </View>
            <GlassButton
              title="Update Steps"
              icon="pencil"
              onPress={() => openUpdateSteps()}
              variant="secondary"
              fullWidth
            />
          </GlassCard>
        </View>

        {/* Weight Card */}
        <View style={isWideScreen ? styles.cardWrapper : undefined}>
          <GlassCard accent="gold" glowIntensity="subtle">
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <LinearGradient
                  colors={[colors.goldLight, colors.gold]}
                  style={styles.iconGradient}
                >
                  <Ionicons name="scale-outline" size={20} color={colors.text} />
                </LinearGradient>
              </View>
              <Text style={styles.cardTitle}>Body Weight</Text>
            </View>
            {todayWeight && todayWeight.weight > 0 ? (
              <View>
                <View style={styles.weightDisplay}>
                  <AnimatedNumber
                    value={todayWeight.weight}
                    decimals={1}
                    suffix={todayWeight.unit}
                    size="xl"
                    color={colors.gold}
                  />
                </View>
                <WeightChart weights={recentWeights} unit={todayWeight.unit} goalWeight={user?.goalWeight} />
              </View>
            ) : (
              <View style={styles.emptyWeightState}>
                <Ionicons name="trending-up" size={32} color={colors.textTertiary} />
                <Text style={styles.emptyWeightText}>Track your weight to see trends</Text>
              </View>
            )}
            <GlassButton
              title="Update Weight"
              icon="pencil"
              onPress={() => openUpdateWeight()}
              variant="secondary"
              fullWidth
            />
          </GlassCard>
        </View>
      </View>
    </ScrollView>
  );
};

// Helper function for greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  greetingSection: {
    marginBottom: spacing['2xl'],
  },
  greetingText: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.extrabold,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  cardIconWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: 0.2,
  },
  workoutContent: {
    marginTop: spacing.sm,
  },
  workoutName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  workoutBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  workoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: glass.backgroundLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  workoutBadgeText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  statusBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  mealsPreview: {
    marginTop: spacing.sm,
  },
  mealsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.nutritionMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignSelf: 'flex-start',
  },
  mealsBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.nutrition,
  },
  weightDisplay: {
    marginBottom: spacing.md,
  },
  emptyWeightState: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyWeightText: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
  },
  quickRepeatSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  quickRepeatTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quickRepeatCard: {
    marginBottom: spacing.sm,
  },
  quickRepeatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quickRepeatInfo: {
    flex: 1,
  },
  quickRepeatName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  quickRepeatMeta: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default TodayScreen;
