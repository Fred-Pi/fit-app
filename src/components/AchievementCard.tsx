import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '../types';
import { colors, spacing, radius } from '../utils/theme';
import { achievementCategoryColors } from '../data/achievements';

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const categoryColor = achievementCategoryColors[achievement.category] || colors.primary;
  const progress = Math.min((achievement.currentValue / achievement.targetValue) * 100, 100);
  const isUnlocked = achievement.isUnlocked;

  const formatUnlockedDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Unlocked today';
    if (diffDays === 1) return 'Unlocked yesterday';
    return `Unlocked ${diffDays} days ago`;
  };

  return (
    <View style={[styles.card, isUnlocked && styles.cardUnlocked]}>
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isUnlocked ? `${categoryColor}20` : colors.surfaceElevated },
        ]}
      >
        <Ionicons
          name={achievement.icon as keyof typeof Ionicons.glyphMap}
          size={28}
          color={isUnlocked ? categoryColor : colors.textTertiary}
        />
        {isUnlocked && (
          <View style={[styles.checkBadge, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark" size={10} color={colors.text} />
          </View>
        )}
        {!isUnlocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={12} color={colors.textTertiary} />
          </View>
        )}
      </View>

      {/* Content */}
      <Text
        style={[styles.title, !isUnlocked && styles.textLocked]}
        numberOfLines={1}
      >
        {achievement.title}
      </Text>
      <Text
        style={[styles.description, !isUnlocked && styles.textLocked]}
        numberOfLines={2}
      >
        {achievement.description}
      </Text>

      {/* Progress or Status */}
      {isUnlocked ? (
        <Text style={[styles.status, { color: categoryColor }]}>
          {formatUnlockedDate(achievement.unlockedDate)}
        </Text>
      ) : (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: categoryColor },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {achievement.currentValue}/{achievement.targetValue}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: 160,
  },
  cardUnlocked: {
    borderColor: colors.borderLight,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  textLocked: {
    opacity: 0.6,
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 'auto',
  },
  progressContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default AchievementCard;
