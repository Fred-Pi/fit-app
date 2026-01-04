import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Rest Timer</Text>
          <View style={styles.placeholder} />
        </View>

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
                    backgroundColor: isCompleted ? '#32D760' : '#3A9BFF'
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
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.presetButton,
                    selectedDuration === time && styles.presetButtonActive
                  ]}
                  onPress={() => handlePresetSelect(time)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    selectedDuration === time && styles.presetButtonTextActive
                  ]}>
                    {time < 60 ? `${time}s` : `${time / 60}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!isRunning ? (
              <TouchableOpacity
                style={[styles.controlButton, styles.startButton]}
                onPress={handleStart}
              >
                <Ionicons name="play" size={32} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.controlButton, styles.pauseButton]}
                onPress={handlePause}
              >
                <Ionicons name="pause" size={32} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Pause</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.controlButton, styles.resetButton]}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={32} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Reset</Text>
            </TouchableOpacity>
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
    backgroundColor: '#1E1E22',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 16,
    color: '#A0A0A8',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  timerContainer: {
    marginTop: 40,
    marginBottom: 60,
    position: 'relative',
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#2A2A30',
    borderWidth: 8,
    borderColor: '#3A3A42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCircleComplete: {
    borderColor: '#32D760',
    backgroundColor: '#1A2E1F',
  },
  timerText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  timerTextComplete: {
    color: '#32D760',
  },
  timerLabel: {
    fontSize: 16,
    color: '#A0A0A8',
    fontWeight: '600',
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
    marginBottom: 40,
  },
  presetsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  presets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  presetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2A2A30',
    borderWidth: 2,
    borderColor: '#3A3A42',
  },
  presetButtonActive: {
    backgroundColor: '#3A9BFF',
    borderColor: '#3A9BFF',
  },
  presetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A0A0A8',
  },
  presetButtonTextActive: {
    color: '#FFFFFF',
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#32D760',
  },
  pauseButton: {
    backgroundColor: '#FFD60A',
  },
  resetButton: {
    backgroundColor: '#FF5E6D',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1A2E',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    maxWidth: 320,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#3A9BFF',
    lineHeight: 18,
  },
});

export default RestTimer;
