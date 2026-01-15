import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native'
import { colors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { lightHaptic } from '../utils/haptics';

export interface FABAction {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

interface ExpandableFABProps {
  actions: FABAction[];
  mainIcon?: string;
  mainColor?: string;
}

const ExpandableFAB: React.FC<ExpandableFABProps> = ({
  actions,
  mainIcon = 'add',
  mainColor = '#007AFF',
}) => {
  const [expanded, setExpanded] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const actionAnimations = useRef(
    actions.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  useEffect(() => {
    if (expanded) {
      // Animate backdrop
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Animate actions with stagger
      Animated.stagger(
        50,
        actionAnimations.map(anim =>
          Animated.parallel([
            Animated.spring(anim.opacity, {
              toValue: 1,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.spring(anim.translateY, {
              toValue: 0,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
          ])
        )
      ).start();
    } else {
      // Collapse animations
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        ...actionAnimations.map(anim =>
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: 20,
              duration: 150,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [expanded]);

  const toggleMenu = () => {
    lightHaptic();
    setExpanded(!expanded);
  };

  const handleActionPress = (action: FABAction) => {
    setExpanded(false);
    action.onPress();
  };

  return (
    <>
      {/* Backdrop */}
      {expanded && (
        <TouchableWithoutFeedback onPress={() => setExpanded(false)}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Action Buttons */}
      {expanded && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <Animated.View
              key={index}
              style={[
                styles.actionWrapper,
                {
                  opacity: actionAnimations[index].opacity,
                  transform: [
                    { translateY: actionAnimations[index].translateY },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={action.icon as any}
                  size={20}
                  color={action.color || colors.text}
                />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: mainColor }]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Ionicons
          name={expanded ? 'close' : (mainIcon as any)}
          size={32}
          color="#fff"
        />
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    alignItems: 'flex-end',
  },
  actionWrapper: {
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E22',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    gap: 10,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ExpandableFAB;
