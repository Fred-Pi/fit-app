import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  EXERCISE_DATABASE,
  EXERCISE_CATEGORIES,
  searchExercises,
  getExercisesByCategory,
  type Exercise,
  type MuscleGroup,
} from '../data/exercises';

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

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return EXERCISE_DATABASE;
    }
    return searchExercises(searchQuery);
  }, [searchQuery]);

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

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={[
        styles.exerciseItem,
        currentExerciseName === item.name && styles.exerciseItemSelected,
      ]}
      onPress={() => handleSelectFromDatabase(item)}
    >
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        {item.defaultSets && item.defaultReps && (
          <Text style={styles.exerciseDefaults}>
            {item.defaultSets} sets × {item.defaultReps} reps
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#A0A0A8" />
    </TouchableOpacity>
  );

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
    color: '#FFFFFF',
  },
  cancelButton: {
    fontSize: 16,
    color: '#A0A0A8',
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
    color: '#FFFFFF',
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
    borderColor: '#3A9BFF',
    borderStyle: 'dashed',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A9BFF',
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
    color: '#FFFFFF',
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
    color: '#A0A0A8',
    fontWeight: '600',
  },
  customSaveButton: {
    backgroundColor: '#3A9BFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  customSaveText: {
    fontSize: 15,
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: '#A0A0A8',
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
    borderColor: '#3A9BFF',
    backgroundColor: '#2A3340',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseDefaults: {
    fontSize: 13,
    color: '#A0A0A8',
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
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0A0A8',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ExercisePicker;
