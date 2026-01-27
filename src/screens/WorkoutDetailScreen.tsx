import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import EditWorkoutModal from '../components/EditWorkoutModal';
import { WorkoutLog, User, WorkoutTemplate, ExerciseTemplate } from '../types'
import { colors } from '../utils/theme';
import { getWorkouts, saveWorkout, deleteWorkout, getUser, checkAndUpdatePRs, generateId } from '../services/storage';
import { useUIStore } from '../stores';
import { successHaptic } from '../utils/haptics';

type WorkoutDetailRouteProp = RouteProp<{ params: { workoutId: string } }, 'params'>;

const WorkoutDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<WorkoutDetailRouteProp>();
  const { workoutId } = route.params;

  const [workout, setWorkout] = useState<WorkoutLog | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const openAddWorkout = useUIStore((s) => s.openAddWorkout);

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const loadWorkout = async () => {
    try {
      const userData = await getUser();
      setUser(userData);

      const workouts = await getWorkouts();
      const foundWorkout = workouts.find(w => w.id === workoutId);
      setWorkout(foundWorkout || null);
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (editedWorkout: WorkoutLog) => {
    await saveWorkout(editedWorkout);

    // Check for new PRs
    const newPRs = await checkAndUpdatePRs(editedWorkout);

    setWorkout(editedWorkout);
    setShowEditModal(false);

    // Show PR notification if any were set
    if (newPRs.length > 0) {
      const prNames = newPRs.map(pr => pr.exerciseName).join(', ');
      Alert.alert(
        '🏆 New Personal Record!',
        `Congratulations! You set a new PR for: ${prNames}`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    }
  };

  const handleDelete = async () => {
    await deleteWorkout(workoutId);
    setShowDeleteDialog(false);
    navigation.goBack();
  };

  const handleDuplicate = () => {
    if (!workout || !user) return;

    // Convert workout to template format
    const template: WorkoutTemplate = {
      id: generateId(),
      userId: user.id,
      name: workout.name,
      created: new Date().toISOString(),
      exercises: workout.exercises.map((ex, index): ExerciseTemplate => ({
        id: generateId(),
        exerciseName: ex.exerciseName,
        targetSets: ex.sets.length,
        targetReps: ex.sets[0]?.reps || 10,
        targetWeight: ex.sets[0]?.weight || undefined,
        order: index,
      })),
    };

    successHaptic();
    openAddWorkout(template);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="barbell-outline" size={64} color="#98989D" />
        <Text style={styles.emptyText}>Workout not found</Text>
      </View>
    );
  }

  const formattedDate = new Date(workout.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Workout Header */}
        <Card>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.workoutName}>{workout.name}</Text>
              <Text style={styles.workoutDate}>{formattedDate}</Text>
              {workout.duration && (
                <View style={styles.durationContainer}>
                  <Ionicons name="time-outline" size={16} color="#98989D" />
                  <Text style={styles.durationText}>{workout.duration} minutes</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDuplicate}
              >
                <Ionicons name="copy" size={22} color="#30D158" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowEditModal(true)}
              >
                <Ionicons name="pencil" size={22} color="#0A84FF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowDeleteDialog(true)}
              >
                <Ionicons name="trash" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>

          {workout.completed && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#30D158" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.exercises.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalSets}</Text>
              <Text style={styles.statLabel}>Total Sets</Text>
            </View>
          </View>
        </Card>

        {/* Exercises */}
        <View style={styles.sectionHeader}>
          <Ionicons name="fitness" size={24} color="#0A84FF" />
          <Text style={styles.sectionTitle}>Exercises</Text>
        </View>

        {workout.exercises.map((exercise, index) => (
          <Card key={exercise.id}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
            </View>

            <View style={styles.setsContainer}>
              {exercise.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <View style={styles.setNumber}>
                    <Text style={styles.setNumberText}>{setIndex + 1}</Text>
                  </View>
                  <View style={styles.setDetails}>
                    <View style={styles.setDetail}>
                      <Text style={styles.setDetailLabel}>Reps</Text>
                      <Text style={styles.setDetailValue}>{set.reps}</Text>
                    </View>
                    {set.weight > 0 && (
                      <>
                        <Text style={styles.setDetailSeparator}>×</Text>
                        <View style={styles.setDetail}>
                          <Text style={styles.setDetailLabel}>Weight</Text>
                          <Text style={styles.setDetailValue}>
                            {set.weight} {user?.preferredWeightUnit || 'kg'}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                  {set.completed && (
                    <Ionicons name="checkmark-circle" size={20} color="#30D158" />
                  )}
                </View>
              ))}
            </View>

            <View style={styles.exerciseSummary}>
              <Text style={styles.exerciseSummaryText}>
                {exercise.sets.length} sets • {exercise.sets[0]?.reps} reps
                {exercise.sets[0]?.weight > 0 &&
                  ` • ${exercise.sets[0].weight} ${user?.preferredWeightUnit || 'kg'}`}
              </Text>
            </View>

            {exercise.notes && (
              <View style={styles.exerciseNotesContainer}>
                <Ionicons name="document-text-outline" size={14} color="#A0A0A8" />
                <Text style={styles.exerciseNotesText}>{exercise.notes}</Text>
              </View>
            )}
          </Card>
        ))}

        {workout.notes && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={24} color="#FFD60A" />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <Card>
              <Text style={styles.notesText}>{workout.notes}</Text>
            </Card>
          </>
        )}
      </ScrollView>

      {showEditModal && (
        <EditWorkoutModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEdit}
          workout={workout}
        />
      )}

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Workout?"
        message={`Are you sure you want to delete "${workout.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        icon="barbell"
        iconColor="#FF3B30"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2E1F',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
  },
  completedText: {
    fontSize: 14,
    color: '#30D158',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#38383A',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#38383A',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A84FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    letterSpacing: 0.2,
  },
  setsContainer: {
    gap: 10,
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#38383A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  setDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setDetail: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  setDetailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  setDetailValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  setDetailSeparator: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  exerciseSummary: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#38383A',
  },
  exerciseSummaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  exerciseNotesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#38383A',
  },
  exerciseNotesText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
});

export default WorkoutDetailScreen;
