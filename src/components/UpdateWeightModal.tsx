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
import { validateBodyWeight } from '../utils/validation';
import FormInput from './FormInput';
import GlassButton from './GlassButton';

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
              <Ionicons name="scale-outline" size={24} color="#FF9500" />
            </View>
            <Text style={styles.title}>Update Weight</Text>
          </View>

          <View style={styles.content}>
            <FormInput
              label={`Body Weight (${unit})`}
              variant="large"
              placeholder="0"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              hint="Enter your current body weight"
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
                variant="primary"
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
