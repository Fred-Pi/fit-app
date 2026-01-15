import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utilities for the app
 * Provides consistent haptic feedback across different interactions
 */

// Check if haptics are supported (not on web)
const isHapticsSupported = Platform.OS !== 'web';

/**
 * Light haptic feedback - for subtle interactions
 * Use for: button taps, selections, toggles
 */
export const lightHaptic = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Medium haptic feedback - for standard interactions
 * Use for: confirming actions, completing tasks
 */
export const mediumHaptic = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

/**
 * Heavy haptic feedback - for important interactions
 * Use for: completing workouts, setting PRs, significant milestones
 */
export const heavyHaptic = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

/**
 * Success haptic feedback - notification style
 * Use for: successful saves, completions
 */
export const successHaptic = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Warning haptic feedback - notification style
 * Use for: warnings, near-limit notifications
 */
export const warningHaptic = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

/**
 * Error haptic feedback - notification style
 * Use for: errors, failed actions
 */
export const errorHaptic = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

/**
 * Selection changed haptic feedback
 * Use for: picker changes, slider adjustments, list selections
 */
export const selectionHaptic = () => {
  if (isHapticsSupported) {
    Haptics.selectionAsync();
  }
};
