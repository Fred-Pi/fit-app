import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../utils/theme';
import DesktopSidebar, { NavItem, SIDEBAR_WIDTH } from './DesktopSidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import GlobalModals from '../components/GlobalModals';

// Screens
import TodayScreen from '../screens/TodayScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Desktop renders screens directly without nested navigation
// Drill-down views (WorkoutDetail, ExerciseDetail) open in modals or panels

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
      case 'Progress':
        return <ProgressSection />;
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

// Log section: Today + quick access to workouts and nutrition
const LogSection: React.FC = () => {
  return (
    <View style={styles.section}>
      <View style={styles.twoColumnLayout}>
        <View style={styles.mainColumn}>
          <TodayScreen />
        </View>
        <View style={styles.sideColumn}>
          <WorkoutsScreen />
        </View>
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
  twoColumnLayout: {
    flexDirection: 'row',
    gap: spacing['3xl'],
  },
  mainColumn: {
    flex: 2,
    minWidth: 400,
  },
  sideColumn: {
    flex: 1,
    minWidth: 320,
    maxWidth: 400,
  },
});

export default DesktopLayout;
