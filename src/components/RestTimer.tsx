import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native'
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import ModalHeader from './ModalHeader';
import GlassButton from './GlassButton';

interface RestTimerProps {
  visible: boolean;
  onClose: () => void;
}

const PRESET_TIMES = [30, 60, 90, 120, 180]; // seconds

const RestTimer: React.FC<RestTimerProps> = ({ visible, onClose }) => {
  const [selectedDuration, setSelectedDuration] = useState(60); // Default 60 seconds
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    setIsCompleted(true);

    // Vibration pattern: short-long-short
    Vibration.vibrate([0, 200, 100, 200, 100, 400]);

    // Show completion alert
    Alert.alert(
      '⏰ Rest Complete!',
      'Time to start your next set',
      [
        { text: 'OK', onPress: () => setIsCompleted(false) }
      ]
    );
  };

  const handleStart = () => {
    if (timeRemaining === 0) {
      setTimeRemaining(selectedDuration);
    }
    setIsRunning(true);
    setIsCompleted(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(selectedDuration);
    setIsCompleted(false);
  };

  const handlePresetSelect = (duration: number) => {
    setSelectedDuration(duration);
    setTimeRemaining(duration);
    setIsRunning(false);
    setIsCompleted(false);
  };

  const handleClose = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return ((selectedDuration - timeRemaining) / selectedDuration) * 100;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <ModalHeader
          title="Rest Timer"
          onCancel={handleClose}
          showSave={false}
          cancelText="Close"
        />

        <View style={styles.content}>
          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <View style={[
              styles.timerCircle,
              isCompleted && styles.timerCircleComplete
            ]}>
              <Text style={[
                styles.timerText,
                isCompleted && styles.timerTextComplete
              ]}>
                {formatTime(timeRemaining)}
              </Text>
              <Text style={styles.timerLabel}>
                {isCompleted ? 'Complete!' : isRunning ? 'Remaining' : 'Ready'}
              </Text>
            </View>

            {/* Progress Ring */}
            <View style={styles.progressRing}>
              <View
                style={[
                  styles.progressFill,
                  {
                    height: `${getProgressPercentage()}%`,
                    backgroundColor: isCompleted ? colors.success : colors.primary
                  }
                ]}
              />
            </View>
          </View>

          {/* Preset Times */}
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsLabel}>Quick Select</Text>
            <View style={styles.presets}>
              {PRESET_TIMES.map((time) => (
                <Pressable
                  key={time}
                  style={({ pressed }) => [
                    styles.presetButton,
                    selectedDuration === time && styles.presetButtonActive,
                    pressed && styles.presetButtonPressed,
                  ]}
                  onPress={() => handlePresetSelect(time)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    selectedDuration === time && styles.presetButtonTextActive
                  ]}>
                    {time < 60 ? `${time}s` : `${time / 60}m`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!isRunning ? (
              <View style={styles.controlButtonWrapper}>
                <GlassButton
                  title="Start"
                  onPress={handleStart}
                  variant="success"
                  icon="play"
                  size="lg"
                  fullWidth
                />
              </View>
            ) : (
              <View style={styles.controlButtonWrapper}>
                <GlassButton
                  title="Pause"
                  onPress={handlePause}
                  variant="secondary"
                  icon="pause"
                  size="lg"
                  fullWidth
                />
              </View>
            )}

            <View style={styles.controlButtonWrapper}>
              <GlassButton
                title="Reset"
                onPress={handleReset}
                variant="danger"
                icon="refresh"
                size="lg"
                fullWidth
              />
            </View>
          </View>

          {/* Tip */}
          <View style={styles.tipContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#3A9BFF" />
            <Text style={styles.tipText}>
              Timer will vibrate and alert when rest period is complete
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  timerContainer: {
    marginTop: spacing['3xl'],
    marginBottom: spacing['4xl'],
    position: 'relative',
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: glass.backgroundLight,
    borderWidth: 8,
    borderColor: glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCircleComplete: {
    borderColor: colors.success,
    backgroundColor: colors.successMuted,
  },
  timerText: {
    fontSize: typography.size['5xl'],
    fontWeight: typography.weight.extrabold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  timerTextComplete: {
    color: colors.success,
  },
  timerLabel: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },
  progressRing: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    opacity: 0.2,
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  presetsContainer: {
    width: '100%',
    marginBottom: spacing['3xl'],
  },
  presetsLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  presets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  presetButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetButtonPressed: {
    backgroundColor: glass.background,
  },
  presetButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },
  presetButtonTextActive: {
    color: colors.text,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing['2xl'],
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  controlButtonWrapper: {
    flex: 1,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  tipText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.primary,
    lineHeight: 18,
  },
});

export default RestTimer;
