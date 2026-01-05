import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import FilterChip from '../components/FilterChip';
import { PersonalRecord, User } from '../types';
import { getPersonalRecords, deletePersonalRecord, getUser } from '../services/storage';

const PRScreen = () => {
  const [prs, setPRs] = useState<PersonalRecord[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadData = async () => {
    try {
      const userData = await getUser();
      setUser(userData);

      const records = await getPersonalRecords();
      // Sort by weight descending
      const sortedRecords = records.sort((a, b) => b.weight - a.weight);
      setPRs(sortedRecords);
    } catch (error) {
      console.error('Error loading PRs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeletePR = async (pr: PersonalRecord) => {
    setConfirmDialog({
      visible: true,
      title: 'Delete Personal Record?',
      message: `Are you sure you want to delete the PR for ${pr.exerciseName}? This cannot be undone.`,
      onConfirm: async () => {
        await deletePersonalRecord(pr.id);
        setConfirmDialog({ ...confirmDialog, visible: false });
        loadData();
        Alert.alert('Success', 'Personal record deleted');
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group PRs by muscle group (simple categorization based on common exercises)
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

    // Filter out empty categories
    return Object.entries(categories).filter(([_, records]) => records.length > 0);
  };

  const getFilteredPRs = (): PersonalRecord[] => {
    let filtered = prs;

    // Apply category filter
    if (selectedCategory !== 'All') {
      const grouped = groupPRsByCategory();
      const categoryGroup = grouped.find(([cat]) => cat === selectedCategory);
      filtered = categoryGroup ? categoryGroup[1] : [];
    }

    // Apply search filter
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
                {pr.weight} {user?.preferredWeightUnit || 'lbs'}
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
  );

  const categoryIcons: { [key: string]: string } = {
    Chest: 'fitness-outline',
    Back: 'body-outline',
    Shoulders: 'triangle-outline',
    Arms: 'hand-left-outline',
    Legs: 'walk-outline',
    Core: 'square-outline',
    Other: 'barbell-outline',
  };

  const categoryColors: { [key: string]: string } = {
    Chest: '#FF6B6B',
    Back: '#4ECDC4',
    Shoulders: '#95E1D3',
    Arms: '#F38181',
    Legs: '#FFE66D',
    Core: '#A8DADC',
    Other: '#3A9BFF',
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const groupedPRs = groupPRsByCategory();
  const filteredPRs = getFilteredPRs();
  const hasActiveFilters = selectedCategory !== 'All' || searchQuery.trim() !== '';
  const shouldShowGrouped = !hasActiveFilters;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerIcon}>
            <Ionicons name="trophy" size={32} color="#FFD60A" />
          </View>
          <Text style={styles.headerTitle}>Personal Records</Text>
          <Text style={styles.headerSubtitle}>
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
              setSearchQuery('');
              setSelectedCategory('All');
            }}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {prs.length > 0 ? (
          shouldShowGrouped ? (
            // Grouped view (current behavior)
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
            // Filtered flat view
            filteredPRs.length > 0 ? (
              filteredPRs.map(pr => renderPRCard(pr))
            ) : (
              // Empty filter state
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
            <Text style={styles.emptyTitle}>No Personal Records Yet</Text>
            <Text style={styles.emptyText}>
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
      </ScrollView>

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, visible: false })}
        icon="trophy"
        iconColor="#FF3B30"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E14',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
  },
  loadingText: {
    fontSize: 16,
    color: '#A0A0A8',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#A0A0A8',
    fontWeight: '500',
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
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  categoryCount: {
    fontSize: 15,
    color: '#A0A0A8',
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
    color: '#FFFFFF',
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
    color: '#FFD60A',
  },
  prLabel: {
    fontSize: 15,
    color: '#A0A0A8',
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
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#A0A0A8',
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
    color: '#3A9BFF',
    lineHeight: 18,
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#3A9BFF',
    fontWeight: '600',
  },
  emptyFilterState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyFilterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyFilterText: {
    fontSize: 15,
    color: '#A0A0A8',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default PRScreen;
