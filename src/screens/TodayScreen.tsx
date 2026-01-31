/**
 * TodayScreen (LogScreen)
 *
 * v0.2.0 UX: Simplified logging screen with one primary action.
 * - Primary CTA: Start/Log Workout (dominant)
 * - Quick repeat: One-tap to repeat recent workout
 * - Secondary: Meal and weight logging (compact)
 *
 * Dashboard elements (streaks, weekly stats, suggestions) moved to AnalyticsScreen.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import AnimatedNumber from '../components/AnimatedNumber';
import { TodayScreenSkeleton } from '../components/SkeletonLoader';
import { lightHaptic } from '../utils/haptics';
import { getTodayDate, generateId } from '../services/storage';
import { WorkoutLog, WorkoutTemplate } from '../types';
import { colors, glass, spacing, typography, radius, shadows } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';
import {
  useUserStore,
  useUIStore,
  useWorkoutStore,
  useNutritionStore,
  useDailyTrackingStore,
} from '../stores';

const TodayScreen = () => {
  const { contentMaxWidth } = useResponsive();
  const date = getTodayDate();

  // User Store
  const user = useUserStore((s) => s.user);

  // UI Store
  const openAddWorkout = useUIStore((s) => s.openAddWorkout);
  const openAddMeal = useUIStore((s) => s.openAddMeal);
  const openUpdateWeight = useUIStore((s) => s.openUpdateWeight);
  const openWelcome = useUIStore((s) => s.openWelcome);
  const openNamePrompt = useUIStore((s) => s.openNamePrompt);

  // User Store - Welcome & Name tracking
  const shouldShowWelcome = useUserStore((s) => s.shouldShowWelcome);
  const markWelcomeShown = useUserStore((s) => s.markWelcomeShown);
  const loadWelcomeState = useUserStore((s) => s.loadWelcomeState);
  const shouldShowNamePrompt = useUserStore((s) => s.shouldShowNamePrompt);
  const loadNameState = useUserStore((s) => s.loadNameState);

  // Workout Store
  const currentStreak = useWorkoutStore((s) => s.currentStreak);
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
  const todayWeight = useDailyTrackingStore((s) => s.todayWeight);
  const fetchTodayWeight = useDailyTrackingStore((s) => s.fetchTodayWeight);

  // Derived state
  const todayWorkout = getTodayWorkout(date);
  const lastWorkout = getRecentWorkouts(1)[0];
  const totalCalories = getTotalCalories();

  // Load essential data only (simplified for Log screen)
  const loadData = useCallback(async () => {
    if (!user) return;

    await Promise.all([
      fetchWorkouts(),
      fetchNutritionByDate(date, user.id, user.dailyCalorieTarget),
      fetchTodayWeight(date, user.id, user.preferredWeightUnit),
    ]);
  }, [user, date, fetchWorkouts, fetchNutritionByDate, fetchTodayWeight]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Name prompt & Welcome modal check - runs once on mount
  const startupChecked = useRef(false);
  useEffect(() => {
    if (startupChecked.current || !user) return;
    startupChecked.current = true;

    const checkStartupModals = async () => {
      // Load persisted states first
      await loadNameState();
      await loadWelcomeState();

      // First priority: check if user needs to set their name
      if (shouldShowNamePrompt()) {
        openNamePrompt();
        return;
      }

      // Second priority: check welcome popup
      if (shouldShowWelcome()) {
        openWelcome();
        await markWelcomeShown();
      }
    };
    checkStartupModals();
  }, [user, loadWelcomeState, loadNameState, shouldShowWelcome, shouldShowNamePrompt, openWelcome, markWelcomeShown, openNamePrompt]);

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
  const isLoading = isWorkoutsLoading && !todayNutrition;
  const isRefreshing = isWorkoutsRefreshing;

  if (isLoading) {
    return (
      <ScrollView style={styles.container}>
        <TodayScreenSkeleton />
      </ScrollView>
    );
  }

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
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      {/* Minimal Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
        </Text>
        {currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color={colors.warning} />
            <Text style={styles.streakText}>{currentStreak}</Text>
          </View>
        )}
      </View>

      {/* PRIMARY ACTION: Start Workout */}
      <TouchableOpacity
        style={styles.primaryCTA}
        onPress={() => {
          lightHaptic();
          openAddWorkout();
        }}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Start a new workout"
      >
        <LinearGradient
          colors={[colors.workout, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryCTAGradient}
        >
          <View style={styles.primaryCTAContent}>
            <View style={styles.primaryCTAIcon}>
              <Ionicons name="add" size={32} color={colors.text} />
            </View>
            <View style={styles.primaryCTAText}>
              <Text style={styles.primaryCTATitle}>Start Workout</Text>
              <Text style={styles.primaryCTASubtitle}>Log your exercises</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Today's Workout Status (if exists) */}
      {todayWorkout && (
        <GlassCard accent="blue" glowIntensity="medium" style={styles.todayWorkoutCard}>
          <View style={styles.todayWorkoutHeader}>
            <Text style={styles.todayWorkoutLabel}>Today</Text>
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
          <Text style={styles.todayWorkoutName}>{todayWorkout.name}</Text>
          <View style={styles.todayWorkoutMeta}>
            <Text style={styles.todayWorkoutMetaText}>
              {todayWorkout.exercises.length} exercises
              {todayWorkout.duration ? ` • ${Math.round(todayWorkout.duration)} min` : ''}
            </Text>
          </View>
        </GlassCard>
      )}

      {/* Quick Repeat: Last Workout */}
      {!todayWorkout && lastWorkout && (
        <TouchableOpacity
          style={styles.lastWorkoutCard}
          onPress={() => {
            lightHaptic();
            handleQuickRepeat(lastWorkout);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Repeat ${lastWorkout.name} workout`}
        >
          <View style={styles.lastWorkoutIcon}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </View>
          <View style={styles.lastWorkoutInfo}>
            <Text style={styles.lastWorkoutTitle}>Repeat: {lastWorkout.name}</Text>
            <Text style={styles.lastWorkoutMeta}>
              {lastWorkout.exercises.length} exercises • {daysAgo(lastWorkout.date)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      )}

      {/* Secondary Actions Row */}
      <View style={styles.secondaryRow}>
        {/* Meal Card */}
        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => {
            lightHaptic();
            openAddMeal();
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.nutritionMuted, 'transparent']}
            style={styles.secondaryCardGradient}
          >
            <Ionicons name="nutrition" size={24} color={colors.nutrition} />
            <View style={styles.secondaryCardContent}>
              <Text style={styles.secondaryCardValue}>
                {totalCalories > 0 ? totalCalories.toLocaleString() : '—'}
              </Text>
              <Text style={styles.secondaryCardLabel}>calories</Text>
            </View>
            {todayNutrition && todayNutrition.meals.length > 0 && (
              <Text style={styles.secondaryCardMeta}>
                {todayNutrition.meals.length} meal{todayNutrition.meals.length !== 1 ? 's' : ''}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Weight Card */}
        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => {
            lightHaptic();
            openUpdateWeight();
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.goldMuted, 'transparent']}
            style={styles.secondaryCardGradient}
          >
            <Ionicons name="scale-outline" size={24} color={colors.gold} />
            <View style={styles.secondaryCardContent}>
              <Text style={styles.secondaryCardValue}>
                {todayWeight && todayWeight.weight > 0
                  ? `${todayWeight.weight.toFixed(1)}`
                  : '—'}
              </Text>
              <Text style={styles.secondaryCardLabel}>
                {todayWeight?.unit || user?.preferredWeightUnit || 'lbs'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  headerTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  streakText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.warning,
  },

  // Primary CTA
  primaryCTA: {
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  primaryCTAGradient: {
    padding: spacing['2xl'],
  },
  primaryCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  primaryCTAIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryCTAText: {
    flex: 1,
  },
  primaryCTATitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  primaryCTASubtitle: {
    fontSize: typography.size.base,
    color: 'rgba(255,255,255,0.8)',
  },

  // Today's workout card
  todayWorkoutCard: {
    marginBottom: spacing.lg,
  },
  todayWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  todayWorkoutLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayWorkoutName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  todayWorkoutMeta: {
    marginTop: spacing.xs,
  },
  todayWorkoutMetaText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  statusBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },

  // Last workout quick repeat
  lastWorkoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: glass.background,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  lastWorkoutIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastWorkoutInfo: {
    flex: 1,
  },
  lastWorkoutTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  lastWorkoutMeta: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },

  // Secondary actions row
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryCard: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: glass.background,
    borderWidth: 1,
    borderColor: glass.border,
  },
  secondaryCardGradient: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  secondaryCardContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  secondaryCardValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  secondaryCardLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  secondaryCardMeta: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
  },
});

export default TodayScreen;
