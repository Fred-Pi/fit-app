/**
 * CollapsibleSection - Expandable/collapsible content section
 *
 * Desktop: Click header to expand/collapse with smooth animation
 * Mobile: Same behavior, optimized touch target
 *
 * Usage:
 *   <CollapsibleSection title="Settings" icon="settings-outline">
 *     <SettingsContent />
 *   </CollapsibleSection>
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import { lightHaptic } from '../utils/haptics';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  children: React.ReactNode;
  /** Section title */
  title: string;
  /** Optional icon */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon color */
  iconColor?: string;
  /** Initially expanded state */
  defaultExpanded?: boolean;
  /** Callback when expanded state changes */
  onToggle?: (expanded: boolean) => void;
  /** Show border around section */
  bordered?: boolean;
  /** Custom header right element */
  headerRight?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  children,
  title,
  icon,
  iconColor = colors.primary,
  defaultExpanded = true,
  onToggle,
  bordered = true,
  headerRight,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggleExpanded = useCallback(() => {
    lightHaptic();

    // Animate the chevron rotation
    Animated.spring(rotateAnim, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();

    // Animate the content height
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setExpanded(!expanded);
    onToggle?.(!expanded);
  }, [expanded, onToggle, rotateAnim]);

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.container, bordered && styles.containerBordered]}>
      <Pressable
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
          Platform.OS === 'web' && { cursor: 'pointer' } as any,
        ]}
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${expanded ? 'expanded' : 'collapsed'}`}
      >
        <View style={styles.headerLeft}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
              <Ionicons name={icon} size={18} color={iconColor} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.headerRight}>
          {headerRight}
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Ionicons
              name="chevron-up"
              size={20}
              color={colors.textSecondary}
            />
          </Animated.View>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  containerBordered: {
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: glass.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  headerPressed: {
    opacity: 0.7,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});

export default CollapsibleSection;
