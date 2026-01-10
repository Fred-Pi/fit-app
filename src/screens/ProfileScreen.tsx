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
import { getUser, saveUser, clearAllData, getTemplates, deleteTemplate } from '../services/storage';
import { User, WorkoutTemplate } from '../types'
import { colors } from '../utils/theme';
import { createSampleData } from '../utils/sampleData';

const ProfileScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [stepGoal, setStepGoal] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
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
      setGoalWeight(userData.goalWeight?.toString() || '');
    }
  };

  const loadTemplates = async () => {
    const templateData = await getTemplates();
    setTemplates(templateData);
  };

  useEffect(() => {
    loadUser();
    loadTemplates();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
      loadTemplates();
    }, [])
  );

  const handleSave = async () => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      name: name.trim() || 'User',
      dailyCalorieTarget: parseInt(calorieTarget) || 2200,
      dailyStepGoal: parseInt(stepGoal) || 10000,
      goalWeight: parseFloat(goalWeight) || undefined,
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
    iconColor: string = colors.error
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
    loadTemplates(); // Reload templates after reset
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    showConfirmDialog(
      'Delete Template?',
      `Are you sure you want to delete "${templateName}"? This cannot be undone.`,
      async () => {
        await deleteTemplate(templateId);
        setConfirmDialog({ ...confirmDialog, visible: false });
        loadTemplates();
        Alert.alert('Success', 'Template deleted');
      },
      'Delete Template',
      'document-text',
      colors.error
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
          <Text style={styles.label}>Goal Weight ({user.preferredWeightUnit})</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={goalWeight}
              onChangeText={setGoalWeight}
              keyboardType="decimal-pad"
              placeholder="Optional"
              placeholderTextColor="#98989D"
            />
          ) : (
            <Text style={styles.value}>
              {user.goalWeight ? `${user.goalWeight} ${user.preferredWeightUnit}` : 'Not set'}
            </Text>
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

      {/* Workout Templates */}
      <Card>
        <Text style={styles.sectionTitle}>Workout Templates</Text>
        {templates.length > 0 ? (
          <>
            <Text style={styles.templatesCount}>
              {templates.length} {templates.length === 1 ? 'template' : 'templates'} saved
            </Text>
            {templates.map((template) => (
              <View key={template.id} style={styles.templateItem}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDetails}>
                    {template.exercises.length} {template.exercises.length === 1 ? 'exercise' : 'exercises'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteTemplate(template.id, template.name)}
                  style={styles.deleteTemplateButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF5E6D" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyTemplates}>
            <Ionicons name="document-text-outline" size={40} color="#A0A0A8" />
            <Text style={styles.emptyTemplatesText}>No templates yet</Text>
            <Text style={styles.emptyTemplatesSubtext}>
              Create a workout and save it as a template to reuse it later
            </Text>
          </View>
        )}
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
              colors.error
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
              colors.error
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
              colors.error
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
              colors.error
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
    backgroundColor: colors.background,
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
    color: colors.text,
    letterSpacing: 0.2,
  },
  editButton: {
    fontSize: 16,
    color: colors.primary,
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
    color: colors.textSecondary,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  settingItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.surfaceElevated,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    color: colors.text,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unitButtonTextActive: {
    color: colors.text,
  },
  dangerCard: {
    marginTop: 8,
    borderColor: colors.error,
    borderWidth: 1,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  dangerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
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
    color: colors.error,
    marginLeft: 8,
    fontWeight: '500',
  },
  dangerButtonCritical: {
    backgroundColor: colors.error,
  },
  dangerButtonTextCritical: {
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
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
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  testDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  templatesCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  templateDetails: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  deleteTemplateButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 94, 109, 0.1)',
    borderRadius: 8,
  },
  emptyTemplates: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTemplatesText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyTemplatesSubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});

export default ProfileScreen;
