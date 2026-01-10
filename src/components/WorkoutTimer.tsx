import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface WorkoutTimerProps {
  onDurationChange: (durationInMinutes: number) => void;
  initialDuration?: number; // for edit mode (in minutes)
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ onDurationChange, initialDuration }) => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState(initialDuration ? initialDuration * 60 : 0); // convert to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [displayTime, setDisplayTime] = useState(initialDuration ? initialDuration * 60 : 0); // seconds for display
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to MM:SS
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update display and notify parent
  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        const totalTime = accumulatedTime + elapsed;
        setDisplayTime(totalTime);
        onDurationChange(totalTime / 60); // convert to minutes
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
  }, [isRunning, startTime, accumulatedTime]);

  const handleStart = () => {
    setStartTime(Date.now());
    setIsRunning(true);
  };

  const handlePause = () => {
    if (startTime) {
      const elapsed = (Date.now() - startTime) / 1000;
      setAccumulatedTime(prev => prev + elapsed);
      setStartTime(null);
      setIsRunning(false);
    }
  };

  const handleResume = () => {
    setStartTime(Date.now());
    setIsRunning(true);
  };

  const handleStop = () => {
    if (startTime) {
      const elapsed = (Date.now() - startTime) / 1000;
      const finalTime = accumulatedTime + elapsed;
      setAccumulatedTime(finalTime);
      setDisplayTime(finalTime);
      onDurationChange(finalTime / 60);
    }
    setStartTime(null);
    setIsRunning(false);
  };

  // Not started state
  if (!isRunning && accumulatedTime === 0 && !startTime) {
    return (
      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <Ionicons name="play" size={16} color="#32D760" />
        <Text style={styles.startButtonText}>Timer</Text>
      </TouchableOpacity>
    );
  }

  // Running or paused state
  return (
    <View style={styles.timerContainer}>
      <View style={[styles.timeDisplay, !isRunning && styles.timeDisplayPaused]}>
        <Ionicons name="time-outline" size={16} color={isRunning ? "#3A9BFF" : "#A0A0A8"} />
        <Text style={[styles.timeText, !isRunning && styles.timeTextPaused]}>
          {formatTime(displayTime)}
        </Text>
      </View>
      <View style={styles.controls}>
        {isRunning ? (
          <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
            <Ionicons name="pause" size={16} color="#FFD60A" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.controlButton} onPress={handleResume}>
            <Ionicons name="play" size={16} color="#32D760" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.controlButton} onPress={handleStop}>
          <Ionicons name="stop" size={16} color="#FF5E6D" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#2A2A30',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A42',
    gap: 4,
  },
  startButtonText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#2A2A30',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  timeDisplayPaused: {
    borderColor: '#3A3A42',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  timeTextPaused: {
    color: colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    gap: 6,
  },
  controlButton: {
    padding: 6,
    backgroundColor: '#2A2A30',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3A3A42',
  },
});

export default WorkoutTimer;
