import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import { useUIStore } from '../stores';
import Tooltip from '../components/Tooltip';

export type NavItem = 'Log' | 'Workouts' | 'Progress' | 'Nutrition' | 'Profile';

interface NavConfig {
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}

const navConfig: Record<NavItem, NavConfig> = {
  Log: {
    icon: 'add-circle-outline',
    iconFocused: 'add-circle',
    color: colors.success,
    label: 'Log',
  },
  Workouts: {
    icon: 'barbell-outline',
    iconFocused: 'barbell',
    color: colors.primary,
    label: 'Workouts',
  },
  Progress: {
    icon: 'stats-chart-outline',
    iconFocused: 'stats-chart',
    color: colors.analytics,
    label: 'Progress',
  },
  Nutrition: {
    icon: 'nutrition-outline',
    iconFocused: 'nutrition',
    color: colors.nutrition,
    label: 'Nutrition',
  },
  Profile: {
    icon: 'person-outline',
    iconFocused: 'person',
    color: colors.textSecondary,
    label: 'Profile',
  },
};

interface DesktopSidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

const SIDEBAR_WIDTH_EXPANDED = 220;
const SIDEBAR_WIDTH_COLLAPSED = 72;

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeItem,
  onNavigate,
}) => {
  const isCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  // Animated values
  const widthAnim = useRef(new Animated.Value(isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED)).current;
  const labelOpacity = useRef(new Animated.Value(isCollapsed ? 0 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        useNativeDriver: false,
        tension: 100,
        friction: 15,
      }),
      Animated.timing(labelOpacity, {
        toValue: isCollapsed ? 0 : 1,
        duration: isCollapsed ? 100 : 200,
        delay: isCollapsed ? 0 : 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isCollapsed]);

  const renderNavItem = (key: NavItem) => {
    const config = navConfig[key];
    const isActive = activeItem === key;

    const navButton = (
      <Pressable
        key={key}
        style={[
          styles.navItem,
          isActive && styles.navItemActive,
          isCollapsed && styles.navItemCollapsed,
          Platform.OS === 'web' && { cursor: 'pointer' } as any,
        ]}
        onPress={() => onNavigate(key)}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${config.label} navigation`}
      >
        {isActive && (
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: config.color },
            ]}
          />
        )}
        <Ionicons
          name={isActive ? config.iconFocused : config.icon}
          size={22}
          color={isActive ? config.color : colors.textSecondary}
        />
        {!isCollapsed && (
          <Animated.Text
            style={[
              styles.navLabel,
              isActive && { color: config.color, fontWeight: typography.weight.semibold },
              { opacity: labelOpacity },
            ]}
            numberOfLines={1}
          >
            {config.label}
          </Animated.Text>
        )}
      </Pressable>
    );

    // Wrap with tooltip when collapsed
    if (isCollapsed) {
      return (
        <Tooltip key={key} text={config.label} position="right" delay={200}>
          {navButton}
        </Tooltip>
      );
    }

    return navButton;
  };

  return (
    <Animated.View style={[styles.container, { width: widthAnim }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={styles.blurView}>
          <View style={styles.blurOverlay} />
        </BlurView>
      ) : (
        <View style={styles.solidBackground} />
      )}

      <View style={[styles.content, isCollapsed && styles.contentCollapsed]}>
        {/* Logo / Brand */}
        <Pressable
          style={[styles.logoContainer, isCollapsed && styles.logoContainerCollapsed]}
          onPress={toggleSidebar}
          accessibilityLabel={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          accessibilityRole="button"
        >
          <View style={styles.logoIcon}>
            <Ionicons name="fitness" size={28} color={colors.primary} />
          </View>
          {!isCollapsed && (
            <Animated.Text style={[styles.logoText, { opacity: labelOpacity }]}>
              FitTrack
            </Animated.Text>
          )}
        </Pressable>

        {/* Navigation Items */}
        <View style={styles.navItems}>
          {(Object.keys(navConfig) as NavItem[]).map(renderNavItem)}
        </View>

        {/* Bottom section */}
        <View style={[styles.bottomSection, isCollapsed && styles.bottomSectionCollapsed]}>
          {/* Collapse Toggle Button */}
          <Tooltip text={isCollapsed ? "Expand" : "Collapse"} position="right" delay={300}>
            <Pressable
              style={[
                styles.collapseButton,
                Platform.OS === 'web' && { cursor: 'pointer' } as any,
              ]}
              onPress={toggleSidebar}
              accessibilityLabel={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              accessibilityRole="button"
            >
              <Ionicons
                name={isCollapsed ? "chevron-forward" : "chevron-back"}
                size={18}
                color={colors.textTertiary}
              />
              {!isCollapsed && (
                <Animated.Text style={[styles.collapseText, { opacity: labelOpacity }]}>
                  Collapse
                </Animated.Text>
              )}
            </Pressable>
          </Tooltip>

          {/* Help Button */}
          <Tooltip text="Help" position="right" delay={300} disabled={!isCollapsed}>
            <Pressable
              style={[
                styles.helpButton,
                isCollapsed && styles.helpButtonCollapsed,
                Platform.OS === 'web' && { cursor: 'pointer' } as any,
              ]}
              accessibilityLabel="Help"
            >
              <Ionicons name="help-circle-outline" size={20} color={colors.textTertiary} />
              {!isCollapsed && (
                <Animated.Text style={[styles.helpText, { opacity: labelOpacity }]}>
                  Help
                </Animated.Text>
              )}
            </Pressable>
          </Tooltip>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: glass.border,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: glass.backgroundDark,
  },
  solidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  contentCollapsed: {
    paddingHorizontal: spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['4xl'],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    cursor: 'pointer' as any,
  },
  logoContainerCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  navItems: {
    flex: 1,
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    position: 'relative',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  navItemActive: {
    backgroundColor: glass.backgroundLight,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    bottom: '25%',
    width: 3,
    borderRadius: 2,
  },
  navLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: glass.border,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  bottomSectionCollapsed: {
    alignItems: 'center',
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  collapseText: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  helpButtonCollapsed: {
    justifyContent: 'center',
  },
  helpText: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
  },
});

export { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED };
export default DesktopSidebar;
