/**
 * QuickStartScreen - Step 1 of the new Add Workout flow
 *
 * Presents options to start a fresh workout, use a template, or repeat a recent workout.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkoutStore, useActiveWorkoutStore } from '../stores';
import { WorkoutsStackParamList } from '../navigation/WorkoutsStack';
import { WorkoutLog, WorkoutTemplate } from '../types';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import { lightHaptic } from '../utils/haptics';

type NavigationProp = StackNavigationProp<WorkoutsStackParamList, 'QuickStart'>;

const QuickStartScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // Stores
  const templates = useWorkoutStore((s) => s.templates);
  const fetchTemplates = useWorkoutStore((s) => s.fetchTemplates);
  const getRecentWorkouts = useWorkoutStore((s) => s.getRecentWorkouts);
  const fetchWorkouts = useWorkoutStore((s) => s.fetchWorkouts);
  const startWorkout = useActiveWorkoutStore((s) => s.startWorkout);
  const startFromRecent = useActiveWorkoutStore((s) => s.startFromRecent);

  const recentWorkouts = getRecentWorkouts(5);

  useEffect(() => {
    fetchTemplates();
    fetchWorkouts();
  }, []);

  const handleStartFresh = () => {
    lightHaptic();
    startWorkout(null);
    navigation.navigate('ActiveWorkout', {});
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    lightHaptic();
    startWorkout(template);
    navigation.navigate('ActiveWorkout', { templateId: template.id });
  };

  const handleRepeatWorkout = (workout: WorkoutLog) => {
    lightHaptic();
    startFromRecent(workout);
    navigation.navigate('ActiveWorkout', { repeatWorkoutId: workout.id });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTemplateItem = ({ item }: { item: WorkoutTemplate }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => handleSelectTemplate(item)}
      activeOpacity={0.7}
    >
      <View style={styles.templateIcon}>
        <Ionicons name="document-text" size={20} color={colors.primary} />
      </View>
      <View style={styles.templateInfo}>
        <Text style={styles.templateName}>{item.name}</Text>
        <Text style={styles.templateMeta}>
          {item.exercises.length} exercise{item.exercises.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: WorkoutLog }) => (
    <TouchableOpacity
      style={styles.recentCard}
      onPress={() => handleRepeatWorkout(item)}
      activeOpacity={0.7}
    >
      <View style={styles.recentIcon}>
        <Ionicons name="refresh" size={18} color={colors.success} />
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentName}>{item.name}</Text>
        <Text style={styles.recentMeta}>
          {formatDate(item.date)} • {item.exercises.length} exercises
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Start Fresh Card */}
        <GlassCard accent="blue" glowIntensity="subtle" style={styles.startFreshCard}>
          <LinearGradient
            colors={[colors.primaryMuted, 'transparent']}
            style={styles.startFreshGradient}
          >
            <View style={styles.startFreshContent}>
              <View style={styles.startFreshIcon}>
                <Ionicons name="add-circle" size={48} color={colors.primary} />
              </View>
              <Text style={styles.startFreshTitle}>Start Fresh</Text>
              <Text style={styles.startFreshSubtitle}>
                Begin an empty workout and add exercises as you go
              </Text>
              <GlassButton
                title="Start Workout"
                onPress={handleStartFresh}
                variant="primary"
                icon="play"
                size="lg"
                style={styles.startFreshButton}
              />
            </View>
          </LinearGradient>
        </GlassCard>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or choose a starting point</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Templates Section */}
        {templates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="albums" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Templates</Text>
            </View>
            <FlatList
              data={templates}
              renderItem={renderTemplateItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          </View>
        )}

        {/* Recent Workouts Section */}
        {recentWorkouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={colors.success} />
              <Text style={styles.sectionTitle}>Recent Workouts</Text>
            </View>
            <FlatList
              data={recentWorkouts}
              renderItem={renderRecentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          </View>
        )}

        {/* Empty State */}
        {templates.length === 0 && recentWorkouts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyStateText}>
              No templates or recent workouts yet.{'\n'}
              Start fresh and create your first workout!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
  startFreshCard: {
    marginBottom: spacing.xl,
  },
  startFreshGradient: {
    borderRadius: radius.xl,
  },
  startFreshContent: {
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  startFreshIcon: {
    marginBottom: spacing.lg,
  },
  startFreshTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  startFreshSubtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  startFreshButton: {
    minWidth: 200,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: glass.border,
  },
  dividerText: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    marginHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.border,
    padding: spacing.lg,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
  templateMeta: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.border,
    padding: spacing.lg,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  recentMeta: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  itemSeparator: {
    height: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyStateText: {
    fontSize: typography.size.base,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 22,
  },
});

export default QuickStartScreen;
