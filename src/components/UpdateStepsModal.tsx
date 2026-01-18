import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { colors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { successHaptic } from '../utils/haptics';

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

    if (isNaN(stepsNum) || stepsNum < 0) {
      Alert.alert('Error', 'Please enter a valid number of steps');
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
        />
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="footsteps" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Update Steps</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>Total Steps Today</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#98989D"
              value={steps}
              onChangeText={setSteps}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
            />
            <Text style={styles.hint}>
              Enter your total step count for today
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#1E1E22',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A2E1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3A3A42',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#2A2A30',
    color: colors.text,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default UpdateStepsModal;
