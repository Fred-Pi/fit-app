import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, glass, radius, spacing, typography } from '../utils/theme';

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

const SIDEBAR_WIDTH = 220;

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeItem,
  onNavigate,
}) => {
  const renderNavItem = (key: NavItem) => {
    const config = navConfig[key];
    const isActive = activeItem === key;

    return (
      <Pressable
        key={key}
        style={[
          styles.navItem,
          isActive && styles.navItemActive,
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
        <Text
          style={[
            styles.navLabel,
            isActive && { color: config.color, fontWeight: typography.weight.semibold },
          ]}
          numberOfLines={1}
        >
          {config.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={styles.blurView}>
          <View style={styles.blurOverlay} />
        </BlurView>
      ) : (
        <View style={styles.solidBackground} />
      )}

      <View style={styles.content}>
        {/* Logo / Brand */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="fitness" size={28} color={colors.primary} />
          </View>
          <Text style={styles.logoText}>FitTrack</Text>
        </View>

        {/* Navigation Items */}
        <View style={styles.navItems}>
          {(Object.keys(navConfig) as NavItem[]).map(renderNavItem)}
        </View>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <Pressable
            style={[
              styles.helpButton,
              Platform.OS === 'web' && { cursor: 'pointer' } as any,
            ]}
            accessibilityLabel="Help"
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.helpText}>Help</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['4xl'],
    paddingHorizontal: spacing.sm,
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
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  helpText: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
  },
});

export { SIDEBAR_WIDTH };
export default DesktopSidebar;
