import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  Alert,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import ModalHeader from './ModalHeader';
import GlassButton from './GlassButton';
import { modalStyles, placeholderColor } from '../styles/modalStyles';
import {
  EXERCISE_DATABASE,
  EXERCISE_CATEGORIES,
  searchExercises,
  getExercisesByCategory,
  type Exercise,
  type MuscleGroup,
} from '../data/exercises';
import { getCustomExercises } from '../services/storage';
import { getAllExercises, isCustomExercise } from '../utils/exerciseHelpers';
import { useAuthStore } from '../stores/authStore';

interface ExercisePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseName: string, defaults?: { sets: number; reps: number }) => void;
  currentExerciseName?: string;
}

interface ExerciseSection {
  title: MuscleGroup;
  icon: string;
  color: string;
  data: Exercise[];
}

const ExercisePicker: React.FC<ExercisePickerProps> = ({
  visible,
  onClose,
  onSelectExercise,
  currentExerciseName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadCustomExercises();
    }
  }, [visible]);

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

  const allExercises = useMemo(() => {
    return getAllExercises(customExercises);
  }, [customExercises]);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return allExercises;
    }
    return allExercises.filter(ex =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allExercises]);

  const exerciseSections = useMemo<ExerciseSection[]>(() => {
    const sections: ExerciseSection[] = [];

    EXERCISE_CATEGORIES.forEach(category => {
      const categoryExercises = filteredExercises.filter(
        exercise => exercise.category === category.name
      );

      if (categoryExercises.length > 0) {
        sections.push({
          title: category.name,
          icon: category.icon,
          color: category.color,
          data: categoryExercises,
        });
      }
    });

    return sections;
  }, [filteredExercises]);

  const handleSelectFromDatabase = (exercise: Exercise) => {
    const defaults = exercise.defaultSets && exercise.defaultReps
      ? { sets: exercise.defaultSets, reps: exercise.defaultReps }
      : undefined;

    onSelectExercise(exercise.name, defaults);
    setSearchQuery('');
  };

  const handleCustomExercise = () => {
    if (!customName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    onSelectExercise(customName.trim());
    setCustomName('');
    setShowCustomInput(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    setSearchQuery('');
    setCustomName('');
    setShowCustomInput(false);
    onClose();
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isCustom = isCustomExercise(item.id);
    const isSelected = currentExerciseName === item.name;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.exerciseItem,
          isSelected && styles.exerciseItemSelected,
          pressed && styles.exerciseItemPressed,
        ]}
        onPress={() => handleSelectFromDatabase(item)}
      >
        <View style={styles.exerciseInfo}>
          <View style={styles.exerciseNameRow}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            {isCustom && (
              <LinearGradient
                colors={[colors.analyticsLight, colors.analytics]}
                style={styles.customBadge}
              >
                <Text style={styles.customBadgeText}>Custom</Text>
              </LinearGradient>
            )}
          </View>
          {item.defaultSets && item.defaultReps && (
            <Text style={styles.exerciseDefaults}>
              {item.defaultSets} sets × {item.defaultReps} reps
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: ExerciseSection }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: section.color + '20' }]}>
        <Ionicons name={section.icon as any} size={18} color={section.color} />
      </View>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionCount}>
        <Text style={styles.sectionCountText}>{section.data.length}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={modalStyles.container}>
        <ModalHeader
          title="Exercise Database"
          onCancel={handleClose}
          showSave={false}
        />

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[
            styles.searchContainer,
            focusedField === 'search' && styles.searchContainerFocused,
          ]}>
            <Ionicons name="search" size={20} color={colors.primary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={placeholderColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setFocusedField('search')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          {/* Custom Exercise Section */}
          {!showCustomInput ? (
            <GlassButton
              title="Enter Custom Exercise"
              onPress={() => setShowCustomInput(true)}
              variant="success"
              icon="add-circle"
              fullWidth
            />
          ) : (
            <View style={styles.customInputContainer}>
              <TextInput
                style={[
                  modalStyles.input,
                  focusedField === 'custom' && modalStyles.inputFocused,
                ]}
                placeholder="Enter custom exercise name..."
                placeholderTextColor={placeholderColor}
                value={customName}
                onChangeText={setCustomName}
                onFocus={() => setFocusedField('custom')}
                onBlur={() => setFocusedField(null)}
                autoFocus
                autoCapitalize="words"
                onSubmitEditing={handleCustomExercise}
                returnKeyType="done"
              />
              <View style={styles.customActions}>
                <GlassButton
                  title="Cancel"
                  onPress={() => {
                    setCustomName('');
                    setShowCustomInput(false);
                  }}
                  variant="secondary"
                  size="sm"
                />
                <GlassButton
                  title="Add"
                  onPress={handleCustomExercise}
                  variant="success"
                  size="sm"
                />
              </View>
            </View>
          )}
        </View>

        {/* Exercise List */}
        {exerciseSections.length > 0 ? (
          <SectionList
            sections={exerciseSections}
            keyExtractor={(item) => item.id}
            renderItem={renderExerciseItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={modalStyles.emptyState}>
            <Ionicons name="search" size={48} color={colors.textTertiary} />
            <Text style={modalStyles.emptyStateText}>No exercises found</Text>
            <Text style={[modalStyles.emptyStateText, { marginTop: spacing.xs }]}>
              Try a different search term or add a custom exercise
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: glass.border,
  },
  searchContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: glass.background,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text,
  },
  customInputContainer: {
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: glass.border,
    gap: spacing.md,
  },
  customActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.text,
    flex: 1,
  },
  sectionCount: {
    backgroundColor: glass.backgroundLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  sectionCountText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: glass.backgroundLight,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.border,
  },
  exerciseItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  exerciseItemPressed: {
    backgroundColor: glass.background,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  customBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  customBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text,
    textTransform: 'uppercase',
  },
  exerciseDefaults: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
});

export default ExercisePicker;
