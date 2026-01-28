import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import { colors, glass, gradients, spacing, typography, radius } from '../utils/theme';
import { successHaptic, lightHaptic } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: (userData: {
    name: string;
    dailyCalorieTarget: number;
    dailyStepGoal: number;
  }) => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Setup form state
  const [name, setName] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('2200');
  const [stepGoal, setStepGoal] = useState('10000');

  const totalSteps = 3;

  const animateTransition = (nextStep: number) => {
    const direction = nextStep > currentStep ? 1 : -1;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction * -30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(direction * 30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
      ]).start();
    });
  };

  const goToNext = () => {
    lightHaptic();
    if (currentStep < totalSteps - 1) {
      animateTransition(currentStep + 1);
    }
  };

  const handleComplete = () => {
    if (!name.trim()) {
      return;
    }
    successHaptic();
    onComplete({
      name: name.trim(),
      dailyCalorieTarget: parseInt(calorieTarget) || 2200,
      dailyStepGoal: parseInt(stepGoal) || 10000,
    });
  };

  const canComplete = name.trim().length > 0;

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.dot,
            currentStep === index && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );

  const renderWelcomeSlide = () => (
    <View style={styles.slideContent}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={gradients.workout as [string, string, string]}
          style={styles.iconGradient}
        >
          <Ionicons name="fitness" size={64} color={colors.text} />
        </LinearGradient>
      </View>
      <Text style={styles.title}>Welcome to FitTrack</Text>
      <Text style={styles.subtitle}>Your personal fitness companion</Text>
    </View>
  );

  const renderFeaturesSlide = () => (
    <View style={styles.slideContent}>
      <Text style={styles.title}>Everything you need</Text>
      <Text style={styles.subtitle}>Track your fitness journey</Text>
      <View style={styles.featuresContainer}>
        {[
          { icon: 'barbell' as const, text: 'Log workouts & track PRs', color: colors.workout },
          { icon: 'nutrition' as const, text: 'Monitor nutrition & macros', color: colors.nutrition },
          { icon: 'footsteps' as const, text: 'Track daily steps', color: colors.steps },
          { icon: 'analytics' as const, text: 'View detailed analytics', color: colors.analytics },
        ].map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={[styles.featureIconBg, { backgroundColor: feature.color + '20' }]}>
              <Ionicons name={feature.icon} size={24} color={feature.color} />
            </View>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSetupSlide = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.slideContent}
    >
      <Text style={styles.title}>Let's get started</Text>
      <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

      <View style={styles.setupForm}>
        <GlassCard accent="none" glowIntensity="none" padding="lg">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Daily Calorie Target</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="flame-outline" size={20} color={colors.nutrition} />
              <TextInput
                style={styles.input}
                value={calorieTarget}
                onChangeText={setCalorieTarget}
                placeholder="2200"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
              />
              <Text style={styles.inputSuffix}>cal</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Daily Step Goal</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="footsteps-outline" size={20} color={colors.steps} />
              <TextInput
                style={styles.input}
                value={stepGoal}
                onChangeText={setStepGoal}
                placeholder="10000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
              />
              <Text style={styles.inputSuffix}>steps</Text>
            </View>
          </View>
        </GlassCard>
      </View>
    </KeyboardAvoidingView>
  );

  const renderCurrentSlide = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeSlide();
      case 1:
        return renderFeaturesSlide();
      case 2:
        return renderSetupSlide();
      default:
        return null;
    }
  };

  const isLastSlide = currentStep === totalSteps - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative elements */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.slideWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {renderCurrentSlide()}
        </Animated.View>
      </ScrollView>

      {/* Bottom section */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {renderDots()}
        <View style={styles.buttonContainer}>
          <GlassButton
            title={isLastSlide ? 'Get Started' : 'Continue'}
            icon="arrow-forward"
            iconPosition="right"
            onPress={isLastSlide ? handleComplete : goToNext}
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLastSlide && !canComplete}
          />
          {isLastSlide && !canComplete && (
            <Text style={styles.nameRequiredHint}>Please enter your name to continue</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  decorCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primaryMuted,
    opacity: 0.5,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 100,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.analyticsMuted,
    opacity: 0.3,
  },
  slideWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: spacing['3xl'],
    position: 'relative',
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.extrabold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresContainer: {
    marginTop: spacing['3xl'],
    width: '100%',
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: glass.border,
  },
  featureIconBg: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  setupForm: {
    marginTop: spacing['2xl'],
    width: '100%',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: glass.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text,
    paddingVertical: spacing.md,
    outlineStyle: 'none',
  } as any,
  inputSuffix: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    fontWeight: typography.weight.medium,
  },
  bottomSection: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  buttonContainer: {
    width: '100%',
  },
  nameRequiredHint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default OnboardingScreen;
