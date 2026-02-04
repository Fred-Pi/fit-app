/**
 * ResponsiveGrid
 *
 * A flexible grid component that automatically adjusts columns
 * based on viewport width. Uses the app's useResponsive hook
 * to determine layout.
 *
 * Usage:
 *   <ResponsiveGrid minItemWidth={300}>
 *     <Card>Item 1</Card>
 *     <Card>Item 2</Card>
 *     <Card>Item 3</Card>
 *   </ResponsiveGrid>
 */

import React, { ReactNode, Children } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { spacing } from '../utils/theme';

interface ResponsiveGridProps {
  children: ReactNode;
  /** Minimum width for each item before wrapping (default: 300) */
  minItemWidth?: number;
  /** Gap between items (default: spacing.md = 12) */
  gap?: number;
  /** Force specific number of columns (overrides auto calculation) */
  columns?: 1 | 2 | 3 | 4;
  /** Additional styles for the container */
  style?: ViewStyle;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = 300,
  gap = spacing.md,
  columns: forcedColumns,
  style,
}) => {
  const { width } = useResponsive();

  // Calculate columns based on available width
  const calculateColumns = (): number => {
    if (forcedColumns) return forcedColumns;

    // Account for padding (assume 40px total horizontal padding)
    const availableWidth = width - 40;
    const calculatedColumns = Math.floor(availableWidth / minItemWidth);

    // Clamp between 1-4 columns
    return Math.max(1, Math.min(4, calculatedColumns));
  };

  const numColumns = calculateColumns();
  const childArray = Children.toArray(children);

  // Calculate item width as percentage
  const itemWidthPercent = `${100 / numColumns}%`;

  return (
    <View style={[styles.container, { gap }, style]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={[
            styles.item,
            {
              width: itemWidthPercent,
              // Subtract gap from width calculation
              maxWidth: numColumns > 1
                ? `calc(${itemWidthPercent} - ${gap * (numColumns - 1) / numColumns}px)`
                : '100%',
            } as ViewStyle,
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

/**
 * ResponsiveColumns
 *
 * A simpler two-column layout for desktop with stacked mobile fallback.
 * Good for main + sidebar patterns.
 */
interface ResponsiveColumnsProps {
  children: [ReactNode, ReactNode]; // Exactly 2 children
  /** Ratio of first column (default: 2 = 2:1 ratio) */
  mainRatio?: number;
  /** Gap between columns (default: spacing['2xl']) */
  gap?: number;
  /** Stack on tablet too (default: false = only stack on mobile) */
  stackOnTablet?: boolean;
  style?: ViewStyle;
}

export const ResponsiveColumns: React.FC<ResponsiveColumnsProps> = ({
  children,
  mainRatio = 2,
  gap = spacing['2xl'],
  stackOnTablet = false,
  style,
}) => {
  const { isMobile, isTablet } = useResponsive();
  const shouldStack = isMobile || (stackOnTablet && isTablet);

  const [main, side] = children;

  if (shouldStack) {
    return (
      <View style={[styles.stackedContainer, { gap }, style]}>
        <View style={styles.stackedItem}>{main}</View>
        <View style={styles.stackedItem}>{side}</View>
      </View>
    );
  }

  return (
    <View style={[styles.columnsContainer, { gap }, style]}>
      <View style={[styles.mainColumn, { flex: mainRatio }]}>{main}</View>
      <View style={styles.sideColumn}>{side}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    // Width set dynamically
  },
  // ResponsiveColumns styles
  stackedContainer: {
    flexDirection: 'column',
  },
  stackedItem: {
    width: '100%',
  },
  columnsContainer: {
    flexDirection: 'row',
  },
  mainColumn: {
    // flex set dynamically
  },
  sideColumn: {
    flex: 1,
    minWidth: 280,
    maxWidth: 400,
  },
});

export default ResponsiveGrid;
