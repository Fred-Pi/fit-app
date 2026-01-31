import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import QuickStartScreen from '../screens/QuickStartScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import WorkoutCompleteScreen from '../screens/WorkoutCompleteScreen';

export type WorkoutsStackParamList = {
  WorkoutsList: undefined;
  WorkoutDetail: { workoutId: string };
  ExerciseLibrary: undefined;
  ExerciseDetail: { exerciseId: string };
  Analytics: undefined;
  // New workout flow screens
  QuickStart: undefined;
  ActiveWorkout: {
    templateId?: string;
    repeatWorkoutId?: string;
  };
  WorkoutComplete: undefined;
};

const Stack = createStackNavigator<WorkoutsStackParamList>();

const WorkoutsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="WorkoutsList" component={WorkoutsScreen} />
      <Stack.Screen
        name="WorkoutDetail"
        component={WorkoutDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Workout Details',
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
          headerTintColor: '#3A9BFF',
        }}
      />
      <Stack.Screen
        name="ExerciseLibrary"
        component={ExerciseLibraryScreen}
        options={{
          headerShown: true,
          headerTitle: 'Exercise Library',
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
          headerTintColor: '#3A9BFF',
        }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Exercise Details',
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
          headerTintColor: '#3A9BFF',
        }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Analytics',
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
          headerTintColor: '#3A9BFF',
        }}
      />
      {/* New Workout Flow Screens */}
      <Stack.Screen
        name="QuickStart"
        component={QuickStartScreen}
        options={{
          headerShown: true,
          headerTitle: 'Start Workout',
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
          headerTintColor: '#3A9BFF',
        }}
      />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="WorkoutComplete"
        component={WorkoutCompleteScreen}
        options={{
          headerShown: true,
          headerTitle: 'Workout Complete',
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
          headerTintColor: '#3A9BFF',
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default WorkoutsStack;
