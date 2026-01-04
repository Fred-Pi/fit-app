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

            if (route.name === 'Today') {
              iconName = focused ? 'today' : 'today-outline';
            } else if (route.name === 'Workouts') {
              iconName = focused ? 'barbell' : 'barbell-outline';
            } else if (route.name === 'Nutrition') {
              iconName = focused ? 'nutrition' : 'nutrition-outline';
            } else {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#0A84FF',
          tabBarInactiveTintColor: '#98989D',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1C1C1E',
            borderBottomWidth: 1,
            borderBottomColor: '#38383A',
          },
          headerTitleStyle: {
            fontWeight: '600',
            color: '#FFFFFF',
          },
          tabBarStyle: {
            backgroundColor: '#1C1C1E',
            borderTopColor: '#38383A',
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
