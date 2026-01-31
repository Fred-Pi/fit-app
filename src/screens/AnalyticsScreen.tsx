import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DateRangeKey, PersonalRecord } from '../types';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { useTrainingVolume } from '../hooks/useTrainingVolume';
import { useWorkoutFrequency } from '../hooks/useWorkoutFrequency';
import DateRangeSelector from '../components/analytics/DateRangeSelector';
import TrainingVolumeChart from '../components/analytics/TrainingVolumeChart';
import WorkoutFrequencyChart from '../components/analytics/WorkoutFrequencyChart';
import StrengthCalculator from '../components/analytics/StrengthCalculator';
import ExerciseProgressionChart from '../components/analytics/ExerciseProgressionChart';
import MuscleGroupHeatmap from '../components/analytics/MuscleGroupHeatmap';
import { useMuscleGroupData } from '../hooks/useMuscleGroupData';
import Card from '../components/Card';
import SearchBar from '../components/SearchBar';
import FilterChip from '../components/FilterChip';
import WeeklyStatsCard from '../components/WeeklyStatsCard';
import StreakCard from '../components/StreakCard';
import WorkoutSuggestionsCard from '../components/WorkoutSuggestionsCard';
import WeightChart from '../components/WeightChart';
import { calculateWorkoutSuggestions } from '../utils/workoutSuggestions';
import { getTodayDate } from '../services/storage';
import { colors } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';
import { warningHaptic } from '../utils/haptics';
import {
  useUserStore,
  useUIStore,
  useWorkoutStore,
  useDailyTrackingStore,
} from '../stores';

type TabType = 'overview' | 'charts' | 'prs' | 'strength' | 'muscle'

const AnalyticsScreen = () => {
  const { contentMaxWidth } = useResponsive();
  const date = getTodayDate();
  const [selectedRange, setSelectedRange] = useState<DateRangeKey>('3M');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // User Store
  const user = useUserStore((s) => s.user);

  // UI Store
  const openConfirmDialog = useUIStore((s) => s.openConfirmDialog);

  // Workout Store
  const allWorkouts = useWorkoutStore((s) => s.workouts);
  const currentStreak = useWorkoutStore((s) => s.currentStreak);
  const longestStreak = useWorkoutStore((s) => s.longestStreak);
  const personalRecords = useWorkoutStore((s) => s.personalRecords);
  const isPRsLoading = useWorkoutStore((s) => s.isPRsLoading);
  const isPRsRefreshing = useWorkoutStore((s) => s.isPRsRefreshing);
  const fetchPersonalRecords = useWorkoutStore((s) => s.fetchPersonalRecords);
  const fetchWorkouts = useWorkoutStore((s) => s.fetchWorkouts);
  const deletePersonalRecord = useWorkoutStore((s) => s.deletePersonalRecord);

  // Daily Tracking Store (for overview)
  const todayWeight = useDailyTrackingStore((s) => s.todayWeight);
  const recentWeights = useDailyTrackingStore((s) => s.recentWeights);
  const currentWeekStats = useDailyTrackingStore((s) => s.currentWeekStats);
  const previousWeekStats = useDailyTrackingStore((s) => s.previousWeekStats);
  const weekComparison = useDailyTrackingStore((s) => s.weekComparison);
  const fetchTodayWeight = useDailyTrackingStore((s) => s.fetchTodayWeight);
  const fetchRecentWeights = useDailyTrackingStore((s) => s.fetchRecentWeights);
  const fetchWeeklyStats = useDailyTrackingStore((s) => s.fetchWeeklyStats);

  // Workout suggestions
  const suggestions = allWorkouts.length > 0 ? calculateWorkoutSuggestions(allWorkouts) : null;

  // Charts state
  const { workouts, loading: chartsLoading, refreshing: chartsRefreshing, refresh: refreshCharts } = useAnalyticsData(selectedRange);
  const { volumeData, stats: volumeStats } = useTrainingVolume(workouts);
  const { frequencyData, stats: frequencyStats } = useWorkoutFrequency(workouts);
  const muscleData = useMuscleGroupData(workouts, 7);

  // Sorted PRs
  const prs = [...personalRecords].sort((a, b) => b.weight - a.weight);

  // Load overview data
  const loadOverviewData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      fetchWorkouts(),
      fetchTodayWeight(date, user.id, user.preferredWeightUnit),
      fetchRecentWeights(date, 30, user.id),
      fetchWeeklyStats(user),
    ]);
  }, [user, date, fetchWorkouts, fetchTodayWeight, fetchRecentWeights, fetchWeeklyStats]);

  // Initial load
  useEffect(() => {
    fetchPersonalRecords();
    loadOverviewData();
  }, [fetchPersonalRecords, loadOverviewData]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      fetchPersonalRecords();
      loadOverviewData();
    }, [fetchPersonalRecords, loadOverviewData])
  );

  const onRefresh = () => {
    if (activeTab === 'overview') {
      loadOverviewData();
    } else if (activeTab === 'charts') {
      refreshCharts();
    } else {
      fetchPersonalRecords(true);
    }
  };

  const handleDeletePR = (pr: PersonalRecord) => {
    warningHaptic();
    openConfirmDialog({
      title: 'Delete Personal Record?',
      message: `Are you sure you want to delete the PR for ${pr.exerciseName}? This cannot be undone.`,
      confirmText: 'Delete',
      icon: 'trophy',
      iconColor: '#FF3B30',
      onConfirm: async () => {
        await deletePersonalRecord(pr.id);
        Alert.alert('Success', 'Personal record deleted');
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const groupPRsByCategory = () => {
    const categories: { [key: string]: PersonalRecord[] } = {
      Chest: [],
      Back: [],
      Shoulders: [],
      Arms: [],
      Legs: [],
      Core: [],
      Other: [],
    }

    prs.forEach(pr => {
      const exerciseLower = pr.exerciseName.toLowerCase()
      if (exerciseLower.includes('bench') || exerciseLower.includes('chest') ||
          exerciseLower.includes('fly') || exerciseLower.includes('push-up')) {
        categories.Chest.push(pr)
      } else if (exerciseLower.includes('row') || exerciseLower.includes('pull') ||
                 exerciseLower.includes('deadlift') || exerciseLower.includes('lat')) {
        categories.Back.push(pr)
      } else if (exerciseLower.includes('shoulder') || exerciseLower.includes('press') ||
                 exerciseLower.includes('raise') || exerciseLower.includes('delt')) {
        categories.Shoulders.push(pr)
      } else if (exerciseLower.includes('curl') || exerciseLower.includes('tricep') ||
                 exerciseLower.includes('bicep') || exerciseLower.includes('arm')) {
        categories.Arms.push(pr)
      } else if (exerciseLower.includes('squat') || exerciseLower.includes('leg') ||
                 exerciseLower.includes('lunge') || exerciseLower.includes('calf')) {
        categories.Legs.push(pr)
      } else if (exerciseLower.includes('plank') || exerciseLower.includes('crunch') ||
                 exerciseLower.includes('core') || exerciseLower.includes('ab')) {
        categories.Core.push(pr)
      } else {
        categories.Other.push(pr)
      }
    })

    return Object.entries(categories).filter(([_, records]) => records.length > 0)
  }

  const getFilteredPRs = (): PersonalRecord[] => {
    let filtered = prs

    if (selectedCategory !== 'All') {
      const grouped = groupPRsByCategory()
      const categoryGroup = grouped.find(([cat]) => cat === selectedCategory)
      filtered = categoryGroup ? categoryGroup[1] : []
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(pr =>
        pr.exerciseName.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const categoryIcons: { [key: string]: string } = {
    Chest: 'fitness-outline',
    Back: 'body-outline',
    Shoulders: 'triangle-outline',
    Arms: 'hand-left-outline',
    Legs: 'walk-outline',
    Core: 'square-outline',
    Other: 'barbell-outline',
  }

  const categoryColors: { [key: string]: string } = {
    Chest: '#FF6B6B',
    Back: '#4ECDC4',
    Shoulders: '#95E1D3',
    Arms: '#F38181',
    Legs: '#FFE66D',
    Core: '#A8DADC',
    Other: colors.primary,
  }

  const renderPRCard = (pr: PersonalRecord) => (
    <Card key={pr.id}>
      <View style={styles.prItem}>
        <View style={styles.prInfo}>
          <Text style={styles.exerciseName}>{pr.exerciseName}</Text>
          <View style={styles.prDetails}>
            <View style={styles.prStat}>
              <Text style={styles.prValue}>
                {pr.weight} {user?.preferredWeightUnit || 'kg'}
              </Text>
              <Text style={styles.prLabel}>× {pr.reps} reps</Text>
            </View>
            <Text style={styles.prDate}>Set on {formatDate(pr.date)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePR(pr)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF5E6D" />
        </TouchableOpacity>
      </View>
    </Card>
  )

  const loading = activeTab === 'charts' ? chartsLoading : isPRsLoading;
  const refreshing = activeTab === 'charts' ? chartsRefreshing : isPRsRefreshing;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>
          {activeTab === 'charts' ? 'Loading analytics...' : 'Loading PRs...'}
        </Text>
      </View>
    )
  }

  const groupedPRs = groupPRsByCategory()
  const filteredPRs = getFilteredPRs()
  const hasActiveFilters = selectedCategory !== 'All' || searchQuery.trim() !== ''
  const shouldShowGrouped = !hasActiveFilters

  return (
    <View style={styles.container}>
      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeTab === 'overview' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name="pulse"
            size={18}
            color={activeTab === 'overview' ? colors.text : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'overview' && styles.segmentTextActive,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeTab === 'charts' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('charts')}
        >
          <Ionicons
            name="analytics"
            size={18}
            color={activeTab === 'charts' ? colors.text : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'charts' && styles.segmentTextActive,
            ]}
          >
            Charts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeTab === 'prs' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('prs')}
        >
          <Ionicons
            name="trophy"
            size={18}
            color={activeTab === 'prs' ? colors.text : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'prs' && styles.segmentTextActive,
            ]}
          >
            PRs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeTab === 'strength' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('strength')}
        >
          <Ionicons
            name="barbell"
            size={18}
            color={activeTab === 'strength' ? colors.text : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'strength' && styles.segmentTextActive,
            ]}
          >
            Strength
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeTab === 'muscle' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('muscle')}
        >
          <Ionicons
            name="body"
            size={18}
            color={activeTab === 'muscle' ? colors.text : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'muscle' && styles.segmentTextActive,
            ]}
          >
            Muscle
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'overview' && (
          <>
            {/* Overview Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Ionicons name="pulse" size={32} color={colors.success} />
                <View style={styles.headerText}>
                  <Text style={styles.title}>Progress Overview</Text>
                  <Text style={styles.subtitle}>
                    Your fitness journey at a glance
                  </Text>
                </View>
              </View>
            </View>

            {/* Streak Card */}
            <StreakCard
              currentStreak={currentStreak}
              longestStreak={longestStreak}
            />

            {/* Weekly Stats Card */}
            {currentWeekStats && (
              <WeeklyStatsCard
                currentWeek={currentWeekStats}
                previousWeek={previousWeekStats || undefined}
                comparison={weekComparison || undefined}
              />
            )}

            {/* Workout Suggestions Card */}
            {suggestions && suggestions.hasEnoughData && (
              <WorkoutSuggestionsCard suggestions={suggestions} />
            )}

            {/* Weight Progress */}
            {recentWeights.length > 0 && (
              <View style={styles.weightSection}>
                <Text style={styles.sectionTitle}>Weight Progress</Text>
                <View style={styles.weightCard}>
                  <WeightChart
                    weights={recentWeights}
                    unit={todayWeight?.unit || user?.preferredWeightUnit || 'lbs'}
                    goalWeight={user?.goalWeight}
                  />
                </View>
              </View>
            )}

            {/* Quick Stats */}
            <View style={styles.quickStatsSection}>
              <Text style={styles.sectionTitle}>Quick Stats</Text>
              <View style={styles.quickStatsGrid}>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>{allWorkouts.length}</Text>
                  <Text style={styles.quickStatLabel}>Total Workouts</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>{personalRecords.length}</Text>
                  <Text style={styles.quickStatLabel}>Personal Records</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'charts' && (
          <>
            {/* Charts Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Ionicons name="analytics" size={32} color="#3A9BFF" />
                <View style={styles.headerText}>
                  <Text style={styles.title}>Progress Analytics</Text>
                  <Text style={styles.subtitle}>
                    Track your training trends and consistency
                  </Text>
                </View>
              </View>
            </View>

            {/* Date Range Selector */}
            <DateRangeSelector
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
            />

            {/* Empty State */}
            {workouts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="bar-chart-outline" size={80} color="#3A3A42" />
                <Text style={styles.emptyTitle}>No Data Yet</Text>
                <Text style={styles.emptyText}>
                  Complete workouts to unlock your analytics dashboard
                </Text>
              </View>
            ) : (
              <>
                {/* Training Volume Chart */}
                <TrainingVolumeChart
                  volumeData={volumeData}
                  stats={volumeStats}
                  unit={user?.preferredWeightUnit || 'kg'}
                />

                {/* Workout Frequency Chart */}
                <WorkoutFrequencyChart
                  frequencyData={frequencyData}
                  stats={frequencyStats}
                />

                {/* Summary Stats */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Period Summary</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{workouts.length}</Text>
                      <Text style={styles.summaryLabel}>Total Workouts</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {workouts.reduce((sum, w) => sum + w.exercises.length, 0)}
                      </Text>
                      <Text style={styles.summaryLabel}>Total Exercises</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {workouts.reduce(
                          (sum, w) =>
                            sum +
                            w.exercises.reduce((eSum, e) => eSum + e.sets.length, 0),
                          0
                        )}
                      </Text>
                      <Text style={styles.summaryLabel}>Total Sets</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {Math.round(
                          workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / 60
                        )}h
                      </Text>
                      <Text style={styles.summaryLabel}>Total Time</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {activeTab === 'prs' && (
          <>
            {/* PRs Header */}
            <View style={styles.prsHeaderSection}>
              <View style={styles.prsHeaderIcon}>
                <Ionicons name="trophy" size={32} color="#FFD60A" />
              </View>
              <Text style={styles.prsHeaderTitle}>Personal Records</Text>
              <Text style={styles.prsHeaderSubtitle}>
                {prs.length} {prs.length === 1 ? 'record' : 'records'} tracked
              </Text>
            </View>

            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
            />

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterChipsContainer}
            >
              <FilterChip
                label="All"
                active={selectedCategory === 'All'}
                onPress={() => setSelectedCategory('All')}
              />
              {Object.keys(categoryIcons).map(category => (
                <FilterChip
                  key={category}
                  label={category}
                  icon={categoryIcons[category]}
                  color={categoryColors[category]}
                  active={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                />
              ))}
            </ScrollView>

            {/* Active Filter Indicator */}
            {hasActiveFilters && (
              <View style={styles.activeFilterBanner}>
                <Text style={styles.filterResultText}>
                  {filteredPRs.length} {filteredPRs.length === 1 ? 'result' : 'results'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                }}>
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            )}

            {prs.length > 0 ? (
              shouldShowGrouped ? (
                <>
                  {groupedPRs.map(([category, records]) => (
                    <View key={category}>
                      <View style={styles.categoryHeader}>
                        <Ionicons
                          name={categoryIcons[category] as any}
                          size={20}
                          color={categoryColors[category]}
                        />
                        <Text style={styles.categoryTitle}>{category}</Text>
                        <Text style={styles.categoryCount}>({records.length})</Text>
                      </View>
                      {records.map(pr => renderPRCard(pr))}
                    </View>
                  ))}
                </>
              ) : (
                filteredPRs.length > 0 ? (
                  filteredPRs.map(pr => renderPRCard(pr))
                ) : (
                  <View style={styles.emptyFilterState}>
                    <Ionicons name="search-outline" size={64} color="#A0A0A8" />
                    <Text style={styles.emptyFilterTitle}>No matching exercises</Text>
                    <Text style={styles.emptyFilterText}>
                      {searchQuery && selectedCategory !== 'All'
                        ? `No results for "${searchQuery}" in ${selectedCategory}`
                        : searchQuery
                        ? `No results for "${searchQuery}"`
                        : `No PRs in ${selectedCategory}`}
                    </Text>
                  </View>
                )
              )
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={80} color="#A0A0A8" />
                <Text style={styles.emptyStateTitle}>No Personal Records Yet</Text>
                <Text style={styles.emptyStateText}>
                  Start logging workouts with weights to track your strength progress!
                </Text>
                <View style={styles.emptyTip}>
                  <Ionicons name="information-circle-outline" size={20} color="#3A9BFF" />
                  <Text style={styles.emptyTipText}>
                    PRs are automatically tracked when you log workouts
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {activeTab === 'strength' && (
          <>
            {/* Strength Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Ionicons name="barbell" size={32} color={colors.primary} />
                <View style={styles.headerText}>
                  <Text style={styles.title}>Strength Analysis</Text>
                  <Text style={styles.subtitle}>
                    Track your progress and calculate your strength levels
                  </Text>
                </View>
              </View>
            </View>

            {/* Exercise Progression Chart */}
            <ExerciseProgressionChart
              workouts={workouts}
              unit={user?.preferredWeightUnit || 'kg'}
            />

            {/* 1RM Calculator & Strength Standards */}
            <StrengthCalculator user={user} />
          </>
        )}

        {activeTab === 'muscle' && (
          <>
            {/* Muscle Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Ionicons name="body" size={32} color={colors.success} />
                <View style={styles.headerText}>
                  <Text style={styles.title}>Muscle Balance</Text>
                  <Text style={styles.subtitle}>
                    Track which muscle groups need more attention
                  </Text>
                </View>
              </View>
            </View>

            {/* Muscle Group Heatmap */}
            <MuscleGroupHeatmap data={muscleData} />
          </>
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
    padding: 20,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.text,
  },
  // Charts styles
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceElevated,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  // PRs styles
  prsHeaderSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  prsHeaderIcon: {
    marginBottom: 12,
  },
  prsHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  prsHeaderSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipsContainer: {
    marginBottom: 16,
  },
  activeFilterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F1A2E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  filterResultText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  categoryCount: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  prItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  prDetails: {
    gap: 6,
  },
  prStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  prValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gold,
  },
  prLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  prDate: {
    fontSize: 13,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 94, 109, 0.1)',
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1A2E',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  emptyTipText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  emptyFilterState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyFilterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyFilterText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Overview styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  weightSection: {
    marginTop: 16,
  },
  weightCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  quickStatsSection: {
    marginTop: 24,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  quickStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
})

export default AnalyticsScreen
