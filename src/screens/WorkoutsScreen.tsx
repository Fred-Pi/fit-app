import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import AddWorkoutModal from '../components/AddWorkoutModal';
import EditWorkoutModal from '../components/EditWorkoutModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getWorkouts, saveWorkout, deleteWorkout, getUser, getTodayDate } from '../services/storage';
import { WorkoutLog, User } from '../types';

const WorkoutsScreen = () => {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutLog | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    visible: boolean;
    workoutId: string;
    workoutName: string;
  }>({ visible: false, workoutId: '', workoutName: '' });

  const loadWorkouts = async () => {
    try {
      const userData = await getUser();
      setUser(userData);

      const data = await getWorkouts();
      // Sort by date descending
      const sorted = data.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWorkouts(sorted);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const handleAddWorkout = async (workout: WorkoutLog) => {
    await saveWorkout(workout);
    setWorkouts([workout, ...workouts]);
  };

  const handleEditWorkout = async (editedWorkout: WorkoutLog) => {
    await saveWorkout(editedWorkout);
    setWorkouts(workouts.map((w) => (w.id === editedWorkout.id ? editedWorkout : w)));
    setShowEditWorkoutModal(false);
    setSelectedWorkout(null);
  };

  const handleDeleteWorkout = async () => {
    await deleteWorkout(confirmDelete.workoutId);
    setWorkouts(workouts.filter((w) => w.id !== confirmDelete.workoutId));
    setConfirmDelete({ visible: false, workoutId: '', workoutName: '' });
  };

  const renderWorkoutItem = ({ item }: { item: WorkoutLog }) => {
    const totalSets = item.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <Card>
        <View style={styles.workoutContainer}>
          <TouchableOpacity style={styles.workoutContent}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutName}>{item.name}</Text>
              <Text style={styles.workoutDate}>{formattedDate}</Text>
            </View>
            <View style={styles.workoutStats}>
              <Text style={styles.workoutDetail}>
                {item.exercises.length} exercises • {totalSets} sets
              </Text>
              {item.duration && (
                <Text style={styles.workoutDetail}> • {item.duration} min</Text>
              )}
            </View>
            {item.completed && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.workoutActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedWorkout(item);
                setShowEditWorkoutModal(true);
              }}
            >
              <Ionicons name="pencil-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                setConfirmDelete({
                  visible: true,
                  workoutId: item.id,
                  workoutName: item.name,
                })
              }
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the button below to log your first workout
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddWorkoutModal(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {user && (
        <AddWorkoutModal
          visible={showAddWorkoutModal}
          onClose={() => setShowAddWorkoutModal(false)}
          onSave={handleAddWorkout}
          date={getTodayDate()}
          userId={user.id}
        />
      )}

      <EditWorkoutModal
        visible={showEditWorkoutModal}
        onClose={() => {
          setShowEditWorkoutModal(false);
          setSelectedWorkout(null);
        }}
        onSave={handleEditWorkout}
        workout={selectedWorkout}
      />

      <ConfirmDialog
        visible={confirmDelete.visible}
        title="Delete Workout?"
        message={`Are you sure you want to delete "${confirmDelete.workoutName}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteWorkout}
        onCancel={() => setConfirmDelete({ visible: false, workoutId: '', workoutName: '' })}
        icon="barbell"
        iconColor="#FF3B30"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  workoutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutContent: {
    flex: 1,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
  },
  workoutHeader: {
    marginBottom: 10,
  },
  workoutName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  workoutDate: {
    fontSize: 15,
    color: '#98989D',
    fontWeight: '500',
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDetail: {
    fontSize: 14,
    color: '#98989D',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  completedText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#98989D',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default WorkoutsScreen;
