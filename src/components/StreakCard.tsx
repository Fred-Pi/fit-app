import React from 'react';
import { colors } from '../utils/theme'
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  // Motivational messages based on streak
  const getMessage = () => {
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak === 1) return "Great start! Keep it going!";
    if (currentStreak < 7) return "Building momentum!";
    if (currentStreak < 14) return "One week strong!";
    if (currentStreak < 30) return "You're on fire!";
    return "Unstoppable!";
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={hasActiveStreak ? "flame" : "flame-outline"}
            size={24}
            color={hasActiveStreak ? "#FF9500" : "#A0A0A8"}
          />
          <View>
            <Text style={styles.headerTitle}>
              {hasActiveStreak ? `${currentStreak} Day Streak` : "No Active Streak"}
            </Text>
            <Text style={styles.motivationText}>{getMessage()}</Text>
          </View>
        </View>
        {isNewRecord && (
          <View style={styles.recordBadge}>
            <Text style={styles.recordText}>BEST</Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <Ionicons name="flame" size={18} color="#FF9500" />
            <Text style={[
              styles.statValue,
              hasActiveStreak && styles.statValueActive
            ]}>
              {currentStreak}
            </Text>
          </View>
          <Text style={styles.statLabel}>Current</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <Ionicons name="trophy" size={18} color="#FFD60A" />
            <Text style={styles.statValue}>{longestStreak}</Text>
          </View>
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
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min((currentStreak / longestStreak) * 100, 100)}%` }
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  motivationText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recordBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recordText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#2A2A30',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  statValueActive: {
    color: '#FF9500',
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  progressSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  progressText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 3,
  },
});

export default StreakCard;
