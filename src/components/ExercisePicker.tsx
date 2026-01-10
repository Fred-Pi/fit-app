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
} from 'react-native'
import { colors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
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

  // Load custom exercises when modal opens
  useEffect(() => {
    if (visible) {
      loadCustomExercises();
    }
  }, [visible]);

  const loadCustomExercises = async () => {
    try {
      const exercises = await getCustomExercises();
      setCustomExercises(exercises);
    } catch (error) {
      console.error('Error loading custom exercises:', error);
    }
  };

  // Get all exercises (built-in + custom)
  const allExercises = useMemo(() => {
    return getAllExercises(customExercises);
  }, [customExercises]);

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return allExercises;
    }
    return allExercises.filter(ex =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allExercises]);

  // Group exercises by category for SectionList
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

    return (
      <TouchableOpacity
        style={[
          styles.exerciseItem,
          currentExerciseName === item.name && styles.exerciseItemSelected,
        ]}
        onPress={() => handleSelectFromDatabase(item)}
      >
        <View style={styles.exerciseInfo}>
          <View style={styles.exerciseNameRow}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            {isCustom && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            )}
          </View>
          {item.defaultSets && item.defaultReps && (
            <Text style={styles.exerciseDefaults}>
              {item.defaultSets} sets × {item.defaultReps} reps
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A0A0A8" />
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: ExerciseSection }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={section.icon as any} size={20} color={section.color} />
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>({section.data.length})</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Exercise Database</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#A0A0A8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#A0A0A8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#A0A0A8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Exercise Section */}
        <View style={styles.customSection}>
          {!showCustomInput ? (
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => setShowCustomInput(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#3A9BFF" />
              <Text style={styles.customButtonText}>Enter Custom Exercise</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                placeholder="Enter custom exercise name..."
                placeholderTextColor="#A0A0A8"
                value={customName}
                onChangeText={setCustomName}
                autoFocus
                autoCapitalize="words"
                onSubmitEditing={handleCustomExercise}
                returnKeyType="done"
              />
              <View style={styles.customActions}>
                <TouchableOpacity
                  style={styles.customCancelButton}
                  onPress={() => {
                    setCustomName('');
                    setShowCustomInput(false);
                  }}
                >
                  <Text style={styles.customCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.customSaveButton}
                  onPress={handleCustomExercise}
                >
                  <Text style={styles.customSaveText}>Add</Text>
                </TouchableOpacity>
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
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#A0A0A8" />
            <Text style={styles.emptyText}>No exercises found</Text>
            <Text style={styles.emptySubtext}>
              Try a different search term or add a custom exercise
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E22',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  placeholder: {
    width: 60,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A30',
    borderRadius: 10,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#3A3A42',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  customSection: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A30',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  customInputContainer: {
    backgroundColor: '#2A2A30',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3A3A42',
  },
  customInput: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
    marginBottom: 12,
  },
  customActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  customCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  customCancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  customSaveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  customSaveText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E22',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#2A2A30',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A42',
  },
  exerciseItemSelected: {
    borderColor: colors.primary,
    backgroundColor: '#2A3340',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  customBadge: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
  },
  exerciseDefaults: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ExercisePicker;
