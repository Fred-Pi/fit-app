import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { successHaptic } from '../utils/haptics';
import { validateBodyWeight } from '../utils/validation';
import GlassButton from './GlassButton';
import NumberInput from './NumberInput';
import ResponsiveModal from './ResponsiveModal';

interface UpdateWeightModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number) => void;
  currentWeight: number;
  unit: 'kg' | 'lbs';
}

const UpdateWeightModal: React.FC<UpdateWeightModalProps> = ({
  visible,
  onClose,
  onSave,
  currentWeight,
  unit,
}) => {
  const [weight, setWeight] = useState(currentWeight > 0 ? currentWeight.toString() : '');

  useEffect(() => {
    setWeight(currentWeight > 0 ? currentWeight.toString() : '');
  }, [currentWeight, visible]);

  const handleSave = () => {
    const weightNum = parseFloat(weight);

    if (isNaN(weightNum)) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    const validation = validateBodyWeight(weightNum, unit);
    if (!validation.isValid) {
      Alert.alert('Error', validation.error);
      return;
    }

    successHaptic();
    onSave(weightNum);
    onClose();
  };

  const handleClose = () => {
    setWeight(currentWeight > 0 ? currentWeight.toString() : '');
    onClose();
  };

  return (
    <ResponsiveModal
      visible={visible}
      onClose={handleClose}
      size="sm"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="scale-outline" size={24} color="#FF9500" />
          </View>
          <Text style={styles.title}>Update Weight</Text>
        </View>

        <View style={styles.content}>
          <NumberInput
            label={`Body Weight (${unit})`}
            value={weight}
            onChangeText={setWeight}
            placeholder="0"
            min={0}
            max={unit === 'kg' ? 300 : 660}
            step={unit === 'kg' ? 0.5 : 1}
            allowDecimal
            maxLength={5}
            size="large"
          />
          <Text style={styles.hint}>Enter your current body weight</Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.buttonWrapper}>
            <GlassButton
              title="Cancel"
              onPress={handleClose}
              variant="secondary"
              fullWidth
            />
          </View>
          <View style={styles.buttonWrapper}>
            <GlassButton
              title="Save"
              onPress={handleSave}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </View>
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.warningMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  content: {
    padding: spacing.xl,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
});

export default UpdateWeightModal;
