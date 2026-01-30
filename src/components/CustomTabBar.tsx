import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import { lightHaptic } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);

interface TabConfig {
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}

const tabConfig: Record<string, TabConfig> = {
  Today: {
    icon: 'today-outline',
    iconFocused: 'today',
    color: colors.success,
    label: 'Today',
  },
  Workouts: {
    icon: 'barbell-outline',
    iconFocused: 'barbell',
    color: colors.workout,
    label: 'Workouts',
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

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const tabWidth = TAB_BAR_WIDTH / state.routes.length;

  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.tabBarWrapper}>
        {/* Blur background */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="dark" style={styles.blurView}>
            <View style={styles.blurOverlay} />
          </BlurView>
        ) : (
          <View style={styles.androidBackground} />
        )}

        {/* Animated indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth - 16,
              transform: [{ translateX: Animated.add(indicatorPosition, 8) }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              tabConfig[state.routes[state.index].name]?.color + '30' || colors.primary + '30',
              'transparent',
            ]}
            style={styles.indicatorGradient}
          />
        </Animated.View>

        {/* Tab buttons */}
        <View style={styles.tabsContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const config = tabConfig[route.name];

            if (!config) return null;

            const onPress = () => {
              lightHaptic();
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TabButton
                key={route.key}
                config={config}
                isFocused={isFocused}
                onPress={onPress}
                tabWidth={tabWidth}
              />
            );
          })}
        </View>

        {/* Bottom glow line */}
        <Animated.View
          style={[
            styles.glowLine,
            {
              width: tabWidth - 32,
              backgroundColor: tabConfig[state.routes[state.index].name]?.color || colors.primary,
              transform: [{ translateX: Animated.add(indicatorPosition, 16) }],
            },
          ]}
        />
      </View>
    </View>
  );
};

interface TabButtonProps {
  config: TabConfig;
  isFocused: boolean;
  onPress: () => void;
  tabWidth: number;
}

const TabButton: React.FC<TabButtonProps> = ({
  config,
  isFocused,
  onPress,
  tabWidth,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(iconScale, {
      toValue: isFocused ? 1.15 : 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 180,
    }).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.tabButton, { width: tabWidth }]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={`${config.label} tab`}
    >
      <Animated.View
        style={[
          styles.tabButtonContent,
          { transform: [{ scale }] },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Ionicons
            name={isFocused ? config.iconFocused : config.icon}
            size={24}
            color={isFocused ? config.color : colors.textTertiary}
          />
        </Animated.View>
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? config.color : colors.textTertiary,
              fontWeight: isFocused ? typography.weight.semibold : typography.weight.medium,
            },
          ]}
        >
          {config.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabBarWrapper: {
    width: TAB_BAR_WIDTH,
    height: 72,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    position: 'relative',
    ...shadows.lg,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: glass.backgroundDark,
  },
  androidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 20, 0.95)',
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius['2xl'],
  },
  indicator: {
    position: 'absolute',
    top: 8,
    height: 56,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tabLabel: {
    fontSize: typography.size.xs,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  glowLine: {
    position: 'absolute',
    bottom: 8,
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
});

export default CustomTabBar;
