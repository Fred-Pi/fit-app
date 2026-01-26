import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { successHaptic } from '../utils/haptics';
import { validateSteps } from '../utils/validation';
import FormInput from './FormInput';
import GlassButton from './GlassButton';

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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
        />
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="footsteps" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Update Steps</Text>
          </View>

          <View style={styles.content}>
            <FormInput
              label="Total Steps Today"
              variant="large"
              placeholder="0"
              value={steps}
              onChangeText={setSteps}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              hint="Enter your total step count for today"
            />
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
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
