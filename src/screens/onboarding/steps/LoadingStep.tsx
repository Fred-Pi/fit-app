import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, typography, radius } from '../../../utils/theme';

interface LoadingStepProps {
  onComplete: () => void;
}

const LOADING_MESSAGES = [
  { text: 'Creating your profile...', icon: 'person-outline' as const },
  { text: 'Setting up your dashboard...', icon: 'grid-outline' as const },
  { text: 'Configuring your goals...', icon: 'flag-outline' as const },
  { text: 'Almost ready...', icon: 'checkmark-circle-outline' as const },
];

const MINIMUM_DURATION = 2500; // 2.5 seconds minimum
const MESSAGE_INTERVAL = 800; // Change message every 800ms

const LoadingStep: React.FC<LoadingStepProps> = ({ onComplete }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const spinAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spin animation for the icon
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Message cycling
    const messageInterval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }, MESSAGE_INTERVAL);

    // Complete after minimum duration
    const completionTimeout = setTimeout(() => {
      onComplete();
    }, MINIMUM_DURATION);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(completionTimeout);
      spinAnimation.stop();
      pulseAnimation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const currentMessage = LOADING_MESSAGES[currentMessageIndex];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={gradients.workout as [string, string, string]}
          style={styles.iconGradient}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="fitness" size={64} color={colors.text} />
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
        <Ionicons name={currentMessage.icon} size={24} color={colors.primary} />
        <Text style={styles.messageText}>{currentMessage.text}</Text>
      </Animated.View>

      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, index === currentMessageIndex % 3 ? 1 : 0.3],
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: spacing['3xl'],
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  messageText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});

export default LoadingStep;
