import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PersonalRecord } from '../../types';
import Card from '../../components/Card';
import SearchBar from '../../components/SearchBar';
import FilterChip from '../../components/FilterChip';
import DataTable from '../../components/DataTable';
import { colors, getResponsiveTypography } from '../../utils/theme';
import { useResponsive } from '../../hooks/useResponsive';
import { warningHaptic } from '../../utils/haptics';
import { useUserStore, useUIStore, useWorkoutStore } from '../../stores';

const CATEGORY_ICONS: { [key: string]: string } = {
  Chest: 'fitness-outline',
  Back: 'body-outline',
  Shoulders: 'triangle-outline',
  Arms: 'hand-left-outline',
  Legs: 'walk-outline',
  Core: 'square-outline',
  Other: 'barbell-outline',
};

const CATEGORY_COLORS: { [key: string]: string } = {
  Chest: '#FF6B6B',
  Back: '#4ECDC4',
  Shoulders: '#95E1D3',
  Arms: '#F38181',
  Legs: '#FFE66D',
  Core: '#A8DADC',
  Other: colors.primary,
};

const PRsTab: React.FC = () => {
  const { typographyScale } = useResponsive();
  const scaledType = getResponsiveTypography(typographyScale);
  const isWeb = Platform.OS === 'web';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const user = useUserStore((s) => s.user);
  const openConfirmDialog = useUIStore((s) => s.openConfirmDialog);

  const personalRecords = useWorkoutStore((s) => s.personalRecords);
  const isPRsLoading = useWorkoutStore((s) => s.isPRsLoading);
  const fetchPersonalRecords = useWorkoutStore((s) => s.fetchPersonalRecords);
  const deletePersonalRecord = useWorkoutStore((s) => s.deletePersonalRecord);

  const prs = [...personalRecords].sort((a, b) => b.weight - a.weight);

  useEffect(() => {
    fetchPersonalRecords();
  }, [fetchPersonalRecords]);

  useFocusEffect(
    useCallback(() => {
      fetchPersonalRecords();
    }, [fetchPersonalRecords])
  );

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
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const groupPRsByCategory = () => {
    const categories: { [key: string]: PersonalRecord[] } = {
      Chest: [],
      Back: [],
      Shoulders: [],
      Arms: [],
      Legs: [],
      Core: [],
      Other: [],
    };

    prs.forEach(pr => {
      const exerciseLower = pr.exerciseName.toLowerCase();
      if (exerciseLower.includes('bench') || exerciseLower.includes('chest') ||
          exerciseLower.includes('fly') || exerciseLower.includes('push-up')) {
        categories.Chest.push(pr);
      } else if (exerciseLower.includes('row') || exerciseLower.includes('pull') ||
                 exerciseLower.includes('deadlift') || exerciseLower.includes('lat')) {
        categories.Back.push(pr);
      } else if (exerciseLower.includes('shoulder') || exerciseLower.includes('press') ||
                 exerciseLower.includes('raise') || exerciseLower.includes('delt')) {
        categories.Shoulders.push(pr);
      } else if (exerciseLower.includes('curl') || exerciseLower.includes('tricep') ||
                 exerciseLower.includes('bicep') || exerciseLower.includes('arm')) {
        categories.Arms.push(pr);
      } else if (exerciseLower.includes('squat') || exerciseLower.includes('leg') ||
                 exerciseLower.includes('lunge') || exerciseLower.includes('calf')) {
        categories.Legs.push(pr);
      } else if (exerciseLower.includes('plank') || exerciseLower.includes('crunch') ||
                 exerciseLower.includes('core') || exerciseLower.includes('ab')) {
        categories.Core.push(pr);
      } else {
        categories.Other.push(pr);
      }
    });

    return Object.entries(categories).filter(([_, records]) => records.length > 0);
  };

  const getFilteredPRs = (): PersonalRecord[] => {
    let filtered = prs;

    if (selectedCategory !== 'All') {
      const grouped = groupPRsByCategory();
      const categoryGroup = grouped.find(([cat]) => cat === selectedCategory);
      filtered = categoryGroup ? categoryGroup[1] : [];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pr =>
        pr.exerciseName.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

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
              <Text style={styles.prLabel}>&times; {pr.reps} reps</Text>
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
  );

  const prTableColumns = [
    { key: 'exerciseName' as const, label: 'Exercise', minWidth: 180 },
    {
      key: 'weight' as const,
      label: `Weight (${user?.preferredWeightUnit || 'kg'})`,
      align: 'right' as const,
      width: 120,
      render: (pr: PersonalRecord) => (
        <Text style={styles.tableWeightText}>{pr.weight}</Text>
      ),
    },
    {
      key: 'reps' as const,
      label: 'Reps',
      align: 'center' as const,
      width: 80,
    },
    {
      key: 'date' as const,
      label: 'Date',
      width: 140,
      render: (pr: PersonalRecord) => formatDate(pr.date),
    },
  ];

  const renderTableActions = (pr: PersonalRecord) => (
    <Pressable
      style={({ pressed }) => [
        styles.tableDeleteButton,
        pressed && styles.tableDeleteButtonPressed,
      ]}
      onPress={() => handleDeletePR(pr)}
    >
      <Ionicons name="trash-outline" size={16} color={colors.error} />
    </Pressable>
  );

  if (isPRsLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading PRs...</Text>
      </View>
    );
  }

  const groupedPRs = groupPRsByCategory();
  const filteredPRs = getFilteredPRs();
  const hasActiveFilters = selectedCategory !== 'All' || searchQuery.trim() !== '';
  const shouldShowGrouped = !hasActiveFilters;

  return (
    <>
      <View style={styles.prsHeaderSection}>
        <View style={styles.prsHeaderIcon}>
          <Ionicons name="trophy" size={32} color="#FFD60A" />
        </View>
        <Text style={[styles.prsHeaderTitle, { fontSize: scaledType['3xl'] }]}>Personal Records</Text>
        <Text style={[styles.prsHeaderSubtitle, { fontSize: scaledType.base }]}>
          {prs.length} {prs.length === 1 ? 'record' : 'records'} tracked
        </Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search exercises..."
      />

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
        {Object.keys(CATEGORY_ICONS).map(category => (
          <FilterChip
            key={category}
            label={category}
            icon={CATEGORY_ICONS[category]}
            color={CATEGORY_COLORS[category]}
            active={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
          />
        ))}
      </ScrollView>

      {hasActiveFilters && (
        <View style={styles.activeFilterBanner}>
          <Text style={styles.filterResultText}>
            {filteredPRs.length} {filteredPRs.length === 1 ? 'result' : 'results'}
          </Text>
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setSelectedCategory('All');
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
                    name={CATEGORY_ICONS[category] as React.ComponentProps<typeof Ionicons>['name']}
                    size={20}
                    color={CATEGORY_COLORS[category]}
                  />
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <Text style={styles.categoryCount}>({records.length})</Text>
                </View>
                {isWeb ? (
                  <DataTable<PersonalRecord>
                    columns={prTableColumns}
                    data={records}
                    keyExtractor={(pr) => pr.id}
                    defaultSortKey="weight"
                    renderRowActions={renderTableActions}
                    renderMobileItem={(pr) => renderPRCard(pr)}
                  />
                ) : (
                  records.map(pr => renderPRCard(pr))
                )}
              </View>
            ))}
          </>
        ) : (
          filteredPRs.length > 0 ? (
            isWeb ? (
              <DataTable<PersonalRecord>
                columns={prTableColumns}
                data={filteredPRs}
                keyExtractor={(pr) => pr.id}
                defaultSortKey="weight"
                renderRowActions={renderTableActions}
                renderMobileItem={(pr) => renderPRCard(pr)}
              />
            ) : (
              filteredPRs.map(pr => renderPRCard(pr))
            )
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
  );
};

export const refreshPRs = () => {
  useWorkoutStore.getState().fetchPersonalRecords(true);
};

const styles = StyleSheet.create({
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
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
  tableWeightText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
  },
  tableDeleteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 94, 109, 0.1)',
  },
  tableDeleteButtonPressed: {
    opacity: 0.7,
  },
});

export default PRsTab;
