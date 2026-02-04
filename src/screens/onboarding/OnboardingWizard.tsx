import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassButton from '../../components/GlassButton';
import StepIndicator from './components/StepIndicator';
import BodyMetricsStep from './steps/BodyMetricsStep';
import GoalsStep from './steps/GoalsStep';
import SummaryStep from './steps/SummaryStep';
import LoadingStep from './steps/LoadingStep';
import { colors, spacing, typography } from '../../utils/theme';
import { getBMIResult, BMIResult } from '../../utils/bmiCalculator';
import { lightHaptic, successHaptic } from '../../utils/haptics';
import { useUserStore } from '../../stores';

export interface OnboardingData {
  age: number;
  height: number; // in cm
  heightUnit: 'cm' | 'ft';
  weight: number; // in kg
  weightUnit: 'kg' | 'lbs';
  bmi: number;
  dailyCalorieTarget: number;
  dailyStepGoal: number;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

const TOTAL_STEPS = 3; // Body Metrics, Goals, Summary (Loading is separate)

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Get user's name from signup (already collected during registration)
  const userName = user?.name && user.name !== 'User' ? user.name : '';

  // Form state
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState(0);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightKg, setWeightKg] = useState(0);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [stepGoal, setStepGoal] = useState('10000');

  // Validation errors
  const [errors, setErrors] = useState<{
    age?: string;
    height?: string;
    weight?: string;
    calories?: string;
    steps?: string;
  }>({});

  // Calculate BMI
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bmiResult: BMIResult = weightKg > 0 && heightCm > 0
    ? getBMIResult(weightKg, heightCm)
    : { value: 0, category: 'normal', label: 'Normal', color: '#10B981' };

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validateStep = (step: number): boolean => {
    const newErrors: typeof errors = {};

    switch (step) {
      case 0: // Body Metrics
        const ageNum = parseInt(age);
        if (!age || isNaN(ageNum)) {
          newErrors.age = 'Please enter your age';
        } else if (ageNum < 13 || ageNum > 100) {
          newErrors.age = 'Age must be between 13 and 100';
        }

        if (heightCm <= 0) {
          newErrors.height = 'Please enter your height';
        } else if (heightCm < 50 || heightCm > 300) {
          newErrors.height = 'Please enter a valid height';
        }

        if (weightKg <= 0) {
          newErrors.weight = 'Please enter your weight';
        } else if (weightKg < 20 || weightKg > 500) {
          newErrors.weight = 'Please enter a valid weight';
        }
        break;

      case 1: // Goals
        const calories = parseInt(calorieTarget);
        if (!calorieTarget || isNaN(calories)) {
          newErrors.calories = 'Please enter a calorie target';
        } else if (calories < 1000 || calories > 10000) {
          newErrors.calories = 'Enter between 1,000 and 10,000 kcal';
        }

        const steps = parseInt(stepGoal);
        if (!stepGoal || isNaN(steps)) {
          newErrors.steps = 'Please enter a step goal';
        } else if (steps < 1000 || steps > 50000) {
          newErrors.steps = 'Enter between 1,000 and 50,000 steps';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNext = () => {
    Keyboard.dismiss();

    if (!validateStep(currentStep)) {
      return;
    }

    lightHaptic();

    if (currentStep < TOTAL_STEPS - 1) {
      animateTransition(currentStep + 1);
    }
  };

  const goToPrevious = () => {
    lightHaptic();
    if (currentStep > 0) {
      animateTransition(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      animateTransition(step);
    }
  };

  const handleComplete = useCallback(() => {
    if (!validateStep(currentStep)) {
      return;
    }

    successHaptic();
    setIsLoading(true);
  }, [currentStep, validateStep]);

  const handleLoadingComplete = useCallback(() => {
    const data: OnboardingData = {
      age: parseInt(age),
      height: heightCm,
      heightUnit,
      weight: weightKg,
      weightUnit,
      bmi: bmiResult.value,
      dailyCalorieTarget: parseInt(calorieTarget),
      dailyStepGoal: parseInt(stepGoal),
    };
    onComplete(data);
  }, [age, heightCm, heightUnit, weightKg, weightUnit, bmiResult, calorieTarget, stepGoal, onComplete]);

  const renderStep = () => {
    if (isLoading) {
      return <LoadingStep onComplete={handleLoadingComplete} />;
    }

    switch (currentStep) {
      case 0:
        return (
          <BodyMetricsStep
            age={age}
            onAgeChange={setAge}
            heightCm={heightCm}
            onHeightChange={setHeightCm}
            heightUnit={heightUnit}
            onHeightUnitChange={setHeightUnit}
            weightKg={weightKg}
            onWeightChange={setWeightKg}
            weightUnit={weightUnit}
            onWeightUnitChange={setWeightUnit}
            errors={{
              age: errors.age,
              height: errors.height,
              weight: errors.weight,
            }}
          />
        );
      case 1:
        return (
          <GoalsStep
            calorieTarget={calorieTarget}
            onCalorieTargetChange={setCalorieTarget}
            stepGoal={stepGoal}
            onStepGoalChange={setStepGoal}
            errors={{
              calories: errors.calories,
              steps: errors.steps,
            }}
          />
        );
      case 2:
        return (
          <SummaryStep
            name={userName}
            age={parseInt(age)}
            heightCm={heightCm}
            heightUnit={heightUnit}
            weightKg={weightKg}
            weightUnit={weightUnit}
            calorieTarget={parseInt(calorieTarget)}
            stepGoal={parseInt(stepGoal)}
            bmiResult={bmiResult}
            onEditStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const canGoBack = currentStep > 0 && !isLoading;

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

      {/* Personalized greeting header */}
      {!isLoading && (
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>
            {userName ? `Let's set up your profile, ${userName}!` : "Let's set up your profile!"}
          </Text>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Bottom section - only show when not loading */}
      {!isLoading && (
        <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          <View style={styles.buttonContainer}>
            {canGoBack && (
              <GlassButton
                title="Back"
                icon="arrow-back"
                onPress={goToPrevious}
                variant="ghost"
                size="lg"
                style={styles.backButton}
              />
            )}
            <GlassButton
              title={isLastStep ? 'Start Tracking' : 'Continue'}
              icon={isLastStep ? 'checkmark' : 'arrow-forward'}
              iconPosition="right"
              onPress={isLastStep ? handleComplete : goToNext}
              variant="primary"
              size="lg"
              style={canGoBack ? styles.nextButtonWithBack : styles.nextButton}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  greetingContainer: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xl,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  greetingText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    textAlign: 'center',
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
  bottomSection: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  backButton: {
    flex: 0,
    minWidth: 100,
  },
  nextButton: {
    flex: 1,
  },
  nextButtonWithBack: {
    flex: 1,
  },
});

export default OnboardingWizard;
