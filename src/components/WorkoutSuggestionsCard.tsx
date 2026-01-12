import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import { SuggestionData } from '../utils/workoutSuggestions';
import { EXERCISE_CATEGORIES } from '../data/exercises';

interface WorkoutSuggestionsCardProps {
  suggestions: SuggestionData;
}

const WorkoutSuggestionsCard: React.FC<WorkoutSuggestionsCardProps> = ({
  suggestions,
}) => {
  // Get color for muscle group
  const getMuscleGroupColor = (muscleGroup: string): string => {
    const category = EXERCISE_CATEGORIES.find(c => c.name === muscleGroup);
    return category?.color || colors.primary;
  };

  // Get icon for muscle group
  const getMuscleGroupIcon = (muscleGroup: string): keyof typeof Ionicons.glyphMap => {
    const category = EXERCISE_CATEGORIES.find(c => c.name === muscleGroup);
    return (category?.icon || 'fitness-outline') as keyof typeof Ionicons.glyphMap;
  };

  // Priority colors
  const priorityColors = {
    high: '#FF6B6B',
    medium: '#FBBF24',
  };

  // If no suggestions but has enough data, show balanced message
  if (suggestions.hasEnoughData && suggestions.suggestions.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.headerTitle}>Well Balanced!</Text>
          </View>
        </View>
        <Text style={styles.balancedText}>
          Your training is well-distributed across muscle groups. Keep it up!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={20} color="#FBBF24" />
          <Text style={styles.headerTitle}>Suggested Focus</Text>
        </View>
        <Text style={styles.subtitle}>Based on last 14 days</Text>
      </View>

      {/* Suggestions List */}
      <View style={styles.suggestionsContainer}>
        {suggestions.suggestions.map((suggestion, index) => (
          <View key={suggestion.muscleGroup} style={styles.suggestionRow}>
            <View style={styles.suggestionLeft}>
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: priorityColors[suggestion.priority] },
                ]}
              />
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${getMuscleGroupColor(suggestion.muscleGroup)}20` },
                ]}
              >
                <Ionicons
                  name={getMuscleGroupIcon(suggestion.muscleGroup)}
                  size={18}
                  color={getMuscleGroupColor(suggestion.muscleGroup)}
                />
              </View>
              <Text style={styles.muscleGroupName}>{suggestion.muscleGroup}</Text>
            </View>
            <Text style={styles.reasonText}>{suggestion.reason}</Text>
          </View>
        ))}
      </View>

      {/* Most Trained Footer */}
      {suggestions.mostTrained && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Most trained: {suggestions.mostTrained} ({suggestions.mostTrainedSets} sets)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  suggestionsContainer: {
    gap: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muscleGroupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  reasonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  balancedText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default WorkoutSuggestionsCard;
