import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import UpdateStepsModal from '../components/UpdateStepsModal';
import {
  getUser,
  getWorkoutsByDate,
  getNutritionByDate,
  getStepsByDate,
  getTodayDate,
  generateId,
  saveNutrition,
  saveSteps,
} from '../services/storage';
import { User, WorkoutLog, DailyNutrition, DailySteps } from '../types';

const TodayScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [date] = useState(getTodayDate());
  const [workout, setWorkout] = useState<WorkoutLog | null>(null);
  const [nutrition, setNutrition] = useState<DailyNutrition | null>(null);
  const [steps, setSteps] = useState<DailySteps | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpdateStepsModal, setShowUpdateStepsModal] = useState(false);

  const loadData = async () => {
    try {
      const userData = await getUser();
      setUser(userData);

      const workouts = await getWorkoutsByDate(date);
      setWorkout(workouts.length > 0 ? workouts[0] : null);

      let nutritionData = await getNutritionByDate(date);
      if (!nutritionData && userData) {
        nutritionData = {
          id: generateId(),
          userId: userData.id,
          date,
          calorieTarget: userData.dailyCalorieTarget,
          meals: [],
        };
        await saveNutrition(nutritionData);
      }
      setNutrition(nutritionData);

      let stepsData = await getStepsByDate(date);
      if (!stepsData && userData) {
        stepsData = {
          id: generateId(),
          userId: userData.id,
          date,
          steps: 0,
          stepGoal: userData.dailyStepGoal,
          source: 'manual',
        };
        await saveSteps(stepsData);
      }
      setSteps(stepsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUpdateSteps = async (newSteps: number) => {
    if (!steps || !user) return;

    const updatedSteps: DailySteps = {
      ...steps,
      steps: newSteps,
    };

    await saveSteps(updatedSteps);
    setSteps(updatedSteps);
  };

  const totalCalories = nutrition?.meals.reduce((sum, meal) => sum + meal.calories, 0) || 0;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>
          {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Workout Card */}
      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="barbell" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Workout</Text>
          </View>
        </View>
        {workout ? (
          <View style={styles.workoutContent}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.workoutDetails}>
              {workout.exercises.length} exercises • {workout.completed ? 'Completed' : 'In Progress'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Log Workout</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Nutrition Card */}
      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="nutrition" size={24} color="#FF6B6B" />
            <Text style={styles.cardTitle}>Calories</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <ProgressBar
            current={totalCalories}
            target={nutrition?.calorieTarget || 2200}
            unit="cal"
            color="#FF6B6B"
          />
        </View>
        {nutrition && nutrition.meals.length > 0 ? (
          <View style={styles.mealsPreview}>
            <Text style={styles.mealsCount}>{nutrition.meals.length} meals logged</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Meal</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Steps Card */}
      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="footsteps" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Steps</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <ProgressBar
            current={steps?.steps || 0}
            target={steps?.stepGoal || 10000}
            unit="steps"
            color="#4CAF50"
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowUpdateStepsModal(true)}
        >
          <Text style={styles.addButtonText}>Update Steps</Text>
        </TouchableOpacity>
      </Card>
      </ScrollView>

      <UpdateStepsModal
        visible={showUpdateStepsModal}
        onClose={() => setShowUpdateStepsModal(false)}
        onSave={handleUpdateSteps}
        currentSteps={steps?.steps || 0}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  workoutContent: {
    marginTop: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 14,
    color: '#98989D',
  },
  progressContainer: {
    marginBottom: 12,
  },
  mealsPreview: {
    marginTop: 8,
  },
  mealsCount: {
    fontSize: 14,
    color: '#98989D',
  },
  addButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default TodayScreen;
