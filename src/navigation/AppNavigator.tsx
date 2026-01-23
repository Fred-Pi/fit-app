import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

// Components
import ErrorBoundary from '../components/ErrorBoundary';

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
      <ErrorBoundary>
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
            } else if (route.name === 'Nutrition') {
              iconName = focused ? 'nutrition' : 'nutrition-outline';
              iconColor = focused ? colors.nutrition : color;
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
    </NavigationContainer>
  );
};

export default AppNavigator;
