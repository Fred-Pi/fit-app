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
import AddWorkoutModal from '../components/AddWorkoutModal';
import AddMealModal from '../components/AddMealModal';
import {
  getUser,
  getWorkoutsByDate,
  getNutritionByDate,
  getStepsByDate,
  getTodayDate,
  generateId,
  saveNutrition,
  saveSteps,
  saveWorkout,
} from '../services/storage';
import { User, WorkoutLog, DailyNutrition, DailySteps, Meal } from '../types';

const TodayScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [date] = useState(getTodayDate());
  const [workout, setWorkout] = useState<WorkoutLog | null>(null);
  const [nutrition, setNutrition] = useState<DailyNutrition | null>(null);
  const [steps, setSteps] = useState<DailySteps | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpdateStepsModal, setShowUpdateStepsModal] = useState(false);
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);

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

  const handleAddWorkout = async (newWorkout: WorkoutLog) => {
    await saveWorkout(newWorkout);
    setWorkout(newWorkout);
    setShowAddWorkoutModal(false);
  };

  const handleAddMeal = async (meal: Meal) => {
    if (!nutrition) return;

    const updatedNutrition: DailyNutrition = {
      ...nutrition,
      meals: [...nutrition.meals, meal],
    };

    await saveNutrition(updatedNutrition);
    setNutrition(updatedNutrition);
    setShowAddMealModal(false);
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddWorkoutModal(true)}
          >
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddMealModal(true)}
          >
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

      {user && (
        <AddWorkoutModal
          visible={showAddWorkoutModal}
          onClose={() => setShowAddWorkoutModal(false)}
          onSave={handleAddWorkout}
          date={date}
          userId={user.id}
        />
      )}

      <AddMealModal
        visible={showAddMealModal}
        onClose={() => setShowAddMealModal(false)}
        onSave={handleAddMeal}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E14',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#38383A',
  },
  dateText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
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
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38383A',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A84FF',
    letterSpacing: 0.2,
  },
});

export default TodayScreen;
