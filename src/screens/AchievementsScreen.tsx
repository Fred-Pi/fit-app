import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AchievementCard from '../components/AchievementCard';
import { getAchievements, checkAndUpdateAchievements } from '../services/storage';
import { Achievement, AchievementCategory } from '../types';
import { colors, spacing, radius } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';
import { useScreenData } from '../hooks/useScreenData';
import { achievementCategoryColors } from '../data/achievements';
import { selectionHaptic } from '../utils/haptics';

type FilterCategory = 'All' | AchievementCategory;

const categories: FilterCategory[] = ['All', 'Workouts', 'Streaks', 'Strength', 'Consistency', 'Variety'];

const AchievementsScreen = () => {
  const { contentMaxWidth } = useResponsive();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');

  const fetchData = useCallback(async () => {
    await checkAndUpdateAchievements();
    const data = await getAchievements();
    setAchievements(data);
  }, []);

  const { refreshing, onRefresh } = useScreenData(fetchData);

  const filteredAchievements = selectedCategory === 'All'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold, colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="trophy" size={32} color={colors.gold} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Achievements</Text>
            <Text style={styles.subtitle}>
              {unlockedCount} of {totalCount} unlocked
            </Text>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map(category => {
            const isActive = selectedCategory === category;
            const categoryColor = category === 'All'
              ? colors.primary
              : achievementCategoryColors[category];

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  isActive && { backgroundColor: `${categoryColor}20`, borderColor: categoryColor },
                ]}
                onPress={() => {
                  selectionHaptic();
                  setSelectedCategory(category);
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && { color: categoryColor },
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Achievement Grid */}
        {filteredAchievements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No achievements yet</Text>
            <Text style={styles.emptyText}>
              Start working out to unlock achievements!
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredAchievements.map((achievement, index) => (
              <View
                key={achievement.id}
                style={[
                  styles.gridItem,
                  index % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight,
                ]}
              >
                <AchievementCard achievement={achievement} />
              </View>
            ))}
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
  contentContainer: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: spacing.xl,
    marginHorizontal: -spacing.xl,
  },
  filterContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  gridItemLeft: {
    paddingLeft: 0,
    paddingRight: spacing.sm,
  },
  gridItemRight: {
    paddingLeft: spacing.sm,
    paddingRight: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default AchievementsScreen;
