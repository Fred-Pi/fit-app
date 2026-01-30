import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootNavigator from './src/navigation/RootNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { ThemeProvider } from './src/utils/ThemeContext';
import { initializeDatabase, migrateFromAsyncStorage } from './src/services/database';
import { useUserStore, useAuthStore } from './src/stores';
import { syncService } from './src/services/sync';
import ErrorFallback from './src/components/ErrorFallback';
import { colors } from './src/utils/theme';
import { initializeSentry, Sentry, captureError } from './src/services/sentry';

// Initialize Sentry as early as possible
initializeSentry();

const ONBOARDING_KEY = '@fit_app_onboarding_complete';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const initializeUser = useUserStore((state) => state.initialize);
  const updateUser = useUserStore((state) => state.updateUser);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize SQLite database and run migration from AsyncStorage
        await initializeDatabase();
        await migrateFromAsyncStorage();

        // Initialize auth (check for existing session)
        await initializeAuth();

        // Initialize sync service (network monitoring)
        await syncService.initialize();

        // Check if onboarding was completed (only relevant for authenticated users)
        const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_KEY);

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

    // Cleanup sync service on unmount
    return () => {
      syncService.cleanup();
    };
  }, [initializeUser, initializeAuth]);

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

  // Show onboarding only if user is authenticated and hasn't completed it
  const shouldShowOnboarding = session && showOnboarding;

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error instanceof Error ? error : null} resetError={resetError} />
      )}
      onError={(error) => captureError(error instanceof Error ? error : new Error(String(error)))}
    >
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
              {shouldShowOnboarding ? (
                <OnboardingScreen onComplete={handleOnboardingComplete} />
              ) : (
                <RootNavigator />
              )}
            </Animated.View>
            <StatusBar style="light" />
          </ThemeProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Sentry.ErrorBoundary>
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
