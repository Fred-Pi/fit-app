import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { colors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '../types';
import { generateId } from '../services/storage';
import { successHaptic } from '../utils/haptics';
import FormInput from './FormInput';

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

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    if (!calories || parseInt(calories) <= 0) {
      Alert.alert('Error', 'Please enter valid calories');
      return;
    }

    const meal: Meal = {
      id: generateId(),
      name: name.trim(),
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fats: parseInt(fats) || 0,
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} accessibilityLabel="Cancel" accessibilityRole="button">
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Meal</Text>
          <TouchableOpacity onPress={handleSave} accessibilityLabel="Save meal" accessibilityRole="button">
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <FormInput
              label="Meal Name"
              required
              placeholder="e.g., Breakfast, Chicken & Rice"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
            />
          </View>

          <View style={styles.section}>
            <FormInput
              label="Calories"
              required
              placeholder="e.g., 500"
              value={calories}
              onChangeText={setCalories}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.macrosSection}>
            <Text style={styles.sectionTitle}>Macros (Optional)</Text>

            <View style={styles.macroRow}>
              <View style={styles.macroInput}>
                <FormInput
                  label="Protein (g)"
                  placeholder="0"
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.macroInput}>
                <FormInput
                  label="Carbs (g)"
                  placeholder="0"
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.macroInput}>
                <FormInput
                  label="Fats (g)"
                  placeholder="0"
                  value={fats}
                  onChangeText={setFats}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.helpSection}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.helpText}>
              Enter at least the meal name and calories. Macros are optional but helpful for tracking.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E22',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  saveButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  macrosSection: {
    marginBottom: 24,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
  helpSection: {
    flexDirection: 'row',
    backgroundColor: '#0F1A2E',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default AddMealModal;
