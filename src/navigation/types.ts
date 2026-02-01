/**
 * Navigation Types
 *
 * Centralized type definitions for navigation throughout the app.
 * This ensures type-safe navigation without using `any`.
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkoutsStackParamList } from './WorkoutsStack';

/**
 * Root-level param list that includes nested navigators
 */
export type RootTabParamList = {
  Today: undefined;
  Workouts: NavigatorScreenParams<WorkoutsStackParamList>;
  Nutrition: undefined;
  Profile: undefined;
};

/**
 * Navigation prop for components/screens that need to navigate across the app
 * Uses the root tab param list which includes nested WorkoutsStack
 */
export type AppNavigationProp = NativeStackNavigationProp<RootTabParamList>;

/**
 * Re-export param lists for convenience
 */
export type { WorkoutsStackParamList } from './WorkoutsStack';
export type { MobileTabParamList } from '../layouts/MobileLayout';
