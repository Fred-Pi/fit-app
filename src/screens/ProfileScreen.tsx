import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Share,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import SyncStatus from '../components/SyncStatus';
import CollapsibleSection from '../components/CollapsibleSection';
import { clearAllData, getWorkouts, getNutrition, getSteps, getWeights } from '../services/storage';
import { colors, glass, spacing, typography, radius } from '../utils/theme';
import { warningHaptic, successHaptic, lightHaptic } from '../utils/haptics';
import {
  useUserStore,
  useUIStore,
  useWorkoutStore,
  useTemplateStore,
} from '../stores';
import { useAuthStore } from '../stores/authStore';
import { logError } from '../utils/logger';

const ProfileScreen = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [stepGoal, setStepGoal] = useState('');
  const [goalWeight, setGoalWeight] = useState('');

  // User Store
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const refreshUser = useUserStore((s) => s.refreshUser);

  // UI Store
  const openConfirmDialog = useUIStore((s) => s.openConfirmDialog);

  // Template Store
  const templates = useTemplateStore((s) => s.templates);
  const fetchTemplates = useTemplateStore((s) => s.fetchTemplates);
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate);

  // Workout Store
  const invalidateWorkoutCache = useWorkoutStore((s) => s.invalidateCache);

  // Auth Store
  const signOut = useAuthStore((s) => s.signOut);

  // Initialize form values when user loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setCalorieTarget(user.dailyCalorieTarget.toString());
      setStepGoal(user.dailyStepGoal.toString());
      setGoalWeight(user.goalWeight?.toString() || '');
    }
  }, [user]);

  // Load templates
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      fetchTemplates();
    }, [fetchTemplates])
  );

  const handleSave = async () => {
    if (!user) return;

    await updateUser({
      name: name.trim() || 'User',
      dailyCalorieTarget: parseInt(calorieTarget) || 2200,
      dailyStepGoal: parseInt(stepGoal) || 10000,
      goalWeight: parseFloat(goalWeight) || undefined,
    });
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleExportData = async () => {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        Alert.alert('Error', 'Please log in to export data');
        return;
      }
      const [workouts, nutrition, steps, weights] = await Promise.all([
        getWorkouts(userId),
        getNutrition(userId),
        getSteps(userId),
        getWeights(userId),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: user ? {
          name: user.name,
          dailyCalorieTarget: user.dailyCalorieTarget,
          dailyStepGoal: user.dailyStepGoal,
          preferredWeightUnit: user.preferredWeightUnit,
          goalWeight: user.goalWeight,
        } : null,
        workouts,
        nutrition,
        steps,
        weights,
        summary: {
          totalWorkouts: workouts.length,
          totalMeals: nutrition.reduce((sum, n) => sum + n.meals.length, 0),
          totalDaysTracked: new Set([
            ...workouts.map(w => w.date),
            ...nutrition.map(n => n.date),
            ...steps.map(s => s.date),
          ]).size,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      await Share.share({
        message: jsonString,
        title: 'FitApp Data Export',
      });

      successHaptic();
    } catch (error) {
      logError('Error exporting data', error);
      Alert.alert('Error', 'Failed to export data');
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
    warningHaptic();
    openConfirmDialog({
      title,
      message,
      confirmText,
      icon,
      iconColor,
      onConfirm,
    });
  };

  const handleDeleteWorkouts = async () => {
    await AsyncStorage.removeItem('@fit_app_workouts');
    invalidateWorkoutCache();
    Alert.alert('Success', 'All workouts deleted');
  };

  const handleDeleteNutrition = async () => {
    await AsyncStorage.removeItem('@fit_app_nutrition');
    Alert.alert('Success', 'All nutrition data deleted');
  };

  const handleDeleteSteps = async () => {
    await AsyncStorage.removeItem('@fit_app_steps');
    Alert.alert('Success', 'All step data deleted');
  };

  const handleResetAll = async () => {
    await clearAllData();
    invalidateWorkoutCache();
    refreshUser();
    Alert.alert('Success', 'All data has been reset');
  };

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    showConfirmDialog(
      'Delete Template?',
      `Are you sure you want to delete "${templateName}"? This cannot be undone.`,
      async () => {
        await deleteTemplate(templateId);
        Alert.alert('Success', 'Template deleted');
      },
      'Delete Template',
      'document-text',
      colors.error
    );
  };

  const handleLogout = () => {
    showConfirmDialog(
      'Log Out?',
      'Are you sure you want to log out of your account?',
      async () => {
        await signOut();
      },
      'Log Out',
      'log-out-outline',
      colors.warning
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardDismissMode="on-drag">
      {/* Profile Info */}
      <GlassCard accent="blue" glowIntensity="subtle">
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrapper}>
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              style={styles.iconGradient}
            >
              <Ionicons name="person" size={20} color={colors.text} />
            </LinearGradient>
          </View>
          <Text style={styles.cardTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
          {!isEditing ? (
            <Pressable
              onPress={() => { lightHaptic(); setIsEditing(true); }}
              style={styles.editButtonWrapper}
            >
              <Text style={styles.editButton}>Edit</Text>
            </Pressable>
          ) : (
            <View style={styles.editActions}>
              <Pressable onPress={() => setIsEditing(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
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
              placeholderTextColor={colors.textMuted}
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
              placeholderTextColor={colors.textMuted}
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
              placeholderTextColor={colors.textMuted}
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
              placeholderTextColor={colors.textMuted}
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
            <Pressable
              style={[
                styles.unitButton,
                user.preferredWeightUnit === 'lbs' && styles.unitButtonActive,
              ]}
              onPress={() => { lightHaptic(); updateUser({ preferredWeightUnit: 'lbs' }); }}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  user.preferredWeightUnit === 'lbs' && styles.unitButtonTextActive,
                ]}
              >
                lbs
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.unitButton,
                user.preferredWeightUnit === 'kg' && styles.unitButtonActive,
              ]}
              onPress={() => { lightHaptic(); updateUser({ preferredWeightUnit: 'kg' }); }}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  user.preferredWeightUnit === 'kg' && styles.unitButtonTextActive,
                ]}
              >
                kg
              </Text>
            </Pressable>
          </View>
        </View>
      </GlassCard>

      {/* App Info */}
      <GlassCard accent="violet" glowIntensity="subtle">
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrapper}>
            <LinearGradient
              colors={[colors.analyticsLight, colors.analytics]}
              style={styles.iconGradient}
            >
              <Ionicons name="information-circle" size={20} color={colors.text} />
            </LinearGradient>
          </View>
          <Text style={styles.cardTitle}>About</Text>
        </View>
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
        <View style={styles.divider} />
        <Text style={styles.label}>Sync Status</Text>
        <SyncStatus />
      </GlassCard>

      {/* Account */}
      <GlassCard accent="gold" glowIntensity="subtle">
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrapper}>
            <LinearGradient
              colors={[colors.goldLight, colors.gold]}
              style={styles.iconGradient}
            >
              <Ionicons name="person-circle" size={20} color={colors.text} />
            </LinearGradient>
          </View>
          <Text style={styles.cardTitle}>Account</Text>
        </View>
        <GlassButton
          title="Log Out"
          icon="log-out-outline"
          onPress={handleLogout}
          variant="secondary"
          fullWidth
        />
      </GlassCard>

      {/* Workout Templates */}
      <CollapsibleSection
        title="Workout Templates"
        icon="document-text-outline"
        iconColor={colors.cyan}
        headerRight={
          templates.length > 0 ? (
            <Text style={styles.headerBadge}>
              {templates.length}
            </Text>
          ) : undefined
        }
      >
        {templates.length > 0 ? (
          <>
            {templates.map((template) => (
              <View key={template.id} style={styles.templateItem}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDetails}>
                    {template.exercises.length} {template.exercises.length === 1 ? 'exercise' : 'exercises'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteTemplate(template.id, template.name)}
                  style={styles.deleteTemplateButton}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyTemplates}>
            <Ionicons name="document-text-outline" size={40} color={colors.textTertiary} />
            <Text style={styles.emptyTemplatesText}>No templates yet</Text>
            <Text style={styles.emptyTemplatesSubtext}>
              Create a workout and save it as a template to reuse it later
            </Text>
          </View>
        )}
      </CollapsibleSection>

      {/* Your Data */}
      <GlassCard accent="emerald" glowIntensity="subtle">
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrapper}>
            <LinearGradient
              colors={[colors.stepsLight, colors.steps]}
              style={styles.iconGradient}
            >
              <Ionicons name="cloud-download" size={20} color={colors.text} />
            </LinearGradient>
          </View>
          <Text style={styles.cardTitle}>Your Data</Text>
        </View>
        <GlassButton
          title="Export All Data"
          icon="download-outline"
          onPress={handleExportData}
          variant="success"
          fullWidth
        />
        <Text style={styles.helpText}>
          Export your workouts, nutrition, and tracking data as JSON
        </Text>
      </GlassCard>

      {/* Danger Zone */}
      <CollapsibleSection
        title="Delete Data"
        icon="warning-outline"
        iconColor={colors.error}
        defaultExpanded={false}
      >
        <Text style={styles.dangerSubtitle}>
          Choose what data to delete. This cannot be undone.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.dangerButton, pressed && styles.dangerButtonPressed]}
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
          <Ionicons name="barbell" size={20} color={colors.error} />
          <Text style={styles.dangerButtonText}>Delete All Workouts</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.dangerButton, pressed && styles.dangerButtonPressed]}
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
          <Ionicons name="nutrition" size={20} color={colors.error} />
          <Text style={styles.dangerButtonText}>Delete All Nutrition</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.dangerButton, pressed && styles.dangerButtonPressed]}
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
          <Ionicons name="footsteps" size={20} color={colors.error} />
          <Text style={styles.dangerButtonText}>Delete All Steps</Text>
        </Pressable>

        <View style={styles.divider} />

        <GlassButton
          title="Reset All Data"
          icon="warning"
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
          variant="danger"
          fullWidth
        />
      </CollapsibleSection>
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
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  cardIconWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: 0.2,
  },
  headerSpacer: {
    flex: 1,
  },
  editButtonWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editButton: {
    fontSize: typography.size.base,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cancelButtonText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  saveButtonText: {
    fontSize: typography.size.base,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
  settingItem: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.size.base,
    color: colors.text,
    fontWeight: typography.weight.medium,
  },
  input: {
    fontSize: typography.size.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: glass.backgroundLight,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.size.base,
    color: colors.text,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unitButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  unitButtonTextActive: {
    color: colors.text,
  },
  dangerSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.errorMuted,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  dangerButtonPressed: {
    backgroundColor: `${colors.error}40`,
  },
  dangerButtonText: {
    fontSize: typography.size.base,
    color: colors.error,
    marginLeft: spacing.sm,
    fontWeight: typography.weight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: glass.border,
    marginVertical: spacing.md,
  },
  helpText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: glass.border,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  templateDetails: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  deleteTemplateButton: {
    padding: spacing.sm,
    backgroundColor: colors.errorMuted,
    borderRadius: radius.md,
  },
  emptyTemplates: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyTemplatesText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyTemplatesSubtext: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
  headerBadge: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    backgroundColor: glass.backgroundLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
});

export default ProfileScreen;
