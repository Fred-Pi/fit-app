import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../utils/theme';

// Components
import ErrorBoundary from '../components/ErrorBoundary';
import CustomTabBar from '../components/CustomTabBar';

// Screens
import TodayScreen from '../screens/TodayScreen';
import WorkoutsStack from './WorkoutsStack';
import NutritionScreen from '../screens/NutritionScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Global Modals
import GlobalModals from '../components/GlobalModals';

export type RootTabParamList = {
  Today: undefined;
  Workouts: undefined;
  Nutrition: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const AppNavigator = () => {
  return (
    <>
      <GlobalModals />
      <ErrorBoundary>
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.background,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 20,
              color: colors.text,
              letterSpacing: 0.3,
            },
            headerTitleAlign: 'left',
            headerLeftContainerStyle: {
              paddingLeft: 8,
            },
          }}
        >
          <Tab.Screen
            name="Today"
            component={TodayScreen}
            options={{ headerTitle: 'Today' }}
          />
          <Tab.Screen
            name="Workouts"
            component={WorkoutsStack}
            options={{ headerShown: false }}
          />
          <Tab.Screen
            name="Nutrition"
            component={NutritionScreen}
            options={{ headerTitle: 'Nutrition' }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerTitle: 'Profile' }}
          />
        </Tab.Navigator>
      </ErrorBoundary>
    </>
  );
};

export default AppNavigator;
