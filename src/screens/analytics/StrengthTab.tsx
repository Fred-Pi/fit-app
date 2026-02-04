import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateRangeKey } from '../../types';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import ExerciseProgressionChart from '../../components/analytics/ExerciseProgressionChart';
import StrengthCalculator from '../../components/analytics/StrengthCalculator';
import CollapsibleSection from '../../components/CollapsibleSection';
import { colors, getResponsiveTypography } from '../../utils/theme';
import { useResponsive } from '../../hooks/useResponsive';
import { useUserStore } from '../../stores';

const StrengthTab: React.FC = () => {
  const { typographyScale } = useResponsive();
  const scaledType = getResponsiveTypography(typographyScale);
  const [selectedRange] = useState<DateRangeKey>('3M');

  const user = useUserStore((s) => s.user);
  const { workouts, loading } = useAnalyticsData(selectedRange);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading strength data...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="barbell" size={32} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { fontSize: scaledType['3xl'] }]}>Strength Analysis</Text>
            <Text style={[styles.subtitle, { fontSize: scaledType.base }]}>
              Track your progress and calculate your strength levels
            </Text>
          </View>
        </View>
      </View>

      <CollapsibleSection
        title="Exercise Progression"
        icon="trending-up-outline"
        iconColor={colors.primary}
      >
        <ExerciseProgressionChart
          workouts={workouts}
          unit={user?.preferredWeightUnit || 'kg'}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Strength Calculator"
        icon="calculator-outline"
        iconColor={colors.analytics}
      >
        <StrengthCalculator user={user} />
      </CollapsibleSection>
    </>
  );
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
});

export default StrengthTab;
