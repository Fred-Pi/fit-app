import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { colors, glass, spacing, typography, radius } from '../utils/theme';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

const StreakCard: React.FC<StreakCardProps> = ({
  currentStreak,
  longestStreak,
}) => {
  const hasActiveStreak = currentStreak > 0;
  const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak;

  const getMessage = () => {
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak === 1) return "Great start! Keep it going!";
    if (currentStreak < 7) return "Building momentum!";
    if (currentStreak < 14) return "One week strong!";
    if (currentStreak < 30) return "You're on fire!";
    return "Unstoppable!";
  };

  const flameColor = hasActiveStreak ? colors.warning : colors.textTertiary;
  const glowIntensity = hasActiveStreak ? (isNewRecord ? 'strong' : 'medium') : 'none';

  return (
    <GlassCard accent={hasActiveStreak ? 'gold' : 'none'} glowIntensity={glowIntensity}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.flameContainer}>
            <LinearGradient
              colors={hasActiveStreak ? ['#FFD93D', '#FF9500', '#FF6B35'] : [colors.textTertiary, colors.textMuted]}
              style={styles.flameGradient}
            >
              <Ionicons
                name={hasActiveStreak ? "flame" : "flame-outline"}
                size={24}
                color={colors.text}
              />
            </LinearGradient>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {hasActiveStreak ? `${currentStreak} Day Streak` : "No Active Streak"}
            </Text>
            <Text style={styles.motivationText}>{getMessage()}</Text>
          </View>
        </View>
        {isNewRecord && (
          <LinearGradient
            colors={[colors.gold, colors.warning]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recordBadge}
          >
            <Ionicons name="trophy" size={12} color="#000" />
            <Text style={styles.recordText}>BEST</Text>
          </LinearGradient>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="flame" size={18} color={colors.warning} />
          </View>
          <Text style={[
            styles.statValue,
            hasActiveStreak && styles.statValueActive
          ]}>
            {currentStreak}
          </Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="trophy" size={18} color={colors.gold} />
          </View>
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
      </View>

      {/* Progress to beat record */}
      {hasActiveStreak && !isNewRecord && longestStreak > 0 && (
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {longestStreak - currentStreak} {longestStreak - currentStreak === 1 ? 'day' : 'days'} to beat your record
          </Text>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#FF9500', '#FFD60A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${Math.min((currentStreak / longestStreak) * 100, 100)}%` }
              ]}
            />
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  flameContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  flameGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  motivationText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  recordText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.extrabold,
    color: '#000000',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: glass.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.extrabold,
    color: colors.text,
    letterSpacing: -1,
  },
  statValueActive: {
    color: colors.warning,
  },
  statLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: glass.border,
  },
  progressSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  progressText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});

export default StreakCard;
