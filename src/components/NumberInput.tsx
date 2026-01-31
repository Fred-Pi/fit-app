/**
 * NumberInput - A number input with stepper buttons on desktop
 *
 * Mobile: Standard number input (touch keyboard)
 * Desktop: Input with +/- buttons and scroll wheel support
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import { lightHaptic } from '../utils/haptics';
import Tooltip from './Tooltip';

interface NumberInputProps {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** For decimal values like weight */
  allowDecimal?: boolean;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  /** Size variant */
  size?: 'default' | 'large';
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChangeText,
  label,
  placeholder = '0',
  min = 0,
  max = 9999,
  step = 1,
  allowDecimal = false,
  maxLength = 4,
  onFocus,
  onBlur,
  isFocused = false,
  size = 'default',
}) => {
  const inputRef = useRef<TextInput>(null);
  const isWeb = Platform.OS === 'web';
  const isLarge = size === 'large';

  const numericValue = parseFloat(value) || 0;

  const handleIncrement = () => {
    const newValue = Math.min(numericValue + step, max);
    const formatted = allowDecimal ? newValue.toFixed(1) : Math.round(newValue).toString();
    onChangeText(formatted);
    lightHaptic();
  };

  const handleDecrement = () => {
    const newValue = Math.max(numericValue - step, min);
    const formatted = allowDecimal ? newValue.toFixed(1) : Math.round(newValue).toString();
    onChangeText(formatted);
    lightHaptic();
  };

  const handleChangeText = (text: string) => {
    // Allow empty string
    if (text === '') {
      onChangeText('');
      return;
    }

    // Validate input
    const regex = allowDecimal ? /^[0-9]*\.?[0-9]*$/ : /^[0-9]*$/;
    if (regex.test(text)) {
      onChangeText(text);
    }
  };

  // Handle scroll wheel on web
  useEffect(() => {
    if (!isWeb || !inputRef.current) return;

    const element = inputRef.current as any;
    const nativeElement = element._nativeTag || element;

    const handleWheel = (e: WheelEvent) => {
      // Only handle if focused
      if (document.activeElement !== nativeElement) return;

      e.preventDefault();
      if (e.deltaY < 0) {
        handleIncrement();
      } else {
        handleDecrement();
      }
    };

    // For web, we need to attach to the actual DOM element
    if (typeof nativeElement?.addEventListener === 'function') {
      nativeElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => nativeElement.removeEventListener('wheel', handleWheel);
    }
  }, [isWeb, numericValue, step, min, max]);

  // Desktop: Show steppers
  if (isWeb) {
    const stepLabel = allowDecimal ? step.toFixed(1) : step.toString();

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
          <Tooltip text={`-${stepLabel}`} position="top" delay={300}>
            <Pressable
              style={({ pressed }) => [
                styles.stepperButton,
                styles.stepperLeft,
                pressed && styles.stepperPressed,
                numericValue <= min && styles.stepperDisabled,
              ]}
              onPress={handleDecrement}
              disabled={numericValue <= min}
              accessibilityLabel="Decrease value"
              accessibilityRole="button"
            >
              <Ionicons
                name="remove"
                size={18}
                color={numericValue <= min ? colors.textTertiary : colors.text}
              />
            </Pressable>
          </Tooltip>

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              isLarge && styles.inputLarge,
            ]}
            value={value}
            onChangeText={handleChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
            textAlign="center"
            maxLength={maxLength}
            selectTextOnFocus
          />

          <Tooltip text={`+${stepLabel}`} position="top" delay={300}>
            <Pressable
              style={({ pressed }) => [
                styles.stepperButton,
                styles.stepperRight,
                pressed && styles.stepperPressed,
                numericValue >= max && styles.stepperDisabled,
              ]}
              onPress={handleIncrement}
              disabled={numericValue >= max}
              accessibilityLabel="Increase value"
              accessibilityRole="button"
            >
              <Ionicons
                name="add"
                size={18}
                color={numericValue >= max ? colors.textTertiary : colors.text}
              />
            </Pressable>
          </Tooltip>
        </View>
      </View>
    );
  }

  // Mobile: Standard input
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={inputRef}
        style={[
          styles.mobileInput,
          isLarge && styles.mobileInputLarge,
          isFocused && styles.mobileInputFocused,
        ]}
        value={value}
        onChangeText={handleChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
        textAlign="center"
        maxLength={maxLength}
        selectTextOnFocus
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Desktop styles
  inputRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.border,
    overflow: 'hidden',
  },
  inputRowFocused: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    textAlign: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    minWidth: 50,
    outlineStyle: 'none' as any,
  },
  inputLarge: {
    fontSize: typography.size['2xl'],
    paddingVertical: spacing.lg,
  },
  stepperButton: {
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: glass.background,
    cursor: 'pointer' as any,
  },
  stepperLeft: {
    borderRightWidth: 1,
    borderRightColor: glass.border,
  },
  stepperRight: {
    borderLeftWidth: 1,
    borderLeftColor: glass.border,
  },
  stepperPressed: {
    backgroundColor: glass.backgroundDark,
  },
  stepperDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed' as any,
  },

  // Mobile styles
  mobileInput: {
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.border,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    textAlign: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  mobileInputLarge: {
    fontSize: typography.size['2xl'],
    paddingVertical: spacing.lg,
  },
  mobileInputFocused: {
    borderColor: colors.primary,
  },
});

export default NumberInput;
