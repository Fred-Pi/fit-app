import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseHistoryIndicatorProps {
  lastPerformance: {
    date: string;
    sets: number;
    reps: number;
    weight: number;
    workoutName: string;
  } | null;
  loading?: boolean;
}

const ExerciseHistoryIndicator: React.FC<ExerciseHistoryIndicatorProps> = ({
  lastPerformance,
  loading,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (!lastPerformance) {
    return (
      <View style={styles.container}>
        <Ionicons name="information-circle-outline" size={16} color="#A0A0A8" />
        <Text style={styles.noHistoryText}>First time performing this exercise</Text>
      </View>
    );
  }

  const formattedDate = new Date(lastPerformance.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={16} color="#3A9BFF" />
      <Text style={styles.historyText}>
        Last: {formattedDate} - {lastPerformance.sets}x{lastPerformance.reps}
        {lastPerformance.weight > 0 && ` @ ${lastPerformance.weight}lbs`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1A2E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  loadingText: {
    fontSize: 13,
    color: '#A0A0A8',
  },
  noHistoryText: {
    fontSize: 13,
    color: '#A0A0A8',
    fontStyle: 'italic',
  },
  historyText: {
    fontSize: 13,
    color: '#3A9BFF',
    fontWeight: '500',
  },
});

export default ExerciseHistoryIndicator;
