import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import TodayScreen from '../screens/TodayScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import ProfileScreen from '../screens/ProfileScreen';

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
    primary: '#0A84FF',
    background: '#0A0A0A',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#38383A',
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
              iconColor = focused ? '#30D158' : color;
            } else if (route.name === 'Workouts') {
              iconName = focused ? 'barbell' : 'barbell-outline';
              iconColor = focused ? '#0A84FF' : color;
            } else if (route.name === 'Nutrition') {
              iconName = focused ? 'nutrition' : 'nutrition-outline';
              iconColor = focused ? '#FF453A' : color;
            } else {
              iconName = focused ? 'person' : 'person-outline';
              iconColor = focused ? '#BF5AF2' : color;
            }

            return <Ionicons name={iconName} size={size} color={iconColor} />;
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#98989D',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1C1C1E',
            borderBottomWidth: 1,
            borderBottomColor: '#38383A',
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: '#FFFFFF',
            letterSpacing: 0.2,
          },
          tabBarStyle: {
            backgroundColor: '#1C1C1E',
            borderTopColor: '#38383A',
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
          component={WorkoutsScreen}
          options={{ headerTitle: 'Workouts' }}
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
