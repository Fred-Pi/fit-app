import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, spacing, typography, radius, getResponsiveTypography } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';
import DesktopSidebar, { NavItem } from './DesktopSidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import GlobalModals from '../components/GlobalModals';
import WorkoutDetailPanel from '../components/WorkoutDetailPanel';
import MealDetailPanel from '../components/MealDetailPanel';
import { useUIStore, useActiveWorkoutStore } from '../stores';
import { lightHaptic } from '../utils/haptics';

// Screens
import TodayScreen from '../screens/TodayScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Workout flow screens
import QuickStartScreen from '../screens/QuickStartScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import WorkoutCompleteScreen from '../screens/WorkoutCompleteScreen';

// Workout flow state type
type WorkoutFlowScreen = 'none' | 'quickstart' | 'active' | 'complete';

// Desktop renders screens directly without nested navigation
// Workouts section uses master-detail pattern

interface DesktopLayoutProps {
  initialRoute?: NavItem;
}

// Context for desktop workout flow navigation
export const DesktopWorkoutFlowContext = React.createContext<{
  currentScreen: WorkoutFlowScreen;
  goToQuickStart: () => void;
  goToActiveWorkout: () => void;
  goToComplete: () => void;
  exitFlow: () => void;
} | null>(null);

const DesktopLayout: React.FC<DesktopLayoutProps> = ({ initialRoute = 'Log' }) => {
  const [activeItem, setActiveItem] = useState<NavItem>(initialRoute);
  const [workoutFlowScreen, setWorkoutFlowScreen] = useState<WorkoutFlowScreen>('none');

  const handleNavigate = useCallback((item: NavItem) => {
    setActiveItem(item);
  }, []);

  // Workout flow navigation functions
  const workoutFlowNav = {
    currentScreen: workoutFlowScreen,
    goToQuickStart: () => setWorkoutFlowScreen('quickstart'),
    goToActiveWorkout: () => setWorkoutFlowScreen('active'),
    goToComplete: () => setWorkoutFlowScreen('complete'),
    exitFlow: () => setWorkoutFlowScreen('none'),
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'Log':
        return <LogSection onStartWorkout={() => setWorkoutFlowScreen('quickstart')} />;
      case 'Workouts':
        return <WorkoutsSection onStartWorkout={() => setWorkoutFlowScreen('quickstart')} />;
      case 'Progress':
        return <ProgressSection />;
      case 'Nutrition':
        return <NutritionSection />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return null;
    }
  };

  // Render workout flow overlay
  const renderWorkoutFlowOverlay = () => {
    if (workoutFlowScreen === 'none') return null;

    return (
      <View style={styles.workoutFlowOverlay}>
        <DesktopWorkoutFlowContext.Provider value={workoutFlowNav}>
          {workoutFlowScreen === 'quickstart' && <DesktopQuickStart />}
          {workoutFlowScreen === 'active' && <DesktopActiveWorkout />}
          {workoutFlowScreen === 'complete' && <DesktopWorkoutComplete />}
        </DesktopWorkoutFlowContext.Provider>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GlobalModals />
      <DesktopSidebar activeItem={activeItem} onNavigate={handleNavigate} />

      <View style={styles.contentArea}>
        <ErrorBoundary>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
        </ErrorBoundary>
      </View>

      {renderWorkoutFlowOverlay()}
    </View>
  );
};

// Log section: Dashboard layout with quick stats
const LogSection: React.FC<{ onStartWorkout: () => void }> = ({ onStartWorkout }) => {
  return <TodayScreen variant="dashboard" onStartWorkout={onStartWorkout} />;
};

// Workouts section: Master-detail layout
const WorkoutsSection: React.FC<{ onStartWorkout: () => void }> = ({ onStartWorkout }) => {
  const selectedWorkoutId = useUIStore((s) => s.selectedWorkoutId);
  const selectWorkout = useUIStore((s) => s.selectWorkout);
  const selectedWorkoutIds = useUIStore((s) => s.selectedWorkoutIds);
  const { typographyScale } = useResponsive();
  const scaledType = getResponsiveTypography(typographyScale);

  const hasMultipleSelected = selectedWorkoutIds.length > 1;

  const handleStartWorkout = () => {
    lightHaptic();
    onStartWorkout();
  };

  return (
    <View style={styles.masterDetailContainer}>
      {/* Master: Workout List */}
      <View style={styles.masterPanel}>
        <WorkoutsScreen variant="list" onSelectWorkout={selectWorkout} selectedWorkoutId={selectedWorkoutId} />
      </View>

      {/* Detail: Selected Workout */}
      <View style={styles.detailPanel}>
        {hasMultipleSelected ? (
          <View style={styles.emptyDetail}>
            <View style={styles.multiSelectBadge}>
              <Text style={[styles.multiSelectCount, { fontSize: scaledType['2xl'] }]}>
                {selectedWorkoutIds.length}
              </Text>
            </View>
            <Text style={[styles.emptyDetailTitle, { fontSize: scaledType.xl }]}>
              {selectedWorkoutIds.length} workouts selected
            </Text>
            <Text style={[styles.emptyDetailText, { fontSize: scaledType.base }]}>
              Use the toolbar below to delete selected items, or click a checkbox to deselect
            </Text>
          </View>
        ) : selectedWorkoutId ? (
          <WorkoutDetailPanel
            workoutId={selectedWorkoutId}
            onClose={() => selectWorkout(null)}
          />
        ) : (
          <View style={styles.emptyDetail}>
            <Ionicons name="barbell-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyDetailTitle, { fontSize: scaledType.xl }]}>Select a workout</Text>
            <Text style={[styles.emptyDetailText, { fontSize: scaledType.base }]}>
              Click on a workout from the list to view its details
            </Text>
            <TouchableOpacity style={styles.newWorkoutButton} onPress={handleStartWorkout}>
              <Ionicons name="add" size={20} color={colors.text} />
              <Text style={styles.newWorkoutButtonText}>Start New Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// Progress section: Analytics + history
const ProgressSection: React.FC = () => {
  return (
    <View style={styles.section}>
      <AnalyticsScreen />
    </View>
  );
};

// Nutrition section: Master-detail layout
const NutritionSection: React.FC = () => {
  const selectedMealId = useUIStore((s) => s.selectedMealId);
  const selectMeal = useUIStore((s) => s.selectMeal);
  const selectedMealIds = useUIStore((s) => s.selectedMealIds);
  const { typographyScale } = useResponsive();
  const scaledType = getResponsiveTypography(typographyScale);

  const hasMultipleSelected = selectedMealIds.length > 1;

  return (
    <View style={styles.masterDetailContainer}>
      {/* Master: Meal List */}
      <View style={styles.masterPanel}>
        <NutritionScreen variant="list" onSelectMeal={selectMeal} selectedMealId={selectedMealId} />
      </View>

      {/* Detail: Selected Meal */}
      <View style={styles.detailPanel}>
        {hasMultipleSelected ? (
          <View style={styles.emptyDetail}>
            <View style={styles.multiSelectBadge}>
              <Text style={[styles.multiSelectCount, { fontSize: scaledType['2xl'] }]}>
                {selectedMealIds.length}
              </Text>
            </View>
            <Text style={[styles.emptyDetailTitle, { fontSize: scaledType.xl }]}>
              {selectedMealIds.length} meals selected
            </Text>
            <Text style={[styles.emptyDetailText, { fontSize: scaledType.base }]}>
              Use the toolbar below to delete selected items, or click a checkbox to deselect
            </Text>
          </View>
        ) : selectedMealId ? (
          <MealDetailPanel
            mealId={selectedMealId}
            onClose={() => selectMeal(null)}
          />
        ) : (
          <View style={styles.emptyDetail}>
            <Ionicons name="nutrition-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyDetailTitle, { fontSize: scaledType.xl }]}>Select a meal</Text>
            <Text style={[styles.emptyDetailText, { fontSize: scaledType.base }]}>
              Click on a meal from the list to view its details
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Desktop-specific workout flow wrapper components
const DesktopQuickStart: React.FC = () => {
  const flowContext = React.useContext(DesktopWorkoutFlowContext);
  const startWorkout = useActiveWorkoutStore((s) => s.startWorkout);
  const startFromRecent = useActiveWorkoutStore((s) => s.startFromRecent);
  const templates = useWorkoutStore((s) => s.templates);
  const getRecentWorkouts = useWorkoutStore((s) => s.getRecentWorkouts);
  const recentWorkouts = getRecentWorkouts(5);

  const handleStartFresh = () => {
    lightHaptic();
    startWorkout(null);
    flowContext?.goToActiveWorkout();
  };

  const handleSelectTemplate = (template: any) => {
    lightHaptic();
    startWorkout(template);
    flowContext?.goToActiveWorkout();
  };

  const handleRepeatWorkout = (workout: any) => {
    lightHaptic();
    startFromRecent(workout);
    flowContext?.goToActiveWorkout();
  };

  return (
    <View style={styles.workoutFlowContainer}>
      <View style={styles.workoutFlowHeader}>
        <TouchableOpacity onPress={flowContext?.exitFlow} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.workoutFlowTitle}>Start Workout</Text>
      </View>
      <ScrollView style={styles.workoutFlowScroll} contentContainerStyle={styles.workoutFlowScrollContent}>
        <TouchableOpacity style={styles.startFreshButton} onPress={handleStartFresh}>
          <Ionicons name="add-circle" size={32} color={colors.primary} />
          <Text style={styles.startFreshText}>Start Fresh</Text>
        </TouchableOpacity>

        {templates.length > 0 && (
          <View style={styles.flowSection}>
            <Text style={styles.flowSectionTitle}>Templates</Text>
            {templates.map((t: any) => (
              <TouchableOpacity key={t.id} style={styles.flowListItem} onPress={() => handleSelectTemplate(t)}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text style={styles.flowListItemText}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {recentWorkouts.length > 0 && (
          <View style={styles.flowSection}>
            <Text style={styles.flowSectionTitle}>Recent Workouts</Text>
            {recentWorkouts.map((w: any) => (
              <TouchableOpacity key={w.id} style={styles.flowListItem} onPress={() => handleRepeatWorkout(w)}>
                <Ionicons name="refresh" size={20} color={colors.success} />
                <Text style={styles.flowListItemText}>{w.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const DesktopActiveWorkout: React.FC = () => {
  const flowContext = React.useContext(DesktopWorkoutFlowContext);
  const {
    workoutName,
    exercises,
    finishWorkout,
    discardWorkout,
    addExercise,
    hasActiveWorkout,
  } = useActiveWorkoutStore();

  const handleFinish = () => {
    lightHaptic();
    flowContext?.goToComplete();
  };

  const handleDiscard = () => {
    discardWorkout();
    flowContext?.exitFlow();
  };

  if (!hasActiveWorkout) {
    return (
      <View style={styles.workoutFlowContainer}>
        <Text style={styles.workoutFlowTitle}>No active workout</Text>
        <TouchableOpacity onPress={flowContext?.exitFlow}>
          <Text style={styles.flowLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.workoutFlowContainer}>
      <View style={styles.workoutFlowHeader}>
        <TouchableOpacity onPress={handleDiscard} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.error} />
        </TouchableOpacity>
        <Text style={styles.workoutFlowTitle}>{workoutName || 'Workout'}</Text>
        <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.workoutFlowScroll} contentContainerStyle={styles.workoutFlowScrollContent}>
        {exercises.map((ex: any) => (
          <View key={ex.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
            <Text style={styles.exerciseSets}>{ex.sets.length} sets</Text>
          </View>
        ))}
        <Text style={styles.flowHint}>
          Use the mobile view for full workout tracking features
        </Text>
      </ScrollView>
    </View>
  );
};

const DesktopWorkoutComplete: React.FC = () => {
  const flowContext = React.useContext(DesktopWorkoutFlowContext);
  const { finishWorkout, getWorkoutDuration, getTotalSets, getCompletedSets, exercises } = useActiveWorkoutStore();
  const addWorkout = useWorkoutStore((s) => s.addWorkout);

  const handleSave = async () => {
    const workoutLog = finishWorkout();
    await addWorkout(workoutLog);
    flowContext?.exitFlow();
  };

  return (
    <View style={styles.workoutFlowContainer}>
      <View style={styles.workoutFlowHeader}>
        <View style={styles.closeButton} />
        <Text style={styles.workoutFlowTitle}>Workout Complete!</Text>
        <View style={styles.closeButton} />
      </View>
      <ScrollView style={styles.workoutFlowScroll} contentContainerStyle={styles.workoutFlowScrollContent}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} style={{ alignSelf: 'center' }} />
        <Text style={styles.completeStats}>
          {exercises.length} exercises • {getCompletedSets()}/{getTotalSets()} sets
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discardLink} onPress={flowContext?.exitFlow}>
          <Text style={styles.flowLinkText}>Discard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Import workoutStore for desktop components
import { useWorkoutStore } from '../stores';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  contentArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    maxWidth: 1400,
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing['2xl'],
  },
  section: {
    flex: 1,
  },

  // Master-Detail Layout
  masterDetailContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xl,
    minHeight: 600,
  },
  masterPanel: {
    flex: 1,
    maxWidth: 400,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: glass.border,
    overflow: 'hidden',
  },
  detailPanel: {
    flex: 2,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: glass.border,
    overflow: 'hidden',
  },
  emptyDetail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  emptyDetailTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyDetailText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  multiSelectBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  multiSelectCount: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  newWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
  },
  newWorkoutButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },

  // Workout Flow Overlay
  workoutFlowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 100,
  },
  workoutFlowContainer: {
    flex: 1,
    maxWidth: 600,
    marginHorizontal: 'auto',
    width: '100%',
  },
  workoutFlowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  workoutFlowTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.success,
    borderRadius: radius.md,
  },
  finishButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  workoutFlowScroll: {
    flex: 1,
  },
  workoutFlowScrollContent: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
  startFreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
  },
  startFreshText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  flowSection: {
    marginBottom: spacing.xl,
  },
  flowSectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  flowListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  flowListItemText: {
    fontSize: typography.size.base,
    color: colors.text,
  },
  exerciseCard: {
    padding: spacing.lg,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  exerciseName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  exerciseSets: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  flowHint: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  flowLinkText: {
    fontSize: typography.size.base,
    color: colors.primary,
    textAlign: 'center',
  },
  completeStats: {
    fontSize: typography.size.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  saveButton: {
    padding: spacing.lg,
    backgroundColor: colors.success,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  discardLink: {
    padding: spacing.md,
    alignItems: 'center',
  },
});

export default DesktopLayout;
