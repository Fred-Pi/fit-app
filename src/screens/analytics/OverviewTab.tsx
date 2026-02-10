import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import StreakCard from '../../components/StreakCard';
import WeeklyStatsCard from '../../components/WeeklyStatsCard';
import WorkoutSuggestionsCard from '../../components/WorkoutSuggestionsCard';
import WeightChart from '../../components/WeightChart';
import CollapsibleSection from '../../components/CollapsibleSection';
import { calculateWorkoutSuggestions } from '../../utils/workoutSuggestions';
import { getTodayDate } from '../../services/storage';
import { colors, getResponsiveTypography } from '../../utils/theme';
import { useResponsive } from '../../hooks/useResponsive';
import {
  useUserStore,
  useWorkoutStore,
  useDailyTrackingStore,
  usePersonalRecordStore,
} from '../../stores';

const OverviewTab: React.FC = () => {
  const { typographyScale } = useResponsive();
  const scaledType = getResponsiveTypography(typographyScale);
  const date = getTodayDate();

  const user = useUserStore((s) => s.user);

  const allWorkouts = useWorkoutStore((s) => s.workouts);
  const currentStreak = useWorkoutStore((s) => s.currentStreak);
  const longestStreak = useWorkoutStore((s) => s.longestStreak);
  const fetchWorkouts = useWorkoutStore((s) => s.fetchWorkouts);

  const personalRecords = usePersonalRecordStore((s) => s.personalRecords);
  const fetchPersonalRecords = usePersonalRecordStore((s) => s.fetchPersonalRecords);

  const todayWeight = useDailyTrackingStore((s) => s.todayWeight);
  const recentWeights = useDailyTrackingStore((s) => s.recentWeights);
  const currentWeekStats = useDailyTrackingStore((s) => s.currentWeekStats);
  const previousWeekStats = useDailyTrackingStore((s) => s.previousWeekStats);
  const weekComparison = useDailyTrackingStore((s) => s.weekComparison);
  const fetchTodayWeight = useDailyTrackingStore((s) => s.fetchTodayWeight);
  const fetchRecentWeights = useDailyTrackingStore((s) => s.fetchRecentWeights);
  const fetchWeeklyStats = useDailyTrackingStore((s) => s.fetchWeeklyStats);

  const suggestions = allWorkouts.length > 0 ? calculateWorkoutSuggestions(allWorkouts) : null;

  const loadData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      fetchWorkouts(),
      fetchPersonalRecords(),
      fetchTodayWeight(date, user.id, user.preferredWeightUnit),
      fetchRecentWeights(date, 30, user.id),
      fetchWeeklyStats(user),
    ]);
  }, [user, date, fetchWorkouts, fetchPersonalRecords, fetchTodayWeight, fetchRecentWeights, fetchWeeklyStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="pulse" size={32} color={colors.success} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { fontSize: scaledType['3xl'] }]}>Progress Overview</Text>
            <Text style={[styles.subtitle, { fontSize: scaledType.base }]}>
              Your fitness journey at a glance
            </Text>
          </View>
        </View>
      </View>

      <StreakCard
        currentStreak={currentStreak}
        longestStreak={longestStreak}
      />

      {currentWeekStats && (
        <WeeklyStatsCard
          currentWeek={currentWeekStats}
          previousWeek={previousWeekStats || undefined}
          comparison={weekComparison || undefined}
        />
      )}

      {suggestions && suggestions.hasEnoughData && (
        <WorkoutSuggestionsCard suggestions={suggestions} />
      )}

      {recentWeights.length > 0 && (
        <CollapsibleSection
          title="Weight Progress"
          icon="scale-outline"
          iconColor={colors.primary}
        >
          <WeightChart
            weights={recentWeights}
            unit={todayWeight?.unit || user?.preferredWeightUnit || 'lbs'}
            goalWeight={user?.goalWeight}
          />
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="Quick Stats"
        icon="flash-outline"
        iconColor={colors.gold}
      >
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { fontSize: scaledType['4xl'] }]}>{allWorkouts.length}</Text>
            <Text style={[styles.quickStatLabel, { fontSize: scaledType.sm }]}>Total Workouts</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { fontSize: scaledType['4xl'] }]}>{personalRecords.length}</Text>
            <Text style={[styles.quickStatLabel, { fontSize: scaledType.sm }]}>Personal Records</Text>
          </View>
        </View>
      </CollapsibleSection>
    </>
  );
};

export const refreshOverview = () => {
  const user = useUserStore.getState().user;
  if (!user) return;
  const date = getTodayDate();
  Promise.all([
    useWorkoutStore.getState().fetchWorkouts(),
    useDailyTrackingStore.getState().fetchTodayWeight(date, user.id, user.preferredWeightUnit),
    useDailyTrackingStore.getState().fetchRecentWeights(date, 30, user.id),
    useDailyTrackingStore.getState().fetchWeeklyStats(user),
  ]);
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  quickStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default OverviewTab;
