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
import { getWorkouts, saveWorkout, getUser, getTodayDate } from '../services/storage';
import { WorkoutLog, User } from '../types';

const WorkoutsScreen = () => {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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

  const renderWorkoutItem = ({ item }: { item: WorkoutLog }) => {
    const totalSets = item.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <Card>
        <TouchableOpacity>
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
    padding: 16,
    paddingBottom: 80,
  },
  workoutHeader: {
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#98989D',
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
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
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
