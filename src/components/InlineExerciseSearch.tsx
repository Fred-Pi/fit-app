/**
 * InlineExerciseSearch - Inline exercise search with dropdown suggestions
 *
 * Replaces the modal-based ExercisePicker with an inline autocomplete.
 * Shows suggestions as user types, supports custom exercise entry.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EXERCISE_DATABASE, EXERCISE_CATEGORIES, type Exercise } from '../data/exercises';
import { getCustomExercises } from '../services/storage';
import { getAllExercises, isCustomExercise } from '../utils/exerciseHelpers';
import { useAuthStore } from '../stores/authStore';
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import { lightHaptic } from '../utils/haptics';
import GlassCard from './GlassCard';

interface InlineExerciseSearchProps {
  onSelectExercise: (exerciseName: string, defaults?: { sets: number; reps: number }) => void;
  existingExercises: string[];
}

const MAX_SUGGESTIONS = 8;

const InlineExerciseSearch: React.FC<InlineExerciseSearchProps> = ({
  onSelectExercise,
  existingExercises,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);

  // Load custom exercises on mount
  useEffect(() => {
    const loadCustomExercises = async () => {
      try {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;
        const exercises = await getCustomExercises(userId);
        setCustomExercises(exercises);
      } catch (error) {
        console.error('Error loading custom exercises:', error);
      }
    };
    loadCustomExercises();
  }, []);

  // All exercises combined
  const allExercises = useMemo(() => {
    return getAllExercises(customExercises);
  }, [customExercises]);

  // Filter exercises based on search query
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      // When no search, show recently used categories or popular exercises
      return [];
    }

    const query = searchQuery.toLowerCase();
    const existingSet = new Set(existingExercises.map((e) => e.toLowerCase()));

    return allExercises
      .filter((exercise) => {
        // Exclude already added exercises
        if (existingSet.has(exercise.name.toLowerCase())) {
          return false;
        }
        // Match by name
        return exercise.name.toLowerCase().includes(query);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [searchQuery, allExercises, existingExercises]);

  // Check if the exact search query matches an exercise (for custom exercise option)
  const exactMatch = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase().trim();
    return allExercises.some((e) => e.name.toLowerCase() === query);
  }, [searchQuery, allExercises]);

  // Check if search query is already in the workout
  const alreadyAdded = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase().trim();
    return existingExercises.some((e) => e.toLowerCase() === query);
  }, [searchQuery, existingExercises]);

  const handleSelectExercise = (exercise: Exercise) => {
    lightHaptic();
    const defaults =
      exercise.defaultSets && exercise.defaultReps
        ? { sets: exercise.defaultSets, reps: exercise.defaultReps }
        : undefined;

    onSelectExercise(exercise.name, defaults);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleAddCustom = () => {
    if (!searchQuery.trim() || alreadyAdded) return;
    lightHaptic();
    onSelectExercise(searchQuery.trim());
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay to allow tap on suggestions
    setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };

  const getCategoryColor = (category: string) => {
    const cat = EXERCISE_CATEGORIES.find((c) => c.name === category);
    return cat?.color || colors.primary;
  };

  const renderSuggestion = ({ item }: { item: Exercise }) => {
    const isCustom = isCustomExercise(item.id);
    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSelectExercise(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
        <View style={styles.suggestionInfo}>
          <View style={styles.suggestionNameRow}>
            <Text style={styles.suggestionName}>{item.name}</Text>
            {isCustom && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            )}
          </View>
          {item.defaultSets && item.defaultReps && (
            <Text style={styles.suggestionDefaults}>
              {item.defaultSets} × {item.defaultReps}
            </Text>
          )}
        </View>
        <Ionicons name="add-circle" size={22} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  const showSuggestions = isFocused && searchQuery.trim().length > 0;
  const showAddCustom = showSuggestions && !exactMatch && !alreadyAdded && searchQuery.trim().length > 1;

  return (
    <GlassCard style={styles.container} padding="none">
      {/* Search Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Add exercise..."
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleAddCustom}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.id}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Add Custom Option */}
          {showAddCustom && (
            <TouchableOpacity
              style={styles.addCustomButton}
              onPress={handleAddCustom}
              activeOpacity={0.7}
            >
              <View style={styles.addCustomIcon}>
                <Ionicons name="create-outline" size={18} color={colors.success} />
              </View>
              <Text style={styles.addCustomText}>
                Add "{searchQuery.trim()}" as custom exercise
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.success} />
            </TouchableOpacity>
          )}

          {/* No Results */}
          {suggestions.length === 0 && !showAddCustom && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>
                {alreadyAdded
                  ? 'This exercise is already in your workout'
                  : 'No matching exercises found'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Helper Text when not focused */}
      {!isFocused && searchQuery.length === 0 && (
        <View style={styles.helperContainer}>
          <Text style={styles.helperText}>
            Type to search exercises or add custom
          </Text>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  suggestionsContainer: {
    maxHeight: 320,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  suggestionsList: {
    maxHeight: 240,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  suggestionName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  customBadge: {
    backgroundColor: colors.analyticsMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  customBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.analytics,
    textTransform: 'uppercase',
  },
  suggestionDefaults: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.successMuted,
    borderTopWidth: 1,
    borderTopColor: `${colors.success}30`,
  },
  addCustomIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: `${colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomText: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.success,
  },
  noResults: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  helperContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  helperText: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

export default InlineExerciseSearch;
