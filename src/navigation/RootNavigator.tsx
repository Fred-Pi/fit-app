import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme, LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../stores';
import { colors } from '../utils/theme';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

// Deep linking configuration
const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [Linking.createURL('/'), 'fitapp://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: 'transparent',
  },
};

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const RootNavigator = () => {
  const { session, isLoading, isInitialized } = useAuthStore();

  // Show loading while auth is initializing
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.container}>
        <LoadingScreen />
      </View>
    );
  }

  return (
    <NavigationContainer theme={CustomDarkTheme} linking={linking}>
      {session ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

export default RootNavigator;
