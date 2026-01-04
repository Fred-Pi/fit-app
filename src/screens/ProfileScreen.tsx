import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import { getUser, saveUser, clearAllData } from '../services/storage';
import { User } from '../types';
import { createSampleData } from '../utils/sampleData';

const ProfileScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [stepGoal, setStepGoal] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadUser = async () => {
    const userData = await getUser();
    if (userData) {
      setUser(userData);
      setName(userData.name);
      setCalorieTarget(userData.dailyCalorieTarget.toString());
      setStepGoal(userData.dailyStepGoal.toString());
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

  const handleSave = async () => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      name: name.trim() || 'User',
      dailyCalorieTarget: parseInt(calorieTarget) || 2200,
      dailyStepGoal: parseInt(stepGoal) || 10000,
    };

    await saveUser(updatedUser);
    setUser(updatedUser);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleLoadSampleData = async () => {
    try {
      const success = await createSampleData();
      if (success) {
        Alert.alert(
          'Success',
          'Sample data loaded! Check the Today, Workouts, and Nutrition tabs to see it.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to load sample data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load sample data');
      console.error('Error loading sample data:', error);
    }
  };

  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Delete',
    icon: keyof typeof Ionicons.glyphMap = 'alert-circle',
    iconColor: string = '#FF3B30'
  ) => {
    setConfirmDialog({
      visible: true,
      title,
      message,
      onConfirm,
      confirmText,
      icon,
      iconColor,
    });
  };

  const handleDeleteWorkouts = async () => {
    await AsyncStorage.removeItem('@fit_app_workouts');
    setConfirmDialog({ ...confirmDialog, visible: false });
    Alert.alert('Success', 'All workouts deleted');
  };

  const handleDeleteNutrition = async () => {
    await AsyncStorage.removeItem('@fit_app_nutrition');
    setConfirmDialog({ ...confirmDialog, visible: false });
    Alert.alert('Success', 'All nutrition data deleted');
  };

  const handleDeleteSteps = async () => {
    await AsyncStorage.removeItem('@fit_app_steps');
    setConfirmDialog({ ...confirmDialog, visible: false });
    Alert.alert('Success', 'All step data deleted');
  };

  const handleResetAll = async () => {
    await clearAllData();
    setConfirmDialog({ ...confirmDialog, visible: false });
    Alert.alert('Success', 'All data has been reset');
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Info */}
      <Card>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Profile</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#98989D"
            />
          ) : (
            <Text style={styles.value}>{user.name}</Text>
          )}
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>Daily Calorie Target</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={calorieTarget}
              onChangeText={setCalorieTarget}
              keyboardType="number-pad"
              placeholder="2200"
              placeholderTextColor="#98989D"
            />
          ) : (
            <Text style={styles.value}>{user.dailyCalorieTarget} cal</Text>
          )}
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>Daily Step Goal</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={stepGoal}
              onChangeText={setStepGoal}
              keyboardType="number-pad"
              placeholder="10000"
              placeholderTextColor="#98989D"
            />
          ) : (
            <Text style={styles.value}>{user.dailyStepGoal.toLocaleString()} steps</Text>
          )}
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.label}>Weight Unit</Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                user.preferredWeightUnit === 'lbs' && styles.unitButtonActive,
              ]}
              onPress={async () => {
                const updated = { ...user, preferredWeightUnit: 'lbs' as const };
                await saveUser(updated);
                setUser(updated);
              }}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  user.preferredWeightUnit === 'lbs' && styles.unitButtonTextActive,
                ]}
              >
                lbs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                user.preferredWeightUnit === 'kg' && styles.unitButtonActive,
              ]}
              onPress={async () => {
                const updated = { ...user, preferredWeightUnit: 'kg' as const };
                await saveUser(updated);
                setUser(updated);
              }}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  user.preferredWeightUnit === 'kg' && styles.unitButtonTextActive,
                ]}
              >
                kg
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* App Info */}
      <Card>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0 (MVP)</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Account Created</Text>
          <Text style={styles.infoValue}>
            {new Date(user.created).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      </Card>

      {/* Testing */}
      <Card>
        <Text style={styles.sectionTitle}>Testing</Text>
        <TouchableOpacity
          style={styles.testButton}
          onPress={handleLoadSampleData}
        >
          <Ionicons name="flask-outline" size={20} color="#007AFF" />
          <Text style={styles.testButtonText}>Load Sample Data</Text>
        </TouchableOpacity>
        <Text style={styles.testDescription}>
          Adds sample workouts, meals, and steps for testing the app
        </Text>
      </Card>

      {/* Danger Zone */}
      <Card style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Delete Data</Text>
        <Text style={styles.dangerSubtitle}>
          Choose what data to delete. This cannot be undone.
        </Text>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={() =>
            showConfirmDialog(
              'Delete All Workouts?',
              'This will permanently delete all your workout history. This cannot be undone.',
              handleDeleteWorkouts,
              'Delete Workouts',
              'barbell',
              '#FF3B30'
            )
          }
        >
          <Ionicons name="barbell" size={20} color="#FF3B30" />
          <Text style={styles.dangerButtonText}>Delete All Workouts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={() =>
            showConfirmDialog(
              'Delete All Nutrition Data?',
              'This will permanently delete all your meal logs and nutrition history. This cannot be undone.',
              handleDeleteNutrition,
              'Delete Nutrition',
              'nutrition',
              '#FF3B30'
            )
          }
        >
          <Ionicons name="nutrition" size={20} color="#FF3B30" />
          <Text style={styles.dangerButtonText}>Delete All Nutrition</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={() =>
            showConfirmDialog(
              'Delete All Step Data?',
              'This will permanently delete all your step count history. This cannot be undone.',
              handleDeleteSteps,
              'Delete Steps',
              'footsteps',
              '#FF3B30'
            )
          }
        >
          <Ionicons name="footsteps" size={20} color="#FF3B30" />
          <Text style={styles.dangerButtonText}>Delete All Steps</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.dangerButton, styles.dangerButtonCritical]}
          onPress={() =>
            showConfirmDialog(
              'Reset Everything?',
              'This will delete ALL your data including workouts, nutrition, steps, and reset your profile to default. This cannot be undone.',
              handleResetAll,
              'Reset Everything',
              'warning',
              '#FF3B30'
            )
          }
        >
          <Ionicons name="warning" size={20} color="#FFFFFF" />
          <Text style={[styles.dangerButtonText, styles.dangerButtonTextCritical]}>
            Reset All Data
          </Text>
        </TouchableOpacity>
      </Card>

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        icon={confirmDialog.icon}
        iconColor={confirmDialog.iconColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, visible: false })}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E14',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  editButton: {
    fontSize: 16,
    color: '#3A9BFF',
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#A0A0A8',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#3A9BFF',
    fontWeight: '600',
  },
  settingItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#A0A0A8',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A42',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#2A2A30',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#A0A0A8',
  },
  infoValue: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2A2A30',
    borderWidth: 1,
    borderColor: '#3A3A42',
  },
  unitButtonActive: {
    backgroundColor: '#3A9BFF',
    borderColor: '#3A9BFF',
  },
  unitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A0A0A8',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  dangerCard: {
    marginTop: 8,
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  dangerSubtitle: {
    fontSize: 13,
    color: '#A0A0A8',
    marginBottom: 16,
    lineHeight: 18,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#3A1C1C',
    borderRadius: 8,
    marginBottom: 8,
  },
  dangerButtonText: {
    fontSize: 15,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '500',
  },
  dangerButtonCritical: {
    backgroundColor: '#FF3B30',
  },
  dangerButtonTextCritical: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#3A3A42',
    marginVertical: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0F1A2E',
    borderRadius: 8,
    marginBottom: 8,
  },
  testButtonText: {
    fontSize: 15,
    color: '#3A9BFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  testDescription: {
    fontSize: 13,
    color: '#A0A0A8',
    lineHeight: 18,
  },
});

export default ProfileScreen;
