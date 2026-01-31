import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, spacing, typography, radius } from '../utils/theme';
import DesktopSidebar, { NavItem } from './DesktopSidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import GlobalModals from '../components/GlobalModals';
import WorkoutDetailPanel from '../components/WorkoutDetailPanel';
import MealDetailPanel from '../components/MealDetailPanel';
import { useUIStore } from '../stores';

// Screens
import TodayScreen from '../screens/TodayScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Desktop renders screens directly without nested navigation
// Workouts section uses master-detail pattern

interface DesktopLayoutProps {
  initialRoute?: NavItem;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({ initialRoute = 'Log' }) => {
  const [activeItem, setActiveItem] = useState<NavItem>(initialRoute);

  const handleNavigate = useCallback((item: NavItem) => {
    setActiveItem(item);
  }, []);

  const renderContent = () => {
    switch (activeItem) {
      case 'Log':
        return <LogSection />;
      case 'Workouts':
        return <WorkoutsSection />;
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
    </View>
  );
};

// Log section: Dashboard layout with quick stats
const LogSection: React.FC = () => {
  return <TodayScreen variant="dashboard" />;
};

// Workouts section: Master-detail layout
const WorkoutsSection: React.FC = () => {
  const selectedWorkoutId = useUIStore((s) => s.selectedWorkoutId);
  const selectWorkout = useUIStore((s) => s.selectWorkout);

  return (
    <View style={styles.masterDetailContainer}>
      {/* Master: Workout List */}
      <View style={styles.masterPanel}>
        <WorkoutsScreen variant="list" onSelectWorkout={selectWorkout} selectedWorkoutId={selectedWorkoutId} />
      </View>

      {/* Detail: Selected Workout */}
      <View style={styles.detailPanel}>
        {selectedWorkoutId ? (
          <WorkoutDetailPanel
            workoutId={selectedWorkoutId}
            onClose={() => selectWorkout(null)}
          />
        ) : (
          <View style={styles.emptyDetail}>
            <Ionicons name="barbell-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyDetailTitle}>Select a workout</Text>
            <Text style={styles.emptyDetailText}>
              Click on a workout from the list to view its details
            </Text>
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

  return (
    <View style={styles.masterDetailContainer}>
      {/* Master: Meal List */}
      <View style={styles.masterPanel}>
        <NutritionScreen variant="list" onSelectMeal={selectMeal} selectedMealId={selectedMealId} />
      </View>

      {/* Detail: Selected Meal */}
      <View style={styles.detailPanel}>
        {selectedMealId ? (
          <MealDetailPanel
            mealId={selectedMealId}
            onClose={() => selectMeal(null)}
          />
        ) : (
          <View style={styles.emptyDetail}>
            <Ionicons name="nutrition-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyDetailTitle}>Select a meal</Text>
            <Text style={styles.emptyDetailText}>
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
});

export default DesktopLayout;
