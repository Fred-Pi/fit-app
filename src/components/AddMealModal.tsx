import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '../types';
import { generateId } from '../services/storage';
import { successHaptic } from '../utils/haptics';
import { validateMeal } from '../utils/validation';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import ModalHeader from './ModalHeader';
import ResponsiveModal from './ResponsiveModal';
import NumberInput from './NumberInput';
import { modalStyles, placeholderColor } from '../styles/modalStyles';

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (meal: Meal) => void;
}

const AddMealModal: React.FC<AddMealModalProps> = ({ visible, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSave = () => {
    const mealData = {
      name: name.trim(),
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fats: parseInt(fats) || 0,
    };

    const validation = validateMeal(mealData);
    if (!validation.isValid) {
      Alert.alert('Error', validation.error);
      return;
    }

    const meal: Meal = {
      id: generateId(),
      ...mealData,
      time: new Date().toISOString(),
    };

    successHaptic();
    onSave(meal);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <ResponsiveModal
      visible={visible}
      onClose={handleClose}
      size="md"
    >
      <View style={styles.container}>
        <ModalHeader
          title="Add Meal"
          onCancel={handleClose}
          onSave={handleSave}
        />

        <ScrollView
          style={modalStyles.content}
          contentContainerStyle={modalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {/* Meal Name */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.label}>
              Meal Name <Text style={modalStyles.requiredLabel}>*</Text>
            </Text>
            <TextInput
              style={[
                modalStyles.input,
                focusedField === 'name' && modalStyles.inputFocused,
              ]}
              placeholder="e.g., Breakfast, Chicken & Rice"
              placeholderTextColor={placeholderColor}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
              autoFocus
            />
          </View>

          {/* Calories */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.label}>
              Calories <Text style={modalStyles.requiredLabel}>*</Text>
            </Text>
            <TextInput
              style={[
                modalStyles.input,
                focusedField === 'calories' && modalStyles.inputFocused,
              ]}
              placeholder="e.g., 500"
              placeholderTextColor={placeholderColor}
              value={calories}
              onChangeText={setCalories}
              onFocus={() => setFocusedField('calories')}
              onBlur={() => setFocusedField(null)}
              keyboardType="number-pad"
            />
          </View>

          {/* Macros Section */}
          <View style={styles.macrosCard}>
            <View style={styles.macrosHeader}>
              <LinearGradient
                colors={[colors.nutritionLight, colors.nutrition]}
                style={styles.macrosIcon}
              >
                <Ionicons name="pie-chart" size={18} color={colors.text} />
              </LinearGradient>
              <View>
                <Text style={modalStyles.sectionTitle}>Macros</Text>
                <Text style={styles.macrosSubtitle}>Optional but recommended</Text>
              </View>
            </View>

            <View style={modalStyles.row}>
              <NumberInput
                label="Protein (g)"
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                min={0}
                max={500}
                step={5}
                maxLength={3}
                onFocus={() => setFocusedField('protein')}
                onBlur={() => setFocusedField(null)}
                isFocused={focusedField === 'protein'}
              />

              <NumberInput
                label="Carbs (g)"
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                min={0}
                max={500}
                step={5}
                maxLength={3}
                onFocus={() => setFocusedField('carbs')}
                onBlur={() => setFocusedField(null)}
                isFocused={focusedField === 'carbs'}
              />

              <NumberInput
                label="Fats (g)"
                value={fats}
                onChangeText={setFats}
                placeholder="0"
                min={0}
                max={200}
                step={5}
                maxLength={3}
                onFocus={() => setFocusedField('fats')}
                onBlur={() => setFocusedField(null)}
                isFocused={focusedField === 'fats'}
              />
            </View>
          </View>

          {/* Help Section */}
          <View style={modalStyles.helpSection}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={modalStyles.helpText}>
              Enter at least the meal name and calories. Macros are optional but helpful for tracking your nutrition goals.
            </Text>
          </View>
        </ScrollView>
      </View>
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  macrosCard: {
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  macrosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  macrosIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macrosSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default AddMealModal;
