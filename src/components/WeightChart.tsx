import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { DailyWeight } from '../types';

interface WeightChartProps {
  weights: DailyWeight[];
  unit: 'kg' | 'lbs';
}

const WeightChart: React.FC<WeightChartProps> = ({ weights, unit }) => {
  const screenWidth = Dimensions.get('window').width;

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
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data: weightValues,
            },
          ],
        }}
        width={screenWidth - 64}
        height={180}
        chartConfig={{
          backgroundColor: '#2A2A30',
          backgroundGradientFrom: '#2A2A30',
          backgroundGradientTo: '#2A2A30',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(160, 160, 168, ${opacity})`,
          style: {
            borderRadius: 12,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#FF9500',
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#3A3A42',
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
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
    borderTopColor: '#3A3A42',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#3A3A42',
  },
  weightLoss: {
    color: '#34C759',
  },
  weightGain: {
    color: '#FF9500',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#A0A0A8',
    textAlign: 'center',
  },
});

export default WeightChart;
