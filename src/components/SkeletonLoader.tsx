import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { colors } from '../utils/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

// Pre-built skeleton layouts for common UI patterns
export const CardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.cardHeaderText}>
        <Skeleton width={120} height={18} />
        <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
    <Skeleton height={16} style={{ marginTop: 16 }} />
    <Skeleton width="70%" height={16} style={{ marginTop: 8 }} />
  </View>
);

export const WorkoutCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <Skeleton width="60%" height={20} />
    <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
    <Skeleton width="80%" height={14} style={{ marginTop: 12 }} />
  </View>
);

export const StatsCardSkeleton: React.FC = () => (
  <View style={styles.statsCard}>
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Skeleton width={60} height={32} />
        <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.statItem}>
        <Skeleton width={60} height={32} />
        <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.statItem}>
        <Skeleton width={60} height={32} />
        <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  </View>
);

export const TodayScreenSkeleton: React.FC = () => (
  <View style={styles.screenContainer}>
    <StatsCardSkeleton />
    <View style={{ marginTop: 16 }}>
      <CardSkeleton />
    </View>
    <View style={{ marginTop: 16 }}>
      <CardSkeleton />
    </View>
    <View style={{ marginTop: 16 }}>
      <CardSkeleton />
    </View>
  </View>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.screenContainer}>
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={{ marginBottom: 16 }}>
        <WorkoutCardSkeleton />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceElevated,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  screenContainer: {
    padding: 20,
  },
});

export default Skeleton;
