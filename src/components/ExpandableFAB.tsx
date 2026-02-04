import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadows } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { lightHaptic, successHaptic } from '../utils/haptics';
import { useResponsive } from '../hooks/useResponsive';

export interface FABAction {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

interface ExpandableFABProps {
  actions: FABAction[];
  mainIcon?: string;
  mainColor?: string;
}

const ExpandableFAB: React.FC<ExpandableFABProps> = ({
  actions,
  mainIcon = 'add',
  mainColor = colors.primary,
}) => {
  const insets = useSafeAreaInsets();
  const { showSidebar } = useResponsive();
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const actionsTranslate = useRef(new Animated.Value(30)).current;

  // Calculate bottom position to sit above the tab bar
  const bottomPosition = Math.max(insets.bottom, 16) + 80; // 80px for tab bar height

  useEffect(() => {
    if (expanded) {
      // Animate open
      Animated.parallel([
        Animated.spring(rotateAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
          stiffness: 180,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(actionsOpacity, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
        }),
        Animated.spring(actionsTranslate, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
        }),
      ]).start();
    } else {
      // Animate close
      Animated.parallel([
        Animated.spring(rotateAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 12,
          stiffness: 180,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(actionsOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(actionsTranslate, {
          toValue: 30,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // Hide FAB on desktop - it's a mobile pattern
  // Note: This early return must come AFTER all hooks
  if (showSidebar) {
    return null;
  }

  const toggleMenu = () => {
    lightHaptic();
    setExpanded(!expanded);
  };

  const handleActionPress = (action: FABAction) => {
    successHaptic();
    setExpanded(false);
    // Small delay to let animation start before action
    setTimeout(() => {
      action.onPress();
    }, 100);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // If only one action, show it directly without expanding
  const isSingleAction = actions.length === 1;

  const handleMainPress = () => {
    if (isSingleAction) {
      successHaptic();
      actions[0].onPress();
    } else {
      toggleMenu();
    }
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Backdrop - only show when expanded and multiple actions */}
      {!isSingleAction && (
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropOpacity },
          ]}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setExpanded(false)}
          />
        </Animated.View>
      )}

      {/* Actions Container */}
      {!isSingleAction && (
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              bottom: bottomPosition + 70, // Above the FAB
              opacity: actionsOpacity,
              transform: [{ translateY: actionsTranslate }],
            },
          ]}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          {actions.map((action, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => handleActionPress(action)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: (action.color || mainColor) + '20' }]}>
                <Ionicons
                  name={action.icon as React.ComponentProps<typeof Ionicons>['name']}
                  size={20}
                  color={action.color || mainColor}
                />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Main FAB */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            bottom: bottomPosition,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Pressable
          onPress={handleMainPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.fabPressable}
          accessibilityRole="button"
          accessibilityLabel={isSingleAction ? actions[0].label : (expanded ? 'Close menu' : 'Open actions menu')}
          accessibilityState={{ expanded: !isSingleAction ? expanded : undefined }}
        >
          <LinearGradient
            colors={[mainColor, shadeColor(mainColor, -20)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Animated.View style={{ transform: [{ rotate: isSingleAction ? '0deg' : rotation }] }}>
              <Ionicons
                name={(isSingleAction ? actions[0].icon : mainIcon) as React.ComponentProps<typeof Ionicons>['name']}
                size={28}
                color="#fff"
              />
            </Animated.View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
};

// Helper to darken a color
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  actionsContainer: {
    position: 'absolute',
    right: spacing.xl,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    // Better touch target
    minHeight: 48,
  },
  actionButtonPressed: {
    backgroundColor: colors.surfaceElevated,
    transform: [{ scale: 0.97 }],
  },
  actionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.2,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.xl,
    zIndex: 101,
  },
  fabPressable: {
    // Increase touch target
    padding: 4,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    // Web-specific cursor
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
});

export default ExpandableFAB;
