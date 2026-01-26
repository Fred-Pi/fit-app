import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { ThemeProvider } from './src/utils/ThemeContext';
import { initializeDatabase, migrateFromAsyncStorage } from './src/services/database';
import { useUserStore } from './src/stores';
import ErrorBoundary from './src/components/ErrorBoundary';
import { colors } from './src/utils/theme';

const ONBOARDING_KEY = '@fit_app_onboarding_complete';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const initializeUser = useUserStore((state) => state.initialize);
  const updateUser = useUserStore((state) => state.updateUser);

  useEffect(() => {
    async function prepare() {
      try {
        // Check if onboarding was completed
        const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_KEY);

        // Initialize SQLite database and run migration from AsyncStorage
        await initializeDatabase();
        await migrateFromAsyncStorage();

        // Initialize user store (creates default user if needed)
        await initializeUser();

        setShowOnboarding(onboardingComplete !== 'true');
      } catch (error) {
        console.error('Error initializing app:', error);
        setShowOnboarding(false);
      } finally {
        setIsReady(true);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }

    prepare();
  }, [initializeUser]);

  const handleOnboardingComplete = async (userData: {
    name: string;
    dailyCalorieTarget: number;
    dailyStepGoal: number;
  }) => {
    try {
      // Save onboarding completion
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');

      // Update user profile with onboarding data
      await updateUser({
        name: userData.name,
        dailyCalorieTarget: userData.dailyCalorieTarget,
        dailyStepGoal: userData.dailyStepGoal,
      });

      // Fade out and switch
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowOnboarding(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setShowOnboarding(false);
    }
  };

  if (!isReady || showOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[colors.background, colors.surface, colors.background]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContent}>
          <View style={styles.loadingIcon}>
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              style={styles.loadingIconGradient}
            >
              <Text style={styles.loadingIconText}>F</Text>
            </LinearGradient>
          </View>
          <Text style={styles.loadingTitle}>FitTrack</Text>
          <ActivityIndicator size="small" color={colors.primary} style={styles.loadingSpinner} />
        </View>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
              {showOnboarding ? (
                <OnboardingScreen onComplete={handleOnboardingComplete} />
              ) : (
                <AppNavigator />
              )}
            </Animated.View>
            <StatusBar style="light" />
          </ThemeProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconText: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  loadingSpinner: {
    marginTop: 24,
  },
});
