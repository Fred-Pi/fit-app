import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import AddMealModal from '../components/AddMealModal';
import EditMealModal from '../components/EditMealModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SwipeableRow from '../components/SwipeableRow';
import {
  getNutritionByDate,
  getTodayDate,
  getUser,
  generateId,
  saveNutrition,
} from '../services/storage';
import { DailyNutrition, User, Meal } from '../types';

const NutritionScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [nutrition, setNutrition] = useState<DailyNutrition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showEditMealModal, setShowEditMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    visible: boolean;
    mealId: string;
    mealName: string;
  }>({ visible: false, mealId: '', mealName: '' });
  const date = getTodayDate();

  const loadData = async () => {
    try {
      const userData = await getUser();
      setUser(userData);

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
    } catch (error) {
      console.error('Error loading nutrition:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleAddMeal = async (meal: Meal) => {
    if (!nutrition) return;

    const updatedNutrition: DailyNutrition = {
      ...nutrition,
      meals: [...nutrition.meals, meal],
    };

    await saveNutrition(updatedNutrition);
    setNutrition(updatedNutrition);
  };

  const handleEditMeal = async (editedMeal: Meal) => {
    if (!nutrition) return;

    const updatedNutrition: DailyNutrition = {
      ...nutrition,
      meals: nutrition.meals.map((m) => (m.id === editedMeal.id ? editedMeal : m)),
    };

    await saveNutrition(updatedNutrition);
    setNutrition(updatedNutrition);
    setShowEditMealModal(false);
    setSelectedMeal(null);
  };

  const handleDeleteMeal = async () => {
    if (!nutrition) return;

    const updatedNutrition: DailyNutrition = {
      ...nutrition,
      meals: nutrition.meals.filter((m) => m.id !== confirmDelete.mealId),
    };

    await saveNutrition(updatedNutrition);
    setNutrition(updatedNutrition);
    setConfirmDelete({ visible: false, mealId: '', mealName: '' });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const totalCalories = nutrition?.meals.reduce((sum, meal) => sum + meal.calories, 0) || 0;
  const totalProtein = nutrition?.meals.reduce((sum, meal) => sum + meal.protein, 0) || 0;
  const totalCarbs = nutrition?.meals.reduce((sum, meal) => sum + meal.carbs, 0) || 0;
  const totalFats = nutrition?.meals.reduce((sum, meal) => sum + meal.fats, 0) || 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Daily Summary */}
        <Card>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryContainer}>
            <ProgressBar
              current={totalCalories}
              target={nutrition?.calorieTarget || 2200}
              unit="cal"
              color="#FF6B6B"
            />
          </View>
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(totalProtein)}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(totalCarbs)}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(totalFats)}g</Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>
        </Card>

        {/* Meals List */}
        <View style={styles.mealsHeader}>
          <Text style={styles.mealsTitle}>Meals</Text>
        </View>

        {nutrition?.meals.length === 0 ? (
          <Card>
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No meals logged today</Text>
            </View>
          </Card>
        ) : (
          nutrition?.meals.map((meal) => (
            <SwipeableRow
              key={meal.id}
              onEdit={() => {
                setSelectedMeal(meal);
                setShowEditMealModal(true);
              }}
              onDelete={() =>
                setConfirmDelete({
                  visible: true,
                  mealId: meal.id,
                  mealName: meal.name,
                })
              }
            >
              <Card>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealTime}>
                    {new Date(meal.time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.mealMacros}>
                  <Text style={styles.mealCalories}>{meal.calories} cal</Text>
                  <Text style={styles.mealMacroDetail}>
                    P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                  </Text>
                </View>
              </Card>
            </SwipeableRow>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddMealModal(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <AddMealModal
        visible={showAddMealModal}
        onClose={() => setShowAddMealModal(false)}
        onSave={handleAddMeal}
      />

      <EditMealModal
        visible={showEditMealModal}
        onClose={() => {
          setShowEditMealModal(false);
          setSelectedMeal(null);
        }}
        onSave={handleEditMeal}
        meal={selectedMeal}
      />

      <ConfirmDialog
        visible={confirmDelete.visible}
        title="Delete Meal?"
        message={`Are you sure you want to delete "${confirmDelete.mealName}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteMeal}
        onCancel={() => setConfirmDelete({ visible: false, mealId: '', mealName: '' })}
        icon="restaurant"
        iconColor="#FF3B30"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 13,
    color: '#98989D',
  },
  mealsHeader: {
    marginVertical: 16,
  },
  mealsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 17,
    color: '#98989D',
    marginTop: 16,
    fontWeight: '500',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  mealTime: {
    fontSize: 14,
    color: '#98989D',
    fontWeight: '500',
  },
  mealMacros: {
    marginTop: 4,
  },
  mealCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  mealMacroDetail: {
    fontSize: 14,
    color: '#98989D',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default NutritionScreen;
