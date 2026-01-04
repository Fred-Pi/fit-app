import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';

export type WorkoutsStackParamList = {
  WorkoutsList: undefined;
  WorkoutDetail: { workoutId: string };
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
          headerTintColor: '#0A84FF',
        }}
      />
    </Stack.Navigator>
  );
};

export default WorkoutsStack;
