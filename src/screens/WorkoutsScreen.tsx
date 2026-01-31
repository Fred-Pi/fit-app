import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Pressable,
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
import SelectionToolbar from '../components/SelectionToolbar';
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

type WorkoutsVariant = 'full' | 'compact' | 'list';

interface WorkoutsScreenProps {
  variant?: WorkoutsVariant;
  onSelectWorkout?: (workoutId: string | null) => void;
  selectedWorkoutId?: string | null;
}

const WorkoutsScreen: React.FC<WorkoutsScreenProps> = ({
  variant = 'full',
  onSelectWorkout,
  selectedWorkoutId,
}) => {
  const navigation = useNavigation<WorkoutsScreenNavigationProp>();
  const { contentMaxWidth, showSidebar } = useResponsive();

  // User Store
  const user = useUserStore((s) => s.user);

  // UI Store
  const openEditWorkout = useUIStore((s) => s.openEditWorkout);
  const openConfirmDialog = useUIStore((s) => s.openConfirmDialog);
  const selectedWorkoutIds = useUIStore((s) => s.selectedWorkoutIds);
  const toggleWorkoutSelection = useUIStore((s) => s.toggleWorkoutSelection);
  const selectAllWorkouts = useUIStore((s) => s.selectAllWorkouts);
  const clearWorkoutSelection = useUIStore((s) => s.clearWorkoutSelection);

  // Workout Store
  const workouts = useWorkoutStore((s) => s.workouts);
  const isLoading = useWorkoutStore((s) => s.isLoading);
  const isRefreshing = useWorkoutStore((s) => s.isRefreshing);
  const fetchWorkouts = useWorkoutStore((s) => s.fetchWorkouts);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);
  const deleteMultipleWorkouts = useWorkoutStore((s) => s.deleteMultipleWorkouts);

  const isWeb = Platform.OS === 'web';

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

  const handleBatchDelete = () => {
    if (selectedWorkoutIds.length === 0) return;
    warningHaptic();
    openConfirmDialog({
      title: `Delete ${selectedWorkoutIds.length} Workout${selectedWorkoutIds.length > 1 ? 's' : ''}?`,
      message: `Are you sure you want to delete ${selectedWorkoutIds.length} workout${selectedWorkoutIds.length > 1 ? 's' : ''}? This cannot be undone.`,
      confirmText: 'Delete All',
      icon: 'barbell',
      iconColor: '#FF3B30',
      onConfirm: async () => {
        await deleteMultipleWorkouts(selectedWorkoutIds);
        clearWorkoutSelection();
      },
    });
  };

  const handleCheckboxPress = (workoutId: string) => {
    lightHaptic();
    toggleWorkoutSelection(workoutId);
  };

  const handleWorkoutPress = (item: WorkoutLog) => {
    // If we have a selection callback (desktop master-detail mode), use it
    if (onSelectWorkout) {
      onSelectWorkout(item.id);
    } else {
      // Otherwise, navigate (mobile mode)
      navigation.navigate('WorkoutDetail', { workoutId: item.id });
    }
  };

  const renderWorkoutItem = ({ item }: { item: WorkoutLog }) => {
    const totalSets = item.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: variant === 'list' ? undefined : 'numeric',
    });
    const isSelected = selectedWorkoutId === item.id;

    // In list variant, use a simpler card without swipe
    if (variant === 'list') {
      const isChecked = selectedWorkoutIds.includes(item.id);
      return (
        <View style={styles.listItemRow}>
          {/* Checkbox (web only) */}
          {isWeb && (
            <Pressable
              style={({ pressed }) => [
                styles.checkbox,
                isChecked && styles.checkboxChecked,
                pressed && styles.checkboxPressed,
              ]}
              onPress={() => handleCheckboxPress(item.id)}
            >
              {isChecked && (
                <Ionicons name="checkmark" size={14} color={colors.text} />
              )}
            </Pressable>
          )}
          <TouchableOpacity
            onPress={() => handleWorkoutPress(item)}
            activeOpacity={0.7}
            style={[styles.listItem, isSelected && styles.listItemSelected, isWeb && styles.listItemWithCheckbox]}
          >
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.workoutDate}>{formattedDate}</Text>
            </View>
            <Text style={styles.workoutDetail} numberOfLines={1}>
              {item.exercises.length} exercises • {totalSets} sets
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <SwipeableRow
        onEdit={() => {
          openEditWorkout(item);
        }}
        onDelete={() => handleDeleteWorkout(item.id, item.name)}
      >
        <TouchableOpacity
          onPress={() => handleWorkoutPress(item)}
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

  // For compact/list variants, show fewer items
  const displayWorkouts = variant === 'compact' ? workouts.slice(0, 5) : workouts;

  // Hide FAB in list variant (master panel)
  const showFAB = variant !== 'list';

  return (
    <View style={[styles.container, variant === 'list' && styles.containerList]}>
      <FlatList
        data={displayWorkouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          variant === 'list' ? styles.listContainerCompact : styles.listContainer,
          variant !== 'list' && { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={[styles.emptyContainer, variant === 'list' && styles.emptyContainerCompact]}>
            <Ionicons name="barbell-outline" size={variant === 'list' ? 48 : 64} color="#CCC" />
            <Text style={styles.emptyText}>No workouts yet</Text>
            {variant !== 'list' && (
              <Text style={styles.emptySubtext}>
                Tap the button below to log your first workout
              </Text>
            )}
          </View>
        }
      />
      {showFAB && (
        <ExpandableFAB
          actions={[
            {
              icon: 'add',
              label: 'New Workout',
              onPress: () => {
                lightHaptic();
                navigation.navigate('QuickStart');
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
      )}

      {/* Multi-select toolbar (web only, list variant) */}
      {variant === 'list' && (
        <SelectionToolbar
          selectedCount={selectedWorkoutIds.length}
          totalCount={displayWorkouts.length}
          onSelectAll={() => selectAllWorkouts(displayWorkouts.map((w) => w.id))}
          onClear={clearWorkoutSelection}
          onDelete={handleBatchDelete}
          itemLabel="workout"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerList: {
    backgroundColor: 'transparent',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  listContainerCompact: {
    padding: 12,
    paddingBottom: 12,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxPressed: {
    opacity: 0.7,
  },
  listItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  listItemWithCheckbox: {
    marginBottom: 0,
  },
  listItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: colors.primary,
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
  emptyContainerCompact: {
    paddingVertical: 40,
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
