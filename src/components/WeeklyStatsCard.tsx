import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeeklyStats, WeekComparison } from '../types';
import { formatWeekRange } from '../utils/dateUtils';
import ProgressBar from './ProgressBar';

interface WeeklyStatsCardProps {
  currentWeek: WeeklyStats;
  previousWeek?: WeeklyStats;
  comparison?: WeekComparison;
}

const WeeklyStatsCard: React.FC<WeeklyStatsCardProps> = ({
  currentWeek,
  previousWeek,
  comparison,
}) => {
  const weekRangeText = formatWeekRange(currentWeek.weekStart, currentWeek.weekEnd);

  // Calculate progress percentages
  const calorieProgress = currentWeek.calorieTarget > 0
    ? (currentWeek.totalCalories / currentWeek.calorieTarget) * 100
    : 0;

  const stepProgress = currentWeek.stepGoal > 0
    ? (currentWeek.totalSteps / currentWeek.stepGoal) * 100
    : 0;

  // Render comparison indicator
  const renderComparison = (value: number, percent: number, metric: string) => {
    if (!previousWeek || value === 0) {
      return null;
    }

    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? '#32D760' : isNegative ? '#FF5E6D' : '#A0A0A8';
    const icon = isPositive ? 'arrow-up' : isNegative ? 'arrow-down' : 'remove';
    const sign = isPositive ? '+' : '';

    return (
      <View style={styles.comparisonContainer}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={[styles.comparisonText, { color }]}>
          {sign}{value.toLocaleString()} ({sign}{percent}%)
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={20} color="#3A9BFF" />
          <Text style={styles.headerTitle}>This Week</Text>
        </View>
        <Text style={styles.weekRange}>{weekRangeText}</Text>
      </View>

      {/* Workouts Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="barbell-outline" size={20} color="#3A9BFF" />
          <Text style={styles.sectionTitle}>Workouts</Text>
        </View>
        <View style={styles.workoutStats}>
          <Text style={styles.workoutCount}>
            {currentWeek.totalWorkouts} completed
          </Text>
          {comparison && renderComparison(
            comparison.workouts,
            comparison.workoutsPercent,
            'workouts'
          )}
        </View>
        {currentWeek.daysActive > 0 && (
          <Text style={styles.daysActive}>
            {currentWeek.daysActive} {currentWeek.daysActive === 1 ? 'day' : 'days'} active
          </Text>
        )}
      </View>

      {/* Calories Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="restaurant-outline" size={20} color="#FF5E6D" />
          <Text style={styles.sectionTitle}>Calories</Text>
        </View>
        <ProgressBar
          current={currentWeek.totalCalories}
          target={currentWeek.calorieTarget}
          color="#FF5E6D"
          unit="cal"
        />
        <View style={styles.statsRow}>
          <Text style={styles.avgText}>
            Avg: {currentWeek.avgCalories.toLocaleString()}/day
          </Text>
          {comparison && renderComparison(
            comparison.calories,
            comparison.caloriesPercent,
            'calories'
          )}
        </View>
      </View>

      {/* Steps Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="footsteps-outline" size={20} color="#32D760" />
          <Text style={styles.sectionTitle}>Steps</Text>
        </View>
        <ProgressBar
          current={currentWeek.totalSteps}
          target={currentWeek.stepGoal}
          color="#32D760"
          unit="steps"
        />
        <View style={styles.statsRow}>
          <Text style={styles.avgText}>
            Avg: {currentWeek.avgSteps.toLocaleString()}/day
          </Text>
          {comparison && renderComparison(
            comparison.steps,
            comparison.stepsPercent,
            'steps'
          )}
        </View>
      </View>

      {/* Empty State */}
      {currentWeek.totalWorkouts === 0 && currentWeek.totalCalories === 0 && currentWeek.totalSteps === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="information-circle-outline" size={24} color="#A0A0A8" />
          <Text style={styles.emptyText}>No activity this week yet</Text>
          <Text style={styles.emptySubtext}>Start logging workouts, nutrition, and steps!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E22',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A3A42',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weekRange: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A0A0A8',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  workoutCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  daysActive: {
    fontSize: 13,
    color: '#A0A0A8',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  avgText: {
    fontSize: 13,
    color: '#A0A0A8',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A0A0A8',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});

export default WeeklyStatsCard;
