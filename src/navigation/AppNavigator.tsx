import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

// Screens
import TodayScreen from '../screens/TodayScreen';
import WorkoutsStack from './WorkoutsStack';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Global Modals
import GlobalModals from '../components/GlobalModals';

export type RootTabParamList = {
  Today: undefined;
  Workouts: undefined;
  Analytics: undefined;
  Nutrition: undefined;
  Achievements: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const AppNavigator = () => {
  return (
    <NavigationContainer theme={CustomDarkTheme}>
      <GlobalModals />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            let iconColor = color;

            if (route.name === 'Today') {
              iconName = focused ? 'today' : 'today-outline';
              iconColor = focused ? colors.success : color;
            } else if (route.name === 'Workouts') {
              iconName = focused ? 'barbell' : 'barbell-outline';
              iconColor = focused ? colors.workout : color;
            } else if (route.name === 'Analytics') {
              iconName = focused ? 'analytics' : 'analytics-outline';
              iconColor = focused ? colors.analytics : color;
            } else if (route.name === 'Nutrition') {
              iconName = focused ? 'nutrition' : 'nutrition-outline';
              iconColor = focused ? colors.nutrition : color;
            } else if (route.name === 'Achievements') {
              iconName = focused ? 'trophy' : 'trophy-outline';
              iconColor = focused ? colors.gold : color;
            } else {
              iconName = focused ? 'person' : 'person-outline';
              iconColor = focused ? colors.textSecondary : color;
            }

            return <Ionicons name={iconName} size={size} color={iconColor} />;
          },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textTertiary,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: colors.text,
            letterSpacing: 0.2,
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 8,
            height: 65,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
        })}
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
          name="Analytics"
          component={AnalyticsScreen}
          options={{ headerTitle: 'Analytics' }}
        />
        <Tab.Screen
          name="Nutrition"
          component={NutritionScreen}
          options={{ headerTitle: 'Nutrition' }}
        />
        <Tab.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{ headerTitle: 'Achievements' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerTitle: 'Profile' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
