import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import UpdateStepsModal from '../components/UpdateStepsModal';
import UpdateWeightModal from '../components/UpdateWeightModal';
import AddWorkoutModal from '../components/AddWorkoutModal';
import AddMealModal from '../components/AddMealModal';
import WeeklyStatsCard from '../components/WeeklyStatsCard';
import WeightChart from '../components/WeightChart';
import StreakCard from '../components/StreakCard';
import { calculateWorkoutStreak } from '../utils/analyticsCalculations';
import {
  getUser,
  getWorkouts,
  getWorkoutsByDate,
  getNutritionByDate,
  getStepsByDate,
  getWeightByDate,
  getWeightsInRange,
  getTodayDate,
  generateId,
  saveNutrition,
  saveSteps,
  saveWeight,
  saveWorkout,
  calculateWeeklyStats,
  checkAndUpdatePRs,
  formatDate,
} from '../services/storage';
import { User, WorkoutLog, DailyNutrition, DailySteps, DailyWeight, Meal, WeeklyStats, WeekComparison } from '../types';
import { getWeekDates, getPreviousWeekDates, calculateDifference, calculatePercentageChange } from '../utils/dateUtils';

const TodayScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [date] = useState(getTodayDate());
  const [workout, setWorkout] = useState<WorkoutLog | null>(null);
  const [nutrition, setNutrition] = useState<DailyNutrition | null>(null);
  const [steps, setSteps] = useState<DailySteps | null>(null);
  const [weight, setWeight] = useState<DailyWeight | null>(null);
  const [recentWeights, setRecentWeights] = useState<DailyWeight[]>([]);
  const [currentWeekStats, setCurrentWeekStats] = useState<WeeklyStats | null>(null);
  const [previousWeekStats, setPreviousWeekStats] = useState<WeeklyStats | null>(null);
  const [weekComparison, setWeekComparison] = useState<WeekComparison | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpdateStepsModal, setShowUpdateStepsModal] = useState(false);
  const [showUpdateWeightModal, setShowUpdateWeightModal] = useState(false);
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);

  const loadWeeklyStats = async (userData: User) => {
    try {
      // Get current week dates
      const currentWeek = getWeekDates();
      const currentStats = await calculateWeeklyStats(
        currentWeek.start,
        currentWeek.end,
        userData
      );
      setCurrentWeekStats(currentStats);

      // Get previous week dates
      const previousWeek = getPreviousWeekDates();
      const previousStats = await calculateWeeklyStats(
        previousWeek.start,
        previousWeek.end,
        userData
      );
      setPreviousWeekStats(previousStats);

      // Calculate comparison
      const comparison: WeekComparison = {
        workouts: calculateDifference(currentStats.totalWorkouts, previousStats.totalWorkouts),
        calories: calculateDifference(currentStats.totalCalories, previousStats.totalCalories),
        steps: calculateDifference(currentStats.totalSteps, previousStats.totalSteps),
        workoutsPercent: calculatePercentageChange(currentStats.totalWorkouts, previousStats.totalWorkouts),
        caloriesPercent: calculatePercentageChange(currentStats.totalCalories, previousStats.totalCalories),
        stepsPercent: calculatePercentageChange(currentStats.totalSteps, previousStats.totalSteps),
      };
      setWeekComparison(comparison);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    }
  };

  const loadData = async () => {
    try {
      const userData = await getUser();
      setUser(userData);

      if (userData) {
        // Load weekly stats
        await loadWeeklyStats(userData);
      }

      // Load all workouts for streak calculation
      const allWorkouts = await getWorkouts();
      const streakData = calculateWorkoutStreak(allWorkouts);
      setCurrentStreak(streakData.current);
      setLongestStreak(streakData.longest);

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

      // Load weight data
      let weightData = await getWeightByDate(date);
      if (!weightData && userData) {
        weightData = {
          id: generateId(),
          userId: userData.id,
          date,
          weight: 0,
          unit: userData.preferredWeightUnit,
          source: 'manual',
          created: new Date().toISOString(),
        };
        await saveWeight(weightData);
      }
      setWeight(weightData);

      // Load last 30 days of weights for chart
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = formatDate(thirtyDaysAgo);
      const weights = await getWeightsInRange(startDate, date);
      setRecentWeights(weights);
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

    // Check for new PRs
    const newPRs = await checkAndUpdatePRs(newWorkout);

    setWorkout(newWorkout);
    setShowAddWorkoutModal(false);

    // Show PR notification if any were set
    if (newPRs.length > 0) {
      const prNames = newPRs.map(pr => pr.exerciseName).join(', ');
      Alert.alert(
        '🏆 New Personal Record!',
        `Congratulations! You set a new PR for: ${prNames}`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    }
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

  const handleUpdateWeight = async (newWeight: number) => {
    if (!weight || !user) return;

    const updatedWeight: DailyWeight = {
      ...weight,
      weight: newWeight,
    };

    await saveWeight(updatedWeight);
    setWeight(updatedWeight);

    // Reload recent weights for chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = formatDate(thirtyDaysAgo);
    const weights = await getWeightsInRange(startDate, date);
    setRecentWeights(weights);
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
      {/* Weekly Stats Card */}
      {currentWeekStats && (
        <WeeklyStatsCard
          currentWeek={currentWeekStats}
          previousWeek={previousWeekStats || undefined}
          comparison={weekComparison || undefined}
        />
      )}

      {/* Streak Card */}
      <StreakCard
        currentStreak={currentStreak}
        longestStreak={longestStreak}
      />

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
      <Card gradient>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="barbell" size={24} color="#00D9FF" />
            <Text style={styles.cardTitle}>Workout</Text>
          </View>
        </View>
        {workout ? (
          <View style={styles.workoutContent}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.workoutDetails}>
              {workout.exercises.length} exercises
              {workout.duration && ` • ${Math.round(workout.duration)} min`}
              {' • '}{workout.completed ? 'Completed' : 'In Progress'}
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
      <Card gradient>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="nutrition" size={24} color="#FF6B9D" />
            <Text style={styles.cardTitle}>Calories</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <ProgressBar
            current={totalCalories}
            target={nutrition?.calorieTarget || 2200}
            unit="cal"
            color="#FF6B9D"
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
      <Card gradient>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="footsteps" size={24} color="#00E676" />
            <Text style={styles.cardTitle}>Steps</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <ProgressBar
            current={steps?.steps || 0}
            target={steps?.stepGoal || 10000}
            unit="steps"
            color="#00E676"
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowUpdateStepsModal(true)}
        >
          <Text style={styles.addButtonText}>Update Steps</Text>
        </TouchableOpacity>
      </Card>

      {/* Weight Card */}
      <Card gradient>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="scale-outline" size={24} color="#FFD740" />
            <Text style={styles.cardTitle}>Body Weight</Text>
          </View>
        </View>
        {weight && weight.weight > 0 ? (
          <View>
            <View style={styles.weightDisplay}>
              <Text style={styles.weightValue}>{weight.weight.toFixed(1)}</Text>
              <Text style={styles.weightUnit}>{weight.unit}</Text>
            </View>
            <WeightChart weights={recentWeights} unit={weight.unit} goalWeight={user?.goalWeight} />
          </View>
        ) : (
          <View style={styles.emptyWeightState}>
            <Text style={styles.emptyWeightText}>Track your weight to see trends</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowUpdateWeightModal(true)}
        >
          <Text style={styles.addButtonText}>Update Weight</Text>
        </TouchableOpacity>
      </Card>
      </ScrollView>

      <UpdateStepsModal
        visible={showUpdateStepsModal}
        onClose={() => setShowUpdateStepsModal(false)}
        onSave={handleUpdateSteps}
        currentSteps={steps?.steps || 0}
      />

      <UpdateWeightModal
        visible={showUpdateWeightModal}
        onClose={() => setShowUpdateWeightModal(false)}
        onSave={handleUpdateWeight}
        currentWeight={weight?.weight || 0}
        unit={user?.preferredWeightUnit || 'lbs'}
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
    backgroundColor: '#0F1419',
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
    borderBottomWidth: 2,
    borderBottomColor: '#2D3548',
  },
  dateText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    color: '#B8C5D6',
  },
  progressContainer: {
    marginBottom: 12,
  },
  mealsPreview: {
    marginTop: 8,
  },
  mealsCount: {
    fontSize: 14,
    color: '#B8C5D6',
  },
  addButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 217, 255, 0.3)',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D9FF',
    letterSpacing: 0.2,
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFD740',
    marginRight: 8,
  },
  weightUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#B8C5D6',
  },
  emptyWeightState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyWeightText: {
    fontSize: 14,
    color: '#B8C5D6',
    textAlign: 'center',
  },
});

export default TodayScreen;
