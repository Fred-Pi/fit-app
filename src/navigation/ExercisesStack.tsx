import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen'
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen'

export type ExercisesStackParamList = {
  ExerciseLibrary: undefined
  ExerciseDetail: { exerciseId: string }
}

const Stack = createStackNavigator<ExercisesStackParamList>()

const ExercisesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
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
    >
      <Stack.Screen
        name="ExerciseLibrary"
        component={ExerciseLibraryScreen}
        options={{ headerTitle: 'Exercise Library' }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{ headerTitle: 'Exercise Details' }}
      />
    </Stack.Navigator>
  )
}

export default ExercisesStack
