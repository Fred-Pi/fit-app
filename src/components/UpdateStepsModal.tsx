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
import { validateSteps } from '../utils/validation';
import GlassButton from './GlassButton';
import NumberInput from './NumberInput';
import ResponsiveModal from './ResponsiveModal';

interface UpdateStepsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (steps: number) => void;
  currentSteps: number;
}

const UpdateStepsModal: React.FC<UpdateStepsModalProps> = ({
  visible,
  onClose,
  onSave,
  currentSteps,
}) => {
  const [steps, setSteps] = useState(currentSteps.toString());

  useEffect(() => {
    setSteps(currentSteps.toString());
  }, [currentSteps, visible]);

  const handleSave = () => {
    const stepsNum = parseInt(steps);

    if (isNaN(stepsNum)) {
      Alert.alert('Error', 'Please enter a valid number of steps');
      return;
    }

    const validation = validateSteps(stepsNum);
    if (!validation.isValid) {
      Alert.alert('Error', validation.error);
      return;
    }

    successHaptic();
    onSave(stepsNum);
    onClose();
  };

  const handleClose = () => {
    setSteps(currentSteps.toString());
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
            <Ionicons name="footsteps" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Update Steps</Text>
        </View>

        <View style={styles.content}>
          <NumberInput
            label="Total Steps Today"
            value={steps}
            onChangeText={setSteps}
            placeholder="0"
            min={0}
            max={100000}
            step={500}
            maxLength={6}
            size="large"
          />
          <Text style={styles.hint}>Enter your total step count for today</Text>
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
              variant="success"
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
    backgroundColor: colors.successMuted,
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

export default UpdateStepsModal;
