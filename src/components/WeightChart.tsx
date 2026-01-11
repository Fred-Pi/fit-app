import React, { useState } from 'react';
import { colors } from '../utils/theme'
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { DailyWeight } from '../types';

interface WeightChartProps {
  weights: DailyWeight[];
  unit: 'kg' | 'lbs';
  goalWeight?: number;
}

const WeightChart: React.FC<WeightChartProps> = ({ weights, unit, goalWeight }) => {
  const [chartWidth, setChartWidth] = useState(300);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setChartWidth(width);
  };

  // Handle empty state
  if (weights.length < 2) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          Add at least 2 weight entries to see your trend
        </Text>
      </View>
    );
  }

  // Sort weights by date and get last 30 days
  const sortedWeights = [...weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  // Extract weight values
  const weightValues = sortedWeights.map(w => w.weight);

  // Calculate stats
  const currentWeight = weightValues[weightValues.length - 1];
  const firstWeight = weightValues[0];
  const minWeight = Math.min(...weightValues);
  const maxWeight = Math.max(...weightValues);
  const weightChange = currentWeight - firstWeight;
  const isWeightLoss = weightChange < 0;

  // Prepare chart labels (show every 7 days)
  const labels = sortedWeights.map((w, index) => {
    if (index % 7 === 0 || index === sortedWeights.length - 1) {
      const date = new Date(w.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return '';
  });

  return (
    <View style={styles.container}>
      <View onLayout={onLayout} style={styles.chartContainer}>
        <LineChart
          data={{
            labels,
            datasets: [
              {
                data: weightValues,
                color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // colors.warning
              },
              ...(goalWeight ? [{
                data: Array(weightValues.length).fill(goalWeight),
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // colors.success
                withDots: false,
              }] : []),
            ],
          }}
          width={chartWidth}
          height={180}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // colors.warning
          labelColor: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`, // colors.textSecondary
          style: {
            borderRadius: 12,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.warning,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: colors.borderLight,
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        withDots={true}
        />
      </View>

      {goalWeight && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Current Weight</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Goal Weight</Text>
          </View>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={styles.statValue}>{currentWeight.toFixed(1)} {unit}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={styles.statValue}>{minWeight.toFixed(1)} {unit}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={styles.statValue}>{maxWeight.toFixed(1)} {unit}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Change</Text>
          <Text style={[
            styles.statValue,
            isWeightLoss ? styles.weightLoss : styles.weightGain
          ]}>
            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} {unit}
          </Text>
        </View>

        {goalWeight && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={[styles.statValue, styles.goalValue]}>
                {goalWeight.toFixed(1)} {unit}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>To Goal</Text>
              <Text style={[
                styles.statValue,
                currentWeight > goalWeight ? styles.weightGain : styles.weightLoss
              ]}>
                {(currentWeight - goalWeight).toFixed(1)} {unit}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  chartContainer: {
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },
  weightLoss: {
    color: colors.success,
  },
  weightGain: {
    color: colors.warning,
  },
  goalValue: {
    color: colors.success,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default WeightChart;
