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
import Card from '../components/Card';
import { getUser, saveUser, clearAllData } from '../services/storage';
import { User } from '../types';
import { createSampleData } from '../utils/sampleData';

const ProfileScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [stepGoal, setStepGoal] = useState('');

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

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your workouts, meals, and steps data. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Success', 'All data has been reset. Please restart the app.');
          },
        },
      ]
    );
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
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.dangerButtonText}>Reset All Data</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    fontSize: 16,
    color: '#007AFF',
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
    color: '#98989D',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  settingItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#98989D',
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
    borderColor: '#38383A',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFF',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#98989D',
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
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#38383A',
  },
  unitButtonActive: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  unitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#98989D',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#3A1C1C',
    borderRadius: 8,
  },
  dangerButtonText: {
    fontSize: 15,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '500',
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
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  testDescription: {
    fontSize: 13,
    color: '#98989D',
    lineHeight: 18,
  },
});

export default ProfileScreen;
