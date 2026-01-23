import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/utils/ThemeContext';
import { initializeDatabase, migrateFromAsyncStorage } from './src/services/database';
import { useUserStore } from './src/stores';
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const initializeUser = useUserStore((state) => state.initialize);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize SQLite database and run migration from AsyncStorage
        await initializeDatabase();
        await migrateFromAsyncStorage();

        // Initialize user store (creates default user if needed)
        await initializeUser();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, [initializeUser]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F1419',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#B8C5D6',
  },
});
