import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';
import OverviewTab, { refreshOverview } from './analytics/OverviewTab';
import ChartsTab from './analytics/ChartsTab';
import PRsTab, { refreshPRs } from './analytics/PRsTab';
import StrengthTab from './analytics/StrengthTab';
import MuscleTab from './analytics/MuscleTab';

type TabType = 'overview' | 'charts' | 'prs' | 'strength' | 'muscle';

interface TabConfig {
  key: TabType;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const TABS: TabConfig[] = [
  { key: 'overview', label: 'Overview', icon: 'pulse' },
  { key: 'charts', label: 'Charts', icon: 'analytics' },
  { key: 'prs', label: 'PRs', icon: 'trophy' },
  { key: 'strength', label: 'Strength', icon: 'barbell' },
  { key: 'muscle', label: 'Muscle', icon: 'body' },
];

const AnalyticsScreen = () => {
  const { contentMaxWidth } = useResponsive();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'overview') {
        refreshOverview();
      } else if (activeTab === 'prs') {
        refreshPRs();
      }
      // Charts, Strength, and Muscle tabs manage their own data loading
    } finally {
      // Brief delay so the spinner is visible
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'charts':
        return <ChartsTab />;
      case 'prs':
        return <PRsTab />;
      case 'strength':
        return <StrengthTab />;
      case 'muscle':
        return <MuscleTab />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.segmentButton,
              activeTab === tab.key && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? colors.text : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === tab.key && styles.segmentTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
            tintColor={colors.primary}
          />
        }
      >
        {renderActiveTab()}
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
});

export default AnalyticsScreen;
