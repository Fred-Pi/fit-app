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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

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
        />
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="scale-outline" size={24} color="#FF9500" />
            </View>
            <Text style={styles.title}>Update Weight</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>Body Weight ({unit})</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#98989D"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />
            <Text style={styles.hint}>
              Enter your current body weight
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
    backgroundColor: '#2E2416',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 13,
    color: '#A0A0A8',
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
    backgroundColor: '#3A3A42',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A0A0A8',
  },
  saveButton: {
    backgroundColor: '#FF9500',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default UpdateWeightModal;
