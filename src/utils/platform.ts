/**
 * Platform utilities for cross-platform functionality
 */

import { Platform, Alert } from 'react-native';

/**
 * Show a cross-platform alert dialog
 * Uses window.alert on web and Alert.alert on native
 *
 * @param title - Alert title
 * @param message - Alert message
 * @param onDismiss - Optional callback when alert is dismissed
 */
export const showAlert = (
  title: string,
  message: string,
  onDismiss?: () => void
): void => {
  if (Platform.OS === 'web') {
    // Web uses window.alert (blocking)
    window.alert(`${title}\n\n${message}`);
    onDismiss?.();
  } else {
    // Native uses Alert.alert
    Alert.alert(title, message, [{ text: 'OK', onPress: onDismiss }]);
  }
};

/**
 * Show a cross-platform confirmation dialog
 * Returns a promise that resolves to true if confirmed, false otherwise
 */
export const showConfirm = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const result = window.confirm(`${title}\n\n${message}`);
      resolve(result);
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'OK', onPress: () => resolve(true) },
      ]);
    }
  });
};

/**
 * Check if running on web platform
 */
export const isWeb = Platform.OS === 'web';

/**
 * Check if running on native platform (iOS or Android)
 */
export const isNative = Platform.OS !== 'web';

/**
 * Check if running on iOS
 */
export const isIOS = Platform.OS === 'ios';

/**
 * Check if running on Android
 */
export const isAndroid = Platform.OS === 'android';
