import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, Pressable } from 'react-native';
import { colors, glass, radius, spacing } from '../utils/theme';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { warningHaptic, lightHaptic } from '../utils/haptics';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

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
  const [isHovered, setIsHovered] = useState(false);
  const hoverOpacity = useRef(new Animated.Value(0)).current;

  const isWeb = Platform.OS === 'web';

  const handleMouseEnter = () => {
    if (!isWeb) return;
    setIsHovered(true);
    Animated.timing(hoverOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleMouseLeave = () => {
    if (!isWeb) return;
    Animated.timing(hoverOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setIsHovered(false));
  };

  const handleEditHover = () => {
    lightHaptic();
    onEdit?.();
  };

  const handleDeleteHover = () => {
    warningHaptic();
    onDelete();
  };

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
      lightHaptic();
      swipeableRef.current?.close();
      onEdit?.();
    };

    const handleDelete = () => {
      warningHaptic();
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
              accessibilityLabel="Edit"
              accessibilityRole="button"
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
            accessibilityLabel="Delete"
            accessibilityRole="button"
          >
            <Ionicons name="trash" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // On web, show hover actions and context menu instead of swipe
  if (isWeb) {
    const webHoverProps = {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    };

    // Build context menu items
    const contextMenuItems: ContextMenuItem[] = [];
    if (showEdit && onEdit) {
      contextMenuItems.push({
        label: 'Edit',
        icon: 'pencil',
        onPress: handleEditHover,
      });
    }
    contextMenuItems.push({
      label: 'Delete',
      icon: 'trash',
      onPress: handleDeleteHover,
      destructive: true,
    });

    return (
      <ContextMenu items={contextMenuItems}>
        <View style={styles.hoverContainer} {...webHoverProps}>
          {children}
          {isHovered && (
            <Animated.View style={[styles.hoverActions, { opacity: hoverOpacity }]}>
              {showEdit && onEdit && (
                <Pressable
                  style={({ pressed }) => [
                    styles.hoverButton,
                    styles.hoverEditButton,
                    pressed && styles.hoverButtonPressed,
                  ]}
                  onPress={handleEditHover}
                  accessibilityLabel="Edit"
                  accessibilityRole="button"
                >
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.hoverButton,
                  styles.hoverDeleteButton,
                  pressed && styles.hoverButtonPressed,
                ]}
                onPress={handleDeleteHover}
                accessibilityLabel="Delete"
                accessibilityRole="button"
              >
                <Ionicons name="trash" size={16} color={colors.error} />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ContextMenu>
    );
  }

  // On mobile, use swipe gestures
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
  // Swipe actions (mobile)
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
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },

  // Hover actions (desktop)
  hoverContainer: {
    position: 'relative',
  },
  hoverActions: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -16 }],
    flexDirection: 'row',
    gap: spacing.xs,
    zIndex: 10,
  },
  hoverButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  hoverButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  hoverEditButton: {
    borderColor: `${colors.primary}40`,
  },
  hoverDeleteButton: {
    borderColor: `${colors.error}40`,
  },
});

export default SwipeableRow;
