import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FoodPreset, SERVING_UNITS } from '../types';
import { successHaptic } from '../utils/haptics';
import { validatePreset } from '../utils/validation';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import ModalHeader from './ModalHeader';
import ResponsiveModal from './ResponsiveModal';
import NumberInput from './NumberInput';
import FormRow from './FormRow';
import { modalStyles, placeholderColor } from '../styles/modalStyles';

interface PresetFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<FoodPreset, 'id' | 'userId' | 'createdAt' | 'lastUsedAt'>) => void;
  preset?: FoodPreset | null;
}

const PresetFormModal: React.FC<PresetFormModalProps> = ({
  visible,
  onClose,
  onSave,
  preset,
}) => {
  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState<FoodPreset['servingUnit']>('g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isEditing = !!preset;

  // Populate form when editing
  useEffect(() => {
    if (preset && visible) {
      setName(preset.name);
      setServingSize(preset.servingSize.toString());
      setServingUnit(preset.servingUnit);
      setCalories(preset.calories.toString());
      setProtein(preset.protein.toString());
      setCarbs(preset.carbs.toString());
      setFats(preset.fats.toString());
    }
  }, [preset, visible]);

  const handleSave = () => {
    const presetData = {
      name: name.trim(),
      servingSize: parseFloat(servingSize) || 0,
      servingUnit,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fats: parseFloat(fats) || 0,
    };

    const validation = validatePreset(presetData);
    if (!validation.isValid) {
      Alert.alert('Error', validation.error);
      return;
    }

    successHaptic();
    onSave(presetData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setServingSize('100');
    setServingUnit('g');
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
    <ResponsiveModal visible={visible} onClose={handleClose} size="md">
      <View style={styles.container}>
        <ModalHeader
          title={isEditing ? 'Edit Preset' : 'New Food Preset'}
          onCancel={handleClose}
          onSave={handleSave}
          saveText={isEditing ? 'Update' : 'Save'}
        />

        <ScrollView
          style={modalStyles.content}
          contentContainerStyle={modalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {/* Food Name */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.label}>
              Food Name <Text style={modalStyles.requiredLabel}>*</Text>
            </Text>
            <TextInput
              style={[
                modalStyles.input,
                focusedField === 'name' && modalStyles.inputFocused,
              ]}
              placeholder="e.g., Chicken Breast, Greek Yogurt"
              placeholderTextColor={placeholderColor}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
              autoFocus={!isEditing}
            />
          </View>

          {/* Serving Info */}
          <View style={styles.servingCard}>
            <View style={styles.servingHeader}>
              <LinearGradient
                colors={[colors.nutritionLight, colors.nutrition]}
                style={styles.servingIcon}
              >
                <Ionicons name="scale" size={18} color={colors.text} />
              </LinearGradient>
              <View>
                <Text style={modalStyles.sectionTitle}>Serving Size</Text>
                <Text style={styles.servingSubtitle}>Define one serving</Text>
              </View>
            </View>

            <FormRow gap={spacing.lg}>
              <View style={[modalStyles.section, { flex: 1 }]}>
                <Text style={modalStyles.label}>
                  Amount <Text style={modalStyles.requiredLabel}>*</Text>
                </Text>
                <TextInput
                  style={[
                    modalStyles.input,
                    focusedField === 'servingSize' && modalStyles.inputFocused,
                  ]}
                  placeholder="100"
                  placeholderTextColor={placeholderColor}
                  value={servingSize}
                  onChangeText={setServingSize}
                  onFocus={() => setFocusedField('servingSize')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[modalStyles.section, { flex: 1 }]}>
                <Text style={modalStyles.label}>Unit</Text>
                <View style={styles.unitSelector}>
                  {SERVING_UNITS.map((unit) => (
                    <TouchableOpacity
                      key={unit.value}
                      style={[
                        styles.unitOption,
                        servingUnit === unit.value && styles.unitOptionSelected,
                      ]}
                      onPress={() => setServingUnit(unit.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.unitOptionText,
                          servingUnit === unit.value && styles.unitOptionTextSelected,
                        ]}
                      >
                        {unit.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </FormRow>
          </View>

          {/* Nutrition per Serving */}
          <View style={styles.nutritionCard}>
            <View style={styles.nutritionHeader}>
              <LinearGradient
                colors={[colors.primaryLight, colors.primary]}
                style={styles.nutritionIcon}
              >
                <Ionicons name="nutrition" size={18} color={colors.text} />
              </LinearGradient>
              <View>
                <Text style={modalStyles.sectionTitle}>Nutrition per Serving</Text>
                <Text style={styles.nutritionSubtitle}>
                  Per {servingSize || '?'} {servingUnit}
                </Text>
              </View>
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
                placeholder="e.g., 165"
                placeholderTextColor={placeholderColor}
                value={calories}
                onChangeText={setCalories}
                onFocus={() => setFocusedField('calories')}
                onBlur={() => setFocusedField(null)}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Macros */}
            <View style={modalStyles.row}>
              <NumberInput
                label="Protein (g)"
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                min={0}
                max={500}
                step={1}
                maxLength={5}
                allowDecimal
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
                step={1}
                maxLength={5}
                allowDecimal
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
                step={1}
                maxLength={5}
                allowDecimal
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
              Create a food preset to quickly log meals. Define serving size and nutrition once, then reuse with adjustable portions.
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
  servingCard: {
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  servingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  servingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unitOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitOptionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium as '500',
    color: colors.textSecondary,
  },
  unitOptionTextSelected: {
    color: colors.text,
  },
  nutritionCard: {
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  nutritionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default PresetFormModal;
