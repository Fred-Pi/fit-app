import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutsStackParamList } from '../navigation/WorkoutsStack';
import Card from '../components/Card';
import SwipeableRow from '../components/SwipeableRow';
import ExpandableFAB from '../components/ExpandableFAB';
import { ListSkeleton } from '../components/SkeletonLoader';
import { WorkoutLog } from '../types';
import { colors } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';
import { lightHaptic, warningHaptic } from '../utils/haptics';
import {
  useUserStore,
  useUIStore,
  useWorkoutStore,
} from '../stores';

type WorkoutsScreenNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'WorkoutsList'>;

const WorkoutsScreen = () => {
  const navigation = useNavigation<WorkoutsScreenNavigationProp>();
  const { contentMaxWidth } = useResponsive();

  // User Store
  const user = useUserStore((s) => s.user);

  // UI Store
  const openAddWorkout = useUIStore((s) => s.openAddWorkout);
  const openEditWorkout = useUIStore((s) => s.openEditWorkout);
  const openTemplatePicker = useUIStore((s) => s.openTemplatePicker);
  const openConfirmDialog = useUIStore((s) => s.openConfirmDialog);

  // Workout Store
  const workouts = useWorkoutStore((s) => s.workouts);
  const isLoading = useWorkoutStore((s) => s.isLoading);
  const isRefreshing = useWorkoutStore((s) => s.isRefreshing);
  const fetchWorkouts = useWorkoutStore((s) => s.fetchWorkouts);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);

  // Initial load
  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [fetchWorkouts])
  );

  // Refresh handler
  const onRefresh = useCallback(() => {
    fetchWorkouts(true);
  }, [fetchWorkouts]);

  const handleDeleteWorkout = (workoutId: string, workoutName: string) => {
    warningHaptic();
    openConfirmDialog({
      title: 'Delete Workout?',
      message: `Are you sure you want to delete "${workoutName}"? This cannot be undone.`,
      confirmText: 'Delete',
      icon: 'barbell',
      iconColor: '#FF3B30',
      onConfirm: async () => {
        await deleteWorkout(workoutId);
      },
    });
  };

  const renderWorkoutItem = ({ item }: { item: WorkoutLog }) => {
    const totalSets = item.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <SwipeableRow
        onEdit={() => {
          openEditWorkout(item);
        }}
        onDelete={() => handleDeleteWorkout(item.id, item.name)}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
          activeOpacity={0.7}
        >
          <Card>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutName}>{item.name}</Text>
              <Text style={styles.workoutDate}>{formattedDate}</Text>
            </View>
            <View style={styles.workoutStats}>
              <Text style={styles.workoutDetail}>
                {item.exercises.length} exercises • {totalSets} sets
                {item.duration && ` • ${Math.round(item.duration)} min`}
              </Text>
            </View>
            {item.completed && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </Card>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  if (isLoading && workouts.length === 0) {
    return (
      <View style={styles.container}>
        <ListSkeleton count={5} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
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
      <ExpandableFAB
        actions={[
          {
            icon: 'add',
            label: 'New Workout',
            onPress: () => {
              lightHaptic();
              openAddWorkout();
            },
          },
          {
            icon: 'document-text',
            label: 'From Template',
            onPress: () => {
              lightHaptic();
              openTemplatePicker();
            },
          },
          {
            icon: 'analytics-outline',
            label: 'Analytics',
            onPress: () => {
              lightHaptic();
              navigation.navigate('Analytics');
            },
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  workoutHeader: {
    marginBottom: 10,
  },
  workoutName: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  workoutDate: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDetail: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.text,
    marginTop: 20,
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default WorkoutsScreen;
