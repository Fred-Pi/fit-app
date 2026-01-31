/**
 * FormRow - Responsive form layout component
 *
 * Desktop: Displays children side-by-side in columns
 * Mobile: Stacks children vertically
 *
 * Usage:
 *   <FormRow>
 *     <FormField label="First Name" ... />
 *     <FormField label="Last Name" ... />
 *   </FormRow>
 */

import React, { ReactNode, Children } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { spacing } from '../utils/theme';

interface FormRowProps {
  children: ReactNode;
  /** Gap between items (default: spacing.md) */
  gap?: number;
  /** Force stacked layout even on desktop */
  forceStack?: boolean;
}

const FormRow: React.FC<FormRowProps> = ({
  children,
  gap = spacing.md,
  forceStack = false,
}) => {
  const isWeb = Platform.OS === 'web';
  const shouldStack = !isWeb || forceStack;

  const childArray = Children.toArray(children).filter(Boolean);

  if (shouldStack || childArray.length === 1) {
    return (
      <View style={[styles.stackedContainer, { gap }]}>
        {childArray.map((child, index) => (
          <View key={index} style={styles.stackedItem}>
            {child}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.rowContainer, { gap }]}>
      {childArray.map((child, index) => (
        <View key={index} style={styles.rowItem}>
          {child}
        </View>
      ))}
    </View>
  );
};

/**
 * FormSection - Groups related form fields with optional title
 * Uses 2-column layout on desktop for its children
 */
interface FormSectionProps {
  children: ReactNode;
  /** Gap between items (default: spacing.lg) */
  gap?: number;
}

export const FormSection: React.FC<FormSectionProps> = ({
  children,
  gap = spacing.lg,
}) => {
  return (
    <View style={[styles.section, { gap }]}>
      {children}
    </View>
  );
};

/**
 * FormGrid - Multi-column form layout that wraps on smaller screens
 *
 * Usage for 2-column desktop layout:
 *   <FormGrid columns={2}>
 *     <FormField ... />
 *     <FormField ... />
 *     <FormField ... />
 *     <FormField ... />
 *   </FormGrid>
 */
interface FormGridProps {
  children: ReactNode;
  /** Number of columns on desktop (default: 2) */
  columns?: 2 | 3;
  /** Gap between items (default: spacing.md) */
  gap?: number;
}

export const FormGrid: React.FC<FormGridProps> = ({
  children,
  columns = 2,
  gap = spacing.md,
}) => {
  const isWeb = Platform.OS === 'web';
  const childArray = Children.toArray(children).filter(Boolean);

  if (!isWeb) {
    // Mobile: single column
    return (
      <View style={[styles.stackedContainer, { gap }]}>
        {childArray.map((child, index) => (
          <View key={index} style={styles.stackedItem}>
            {child}
          </View>
        ))}
      </View>
    );
  }

  // Desktop: Use CSS grid-like layout with flexWrap
  const itemWidth = columns === 2 ? '48%' : '31%';

  return (
    <View style={[styles.gridContainer, { gap }]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={[
            styles.gridItem,
            { width: itemWidth } as any,
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Stacked (mobile) layout
  stackedContainer: {
    flexDirection: 'column',
  },
  stackedItem: {
    width: '100%',
  },

  // Row (desktop) layout
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowItem: {
    flex: 1,
  },

  // Grid layout
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    // width set dynamically
  },

  // Section
  section: {
    marginBottom: spacing.xl,
  },
});

export default FormRow;
