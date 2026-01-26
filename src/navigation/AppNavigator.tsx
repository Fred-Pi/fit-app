import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glass } from '../utils/theme';

// Components
import ErrorBoundary from '../components/ErrorBoundary';
import CustomTabBar from '../components/CustomTabBar';
import AnimatedBackground from '../components/AnimatedBackground';

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
    border: 'transparent',
  },
};

// Custom header background with subtle transparency
const HeaderBackground = () => (
  <LinearGradient
    colors={['rgba(24, 24, 27, 0.8)', 'rgba(24, 24, 27, 0.4)', 'transparent']}
    style={StyleSheet.absoluteFill}
  />
);

const AppNavigator = () => {
  return (
    <NavigationContainer theme={CustomDarkTheme}>
      <AnimatedBackground>
        <GlobalModals />
        <ErrorBoundary>
          <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
              headerShown: true,
              headerTransparent: true,
              headerStyle: {
                backgroundColor: 'transparent',
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0,
              },
              headerBackground: () => <HeaderBackground />,
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
              sceneStyle: {
                backgroundColor: 'transparent',
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
      </AnimatedBackground>
    </NavigationContainer>
  );
};

export default AppNavigator;
