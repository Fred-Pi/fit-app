import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateRangeKey } from '../../types';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import { useMuscleGroupData } from '../../hooks/useMuscleGroupData';
import MuscleGroupHeatmap from '../../components/analytics/MuscleGroupHeatmap';
import CollapsibleSection from '../../components/CollapsibleSection';
import { colors, getResponsiveTypography } from '../../utils/theme';
import { useResponsive } from '../../hooks/useResponsive';

const MuscleTab: React.FC = () => {
  const { typographyScale } = useResponsive();
  const scaledType = getResponsiveTypography(typographyScale);
  const [selectedRange] = useState<DateRangeKey>('3M');

  const { workouts, loading } = useAnalyticsData(selectedRange);
  const muscleData = useMuscleGroupData(workouts, 7);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading muscle data...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="body" size={32} color={colors.success} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { fontSize: scaledType['3xl'] }]}>Muscle Balance</Text>
            <Text style={[styles.subtitle, { fontSize: scaledType.base }]}>
              Track which muscle groups need more attention
            </Text>
          </View>
        </View>
      </View>

      <CollapsibleSection
        title="Muscle Group Heatmap"
        icon="body-outline"
        iconColor={colors.success}
      >
        <MuscleGroupHeatmap data={muscleData} />
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

export default MuscleTab;
