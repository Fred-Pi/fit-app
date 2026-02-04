import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OrbConfig {
  size: number;
  color: string;
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
}

const orbs: OrbConfig[] = [
  { size: 300, color: 'rgba(59, 130, 246, 0.15)', initialX: -100, initialY: -50, duration: 20000, delay: 0 },
  { size: 250, color: 'rgba(139, 92, 246, 0.12)', initialX: SCREEN_WIDTH - 100, initialY: 100, duration: 25000, delay: 2000 },
  { size: 200, color: 'rgba(16, 185, 129, 0.1)', initialX: 50, initialY: SCREEN_HEIGHT - 200, duration: 22000, delay: 1000 },
  { size: 180, color: 'rgba(244, 63, 94, 0.08)', initialX: SCREEN_WIDTH - 150, initialY: SCREEN_HEIGHT - 300, duration: 28000, delay: 3000 },
  { size: 150, color: 'rgba(6, 182, 212, 0.1)', initialX: SCREEN_WIDTH / 2, initialY: SCREEN_HEIGHT / 2, duration: 18000, delay: 500 },
];

const FloatingOrb: React.FC<{ config: OrbConfig }> = ({ config }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateOrb = () => {
      // Random movement range
      const rangeX = 100;
      const rangeY = 80;

      Animated.loop(
        Animated.sequence([
          Animated.delay(config.delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(translateX, {
                toValue: Math.random() * rangeX - rangeX / 2,
                duration: config.duration / 2,
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: Math.random() * rangeX - rangeX / 2,
                duration: config.duration / 2,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(translateY, {
                toValue: Math.random() * rangeY - rangeY / 2,
                duration: config.duration / 2,
                useNativeDriver: true,
              }),
              Animated.timing(translateY, {
                toValue: Math.random() * rangeY - rangeY / 2,
                duration: config.duration / 2,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(scale, {
                toValue: 1.1,
                duration: config.duration / 2,
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 0.9,
                duration: config.duration / 2,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      ).start();
    };

    animateOrb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
          left: config.initialX,
          top: config.initialY,
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
      ]}
    />
  );
};

interface AnimatedBackgroundProps {
  children?: React.ReactNode;
  variant?: 'default' | 'vibrant' | 'subtle';
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  variant = 'default'
}) => {
  const opacity = variant === 'subtle' ? 0.5 : variant === 'vibrant' ? 1.2 : 1;

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={[
          colors.background,
          'rgba(15, 15, 18, 1)',
          colors.background,
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Mesh gradient overlay */}
      <View style={[styles.meshContainer, { opacity }]}>
        {/* Top gradient spot */}
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.08)', 'transparent']}
          style={styles.gradientSpotTop}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Bottom gradient spot */}
        <LinearGradient
          colors={['transparent', 'rgba(139, 92, 246, 0.06)']}
          style={styles.gradientSpotBottom}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Floating orbs */}
      <View style={[styles.orbContainer, { opacity }]} pointerEvents="none">
        {orbs.map((orb, index) => (
          <FloatingOrb key={index} config={orb} />
        ))}
      </View>

      {/* Noise texture overlay - CSS only for web */}
      {Platform.OS === 'web' && (
        <View style={styles.noiseOverlay} pointerEvents="none" />
      )}

      {/* Grid pattern */}
      <View style={styles.gridOverlay} pointerEvents="none">
        <View style={styles.gridPattern} />
      </View>

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  meshContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradientSpotTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  gradientSpotBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    // Blur effect via shadow on iOS, filter on web
    ...(Platform.OS === 'web' ? {
      filter: 'blur(60px)',
    } as Record<string, string> : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 60,
    }),
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    // CSS noise pattern for web
    ...(Platform.OS === 'web' ? {
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    } as Record<string, string> : {}),
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    opacity: 0.03,
  },
  gridPattern: {
    flex: 1,
    ...(Platform.OS === 'web' ? {
      backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
      backgroundSize: '50px 50px',
    } as Record<string, string> : {}),
  },
});

export default AnimatedBackground;
