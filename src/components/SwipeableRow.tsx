import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete: () => void;
  showEdit?: boolean;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onEdit,
  onDelete,
  showEdit = true,
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const editScale = dragX.interpolate({
      inputRange: [-150, -75, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    const deleteScale = dragX.interpolate({
      inputRange: [-150, -75, 0],
      outputRange: [1, 1, 0],
      extrapolate: 'clamp',
    });

    const handleEdit = () => {
      swipeableRef.current?.close();
      onEdit?.();
    };

    const handleDelete = () => {
      swipeableRef.current?.close();
      onDelete();
    };

    return (
      <View style={styles.rightActions}>
        {showEdit && onEdit && (
          <Animated.View style={[styles.actionButton, { transform: [{ scale: editScale }] }]}>
            <TouchableOpacity
              style={[styles.actionContent, styles.editAction]}
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        <Animated.View style={[styles.actionButton, { transform: [{ scale: deleteScale }] }]}>
          <TouchableOpacity
            style={[styles.actionContent, styles.deleteAction]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  rightActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 14,
  },
  actionButton: {
    justifyContent: 'center',
  },
  actionContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: '100%',
    minWidth: 75,
  },
  editAction: {
    backgroundColor: '#0A84FF',
    borderRadius: 12,
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default SwipeableRow;
