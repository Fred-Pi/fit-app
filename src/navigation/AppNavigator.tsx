import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import TodayScreen from '../screens/TodayScreen';
import WorkoutsStack from './WorkoutsStack';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootTabParamList = {
  Today: undefined;
  Workouts: undefined;
  Analytics: undefined;
  Nutrition: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#3A9BFF',
    background: '#0E0E14',
    card: '#1E1E22',
    text: '#FFFFFF',
    border: '#3A3A42',
  },
};

const AppNavigator = () => {
  return (
    <NavigationContainer theme={CustomDarkTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            let iconColor = color;

            if (route.name === 'Today') {
              iconName = focused ? 'today' : 'today-outline';
              iconColor = focused ? '#32D760' : color;
            } else if (route.name === 'Workouts') {
              iconName = focused ? 'barbell' : 'barbell-outline';
              iconColor = focused ? '#3A9BFF' : color;
            } else if (route.name === 'Analytics') {
              iconName = focused ? 'analytics' : 'analytics-outline';
              iconColor = focused ? '#FF9500' : color;
            } else if (route.name === 'Nutrition') {
              iconName = focused ? 'nutrition' : 'nutrition-outline';
              iconColor = focused ? '#FF5E6D' : color;
            } else {
              iconName = focused ? 'person' : 'person-outline';
              iconColor = focused ? '#BF5AF2' : color;
            }

            return <Ionicons name={iconName} size={size} color={iconColor} />;
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#A0A0A8',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1E1E22',
            borderBottomWidth: 1,
            borderBottomColor: '#3A3A42',
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: '#FFFFFF',
            letterSpacing: 0.2,
          },
          tabBarStyle: {
            backgroundColor: '#1E1E22',
            borderTopColor: '#3A3A42',
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
          name="Profile"
          component={ProfileScreen}
          options={{ headerTitle: 'Profile' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
