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
import WorkoutSuggestionsCard from '../components/WorkoutSuggestionsCard';
import { TodayScreenSkeleton } from '../components/SkeletonLoader';
import { calculateWorkoutStreak } from '../utils/analyticsCalculations';
import { calculateWorkoutSuggestions, SuggestionData } from '../utils/workoutSuggestions';
import { lightHaptic, successHaptic } from '../utils/haptics';
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
import { User, WorkoutLog, DailyNutrition, DailySteps, DailyWeight, Meal, WeeklyStats, WeekComparison, WorkoutTemplate } from '../types';
import { getWeekDates, getPreviousWeekDates, calculateDifference, calculatePercentageChange } from '../utils/dateUtils';
import { colors } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';

const TodayScreen = () => {
  const { isDesktop, isTablet, contentMaxWidth, contentPadding } = useResponsive();
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
  const [suggestions, setSuggestions] = useState<SuggestionData | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
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

      // Load all workouts for streak calculation and suggestions
      const allWorkouts = await getWorkouts();
      const streakData = calculateWorkoutStreak(allWorkouts);
      setCurrentStreak(streakData.current);
      setLongestStreak(streakData.longest);

      // Calculate workout suggestions
      const suggestionData = calculateWorkoutSuggestions(allWorkouts);
      setSuggestions(suggestionData);

      // Get recent unique workouts for quick repeat
      const recentUnique = allWorkouts
        .filter(w => w.date !== date && w.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .filter((w, i, arr) => arr.findIndex(x => x.name === w.name) === i)
        .slice(0, 3);
      setRecentWorkouts(recentUnique);

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
    setSelectedTemplate(null);

    // Show PR notification if any were set
    if (newPRs.length > 0) {
      successHaptic();
      const prNames = newPRs.map(pr => pr.exerciseName).join(', ');
      Alert.alert(
        '🏆 New Personal Record!',
        `Congratulations! You set a new PR for: ${prNames}`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    }
  };

  const daysAgo = (dateStr: string): string => {
    const days = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const workoutToTemplate = (workout: WorkoutLog): WorkoutTemplate => ({
    id: generateId(),
    userId: workout.userId,
    name: workout.name,
    exercises: workout.exercises.map((ex, index) => ({
      id: generateId(),
      exerciseName: ex.exerciseName,
      targetSets: ex.sets.length,
      targetReps: ex.sets[0]?.reps || 10,
      targetWeight: ex.sets[0]?.weight || 0,
      order: index,
    })),
    created: new Date().toISOString(),
  });

  const handleQuickRepeat = (workoutToRepeat: WorkoutLog) => {
    const template = workoutToTemplate(workoutToRepeat);
    setSelectedTemplate(template);
    setShowAddWorkoutModal(true);
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
      <ScrollView style={styles.container}>
        <TodayScreenSkeleton />
      </ScrollView>
    );
  }

  const isWideScreen = isDesktop || isTablet;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary, colors.workout, colors.nutrition]}
            progressBackgroundColor={colors.surface}
          />
        }
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

      {/* Workout Suggestions Card */}
      {suggestions && suggestions.hasEnoughData && (
        <WorkoutSuggestionsCard suggestions={suggestions} />
      )}

      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>
          {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Cards Grid for tablet/desktop */}
      <View style={isWideScreen ? styles.cardsGrid : undefined}>
      {/* Workout Card */}
      <View style={isWideScreen ? styles.cardWrapper : undefined}>
      <Card gradient>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="barbell" size={24} color={colors.workout} />
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
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                lightHaptic();
                setShowAddWorkoutModal(true);
              }}
            >
              <Text style={styles.addButtonText}>+ Log Workout</Text>
            </TouchableOpacity>
            {/* Quick Repeat Section */}
            {recentWorkouts.length > 0 && (
              <View style={styles.quickRepeatSection}>
                <Text style={styles.quickRepeatTitle}>Quick Repeat</Text>
                {recentWorkouts.map(w => (
                  <TouchableOpacity
                    key={w.id}
                    style={styles.quickRepeatItem}
                    onPress={() => {
                      lightHaptic();
                      handleQuickRepeat(w);
                    }}
                  >
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                    <View style={styles.quickRepeatInfo}>
                      <Text style={styles.quickRepeatName}>{w.name}</Text>
                      <Text style={styles.quickRepeatMeta}>
                        {w.exercises.length} exercises • {daysAgo(w.date)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </Card>
      </View>

      {/* Nutrition Card */}
      <View style={isWideScreen ? styles.cardWrapper : undefined}>
      <Card gradient>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="nutrition" size={24} color={colors.nutrition} />
            <Text style={styles.cardTitle}>Calories</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <ProgressBar
            current={totalCalories}
            target={nutrition?.calorieTarget || 2200}
            unit="cal"
            color={colors.nutrition}
          />
        </View>
        {nutrition && nutrition.meals.length > 0 ? (
          <View style={styles.mealsPreview}>
            <Text style={styles.mealsCount}>{nutrition.meals.length} meals logged</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              lightHaptic();
              setShowAddMealModal(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Add Meal</Text>
          </TouchableOpacity>
        )}
      </Card>
      </View>

      {/* Steps Card */}
      <View style={isWideScreen ? styles.cardWrapper : undefined}>
      <Card gradient>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="footsteps" size={24} color={colors.steps} />
            <Text style={styles.cardTitle}>Steps</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <ProgressBar
            current={steps?.steps || 0}
            target={steps?.stepGoal || 10000}
            unit="steps"
            color={colors.steps}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            lightHaptic();
            setShowUpdateStepsModal(true);
          }}
        >
          <Text style={styles.addButtonText}>Update Steps</Text>
        </TouchableOpacity>
      </Card>
      </View>

      {/* Weight Card */}
      <View style={isWideScreen ? styles.cardWrapper : undefined}>
      <Card gradient>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="scale-outline" size={24} color={colors.gold} />
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
          onPress={() => {
            lightHaptic();
            setShowUpdateWeightModal(true);
          }}
        >
          <Text style={styles.addButtonText}>Update Weight</Text>
        </TouchableOpacity>
      </Card>
      </View>
      </View>
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
          onClose={() => {
            setShowAddWorkoutModal(false);
            setSelectedTemplate(null);
          }}
          onSave={handleAddWorkout}
          date={date}
          userId={user.id}
          initialTemplate={selectedTemplate}
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
    backgroundColor: colors.background,
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
    borderBottomColor: colors.border,
  },
  dateText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
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
    color: colors.text,
    letterSpacing: 0.2,
  },
  workoutContent: {
    marginTop: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginBottom: 12,
  },
  mealsPreview: {
    marginTop: 8,
  },
  mealsCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: `${colors.primary}50`,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
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
    color: colors.gold,
    marginRight: 8,
  },
  weightUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyWeightState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyWeightText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
  },
  quickRepeatSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickRepeatTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickRepeatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  quickRepeatInfo: {
    flex: 1,
  },
  quickRepeatName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  quickRepeatMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default TodayScreen;
