import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateRangeKey } from '../../types';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import { useTrainingVolume } from '../../hooks/useTrainingVolume';
import { useWorkoutFrequency } from '../../hooks/useWorkoutFrequency';
import DateRangeSelector from '../../components/analytics/DateRangeSelector';
import TrainingVolumeChart from '../../components/analytics/TrainingVolumeChart';
import WorkoutFrequencyChart from '../../components/analytics/WorkoutFrequencyChart';
import CollapsibleSection from '../../components/CollapsibleSection';
import { colors, getResponsiveTypography } from '../../utils/theme';
import { useResponsive } from '../../hooks/useResponsive';
import { useUserStore } from '../../stores';

const ChartsTab: React.FC = () => {
  const { typographyScale } = useResponsive();
  const scaledType = getResponsiveTypography(typographyScale);
  const [selectedRange, setSelectedRange] = useState<DateRangeKey>('3M');

  const user = useUserStore((s) => s.user);
  const { workouts, loading } = useAnalyticsData(selectedRange);
  const { volumeData, stats: volumeStats } = useTrainingVolume(workouts);
  const { frequencyData, stats: frequencyStats } = useWorkoutFrequency(workouts);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="analytics" size={32} color="#3A9BFF" />
          <View style={styles.headerText}>
            <Text style={[styles.title, { fontSize: scaledType['3xl'] }]}>Progress Analytics</Text>
            <Text style={[styles.subtitle, { fontSize: scaledType.base }]}>
              Track your training trends and consistency
            </Text>
          </View>
        </View>
      </View>

      <DateRangeSelector
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
      />

      {workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={80} color="#3A3A42" />
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptyText}>
            Complete workouts to unlock your analytics dashboard
          </Text>
        </View>
      ) : (
        <>
          <CollapsibleSection
            title="Training Volume"
            icon="trending-up-outline"
            iconColor={colors.primary}
          >
            <TrainingVolumeChart
              volumeData={volumeData}
              stats={volumeStats}
              unit={user?.preferredWeightUnit || 'kg'}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Workout Frequency"
            icon="calendar-outline"
            iconColor={colors.success}
          >
            <WorkoutFrequencyChart
              frequencyData={frequencyData}
              stats={frequencyStats}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Period Summary"
            icon="stats-chart-outline"
            iconColor={colors.analytics}
          >
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { fontSize: scaledType['2xl'] }]}>{workouts.length}</Text>
                <Text style={[styles.summaryLabel, { fontSize: scaledType.xs }]}>Total Workouts</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { fontSize: scaledType['2xl'] }]}>
                  {workouts.reduce((sum, w) => sum + w.exercises.length, 0)}
                </Text>
                <Text style={[styles.summaryLabel, { fontSize: scaledType.xs }]}>Total Exercises</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { fontSize: scaledType['2xl'] }]}>
                  {workouts.reduce(
                    (sum, w) =>
                      sum +
                      w.exercises.reduce((eSum, e) => eSum + e.sets.length, 0),
                    0
                  )}
                </Text>
                <Text style={[styles.summaryLabel, { fontSize: scaledType.xs }]}>Total Sets</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { fontSize: scaledType['2xl'] }]}>
                  {Math.round(
                    workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / 60
                  )}h
                </Text>
                <Text style={[styles.summaryLabel, { fontSize: scaledType.xs }]}>Total Time</Text>
              </View>
            </View>
          </CollapsibleSection>
        </>
      )}
    </>
  );
};

export { ChartsTab };

const styles = StyleSheet.create({
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceElevated,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ChartsTab;
