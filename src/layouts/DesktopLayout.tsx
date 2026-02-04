import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createStackNavigator } from '@react-navigation/stack';
import { colors, glass, spacing, typography, radius, getResponsiveTypography } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';
import DesktopSidebar, { NavItem } from './DesktopSidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import GlobalModals from '../components/GlobalModals';
import WorkoutDetailPanel from '../components/WorkoutDetailPanel';
import MealDetailPanel from '../components/MealDetailPanel';
import { useUIStore } from '../stores';
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

// Desktop renders screens directly without nested navigation
// Workouts section uses master-detail pattern

interface DesktopLayoutProps {
  initialRoute?: NavItem;
}

// Stack navigator for desktop workout flow
type DesktopWorkoutStackParamList = {
  QuickStart: undefined;
  ActiveWorkout: { templateId?: string; repeatWorkoutId?: string };
  WorkoutComplete: undefined;
};

const WorkoutStack = createStackNavigator<DesktopWorkoutStackParamList>();

// Context to control showing/hiding the workout flow overlay
export const DesktopWorkoutOverlayContext = React.createContext<{
  showWorkoutFlow: boolean;
  openWorkoutFlow: () => void;
  closeWorkoutFlow: () => void;
} | null>(null);

// Desktop workout flow navigator component
const DesktopWorkoutFlowNavigator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <View style={styles.workoutFlowOverlay}>
      <WorkoutStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <WorkoutStack.Screen
          name="QuickStart"
          component={QuickStartScreen}
          options={{
            headerTitle: 'Start Workout',
            headerLeft: () => (
              <TouchableOpacity onPress={onClose} style={{ marginLeft: 16 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <WorkoutStack.Screen
          name="ActiveWorkout"
          component={ActiveWorkoutScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
          listeners={{
            beforeRemove: (e) => {
              // When navigating back from ActiveWorkout (after discard), close overlay
              if (e.data.action.type === 'GO_BACK') {
                onClose();
              }
            },
          }}
        />
        <WorkoutStack.Screen
          name="WorkoutComplete"
          component={WorkoutCompleteScreen}
          options={{
            headerTitle: 'Workout Complete',
            headerLeft: () => null,
            gestureEnabled: false,
          }}
          listeners={{
            beforeRemove: () => {
              // Close overlay when leaving WorkoutComplete
              onClose();
            },
          }}
        />
      </WorkoutStack.Navigator>
    </View>
  );
};

const DesktopLayout: React.FC<DesktopLayoutProps> = ({ initialRoute = 'Log' }) => {
  const [activeItem, setActiveItem] = useState<NavItem>(initialRoute);
  const [showWorkoutFlow, setShowWorkoutFlow] = useState(false);

  const handleNavigate = useCallback((item: NavItem) => {
    setActiveItem(item);
  }, []);

  const openWorkoutFlow = useCallback(() => {
    setShowWorkoutFlow(true);
  }, []);

  const closeWorkoutFlow = useCallback(() => {
    setShowWorkoutFlow(false);
  }, []);

  const overlayContext = {
    showWorkoutFlow,
    openWorkoutFlow,
    closeWorkoutFlow,
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'Log':
        return <LogSection onStartWorkout={openWorkoutFlow} />;
      case 'Workouts':
        return <WorkoutsSection onStartWorkout={openWorkoutFlow} />;
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

  return (
    <DesktopWorkoutOverlayContext.Provider value={overlayContext}>
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

        {showWorkoutFlow && <DesktopWorkoutFlowNavigator onClose={closeWorkoutFlow} />}
      </View>
    </DesktopWorkoutOverlayContext.Provider>
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
});

export default DesktopLayout;
