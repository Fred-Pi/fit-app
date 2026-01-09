import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateProgression, formatSuggestion } from '../utils/progressiveOverload';

interface ExerciseHistoryIndicatorProps {
  exerciseName: string;
  lastPerformance: {
    date: string;
    sets: number;
    reps: number;
    weight: number;
    workoutName: string;
  } | null;
  loading?: boolean;
  weightUnit?: 'lbs' | 'kg';
  onApplySuggestion?: (sets: number, reps: number, weight: number) => void;
}

const ExerciseHistoryIndicator: React.FC<ExerciseHistoryIndicatorProps> = ({
  exerciseName,
  lastPerformance,
  loading,
  weightUnit = 'lbs',
  onApplySuggestion,
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
  });

  // Calculate progressive overload suggestion
  const suggestion = calculateProgression(
    exerciseName,
    lastPerformance.weight,
    lastPerformance.reps,
    lastPerformance.sets,
    weightUnit
  );

  const suggestionText = formatSuggestion(
    suggestion.suggestedSets,
    suggestion.suggestedReps,
    suggestion.suggestedWeight,
    weightUnit
  );

  const handleApply = () => {
    if (onApplySuggestion) {
      onApplySuggestion(
        suggestion.suggestedSets,
        suggestion.suggestedReps,
        suggestion.suggestedWeight
      );
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Last Performance */}
      <View style={styles.container}>
        <Ionicons name="time-outline" size={16} color="#3A9BFF" />
        <Text style={styles.historyText}>
          Last: {formattedDate} - {lastPerformance.sets}x{lastPerformance.reps}
          {lastPerformance.weight > 0 && ` @ ${lastPerformance.weight} ${weightUnit}`}
        </Text>
      </View>

      {/* Progressive Overload Suggestion */}
      <TouchableOpacity
        style={styles.suggestionContainer}
        onPress={handleApply}
        activeOpacity={0.7}
      >
        <Ionicons name="trending-up" size={16} color="#32D760" />
        <Text style={styles.suggestionText}>
          Try: {suggestionText}
        </Text>
        <View style={styles.increaseTag}>
          <Text style={styles.increaseText}>{suggestion.increase}</Text>
        </View>
        {onApplySuggestion && (
          <View style={styles.applyButton}>
            <Text style={styles.applyText}>Apply</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
    marginTop: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1A2E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
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
    flex: 1,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 215, 96, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(50, 215, 96, 0.3)',
  },
  suggestionText: {
    fontSize: 13,
    color: '#32D760',
    fontWeight: '600',
    flex: 1,
  },
  increaseTag: {
    backgroundColor: 'rgba(50, 215, 96, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  increaseText: {
    fontSize: 11,
    color: '#32D760',
    fontWeight: '700',
  },
  applyButton: {
    backgroundColor: '#32D760',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
  applyText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '700',
  },
});

export default ExerciseHistoryIndicator;
