/**
 * DraggableList - Drag-and-drop reorderable list for desktop
 *
 * Desktop: Shows drag handles, supports drag-and-drop reordering
 * Mobile: Renders list normally (no drag support)
 *
 * Usage:
 *   <DraggableList
 *     items={exercises}
 *     keyExtractor={(item) => item.id}
 *     onReorder={(newItems) => setExercises(newItems)}
 *     renderItem={(item, index, dragHandleProps) => (
 *       <View style={styles.item}>
 *         <View {...dragHandleProps}>
 *           <Ionicons name="menu" />
 *         </View>
 *         <Text>{item.name}</Text>
 *       </View>
 *     )}
 *   />
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  ViewProps,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../utils/theme';

interface DragHandleProps {
  style?: Record<string, unknown>;
  onMouseDown?: (e: GestureResponderEvent | MouseEvent) => void;
}

interface DraggableListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => React.ReactNode;
  /** Gap between items */
  gap?: number;
}

interface ItemLayout {
  y: number;
  height: number;
}

function DraggableList<T>({
  items,
  keyExtractor,
  onReorder,
  renderItem,
  gap = spacing.sm,
}: DraggableListProps<T>) {
  const isWeb = Platform.OS === 'web';
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const itemLayouts = useRef<Map<string, ItemLayout>>(new Map());
  const containerRef = useRef<View>(null);
  const dragStartY = useRef<number>(0);
  const currentDragY = useRef<number>(0);

  // Handle item layout measurement
  const handleItemLayout = useCallback((key: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    itemLayouts.current.set(key, { y, height });
  }, []);

  // Find which index the drag is currently over
  const findDropIndex = useCallback((clientY: number): number => {
    let cumulativeHeight = 0;

    for (let i = 0; i < items.length; i++) {
      const key = keyExtractor(items[i]);
      const layout = itemLayouts.current.get(key);
      if (layout) {
        const midpoint = cumulativeHeight + layout.height / 2;
        if (clientY < midpoint) {
          return i;
        }
        cumulativeHeight += layout.height + gap;
      }
    }
    return items.length - 1;
  }, [items, keyExtractor, gap]);

  // Handle drag start
  const handleDragStart = useCallback((index: number, e: GestureResponderEvent | MouseEvent) => {
    if (!isWeb) return;

    e.preventDefault?.();
    setDraggingIndex(index);
    const mouseEvent = e as MouseEvent;
    dragStartY.current = mouseEvent.clientY || mouseEvent.pageY || 0;
    currentDragY.current = dragStartY.current;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      currentDragY.current = moveEvent.clientY;

      // Calculate relative position within container
      const container = containerRef.current as unknown as HTMLElement | null;
      if (container) {
        const rect = container.getBoundingClientRect?.();
        if (rect) {
          const relativeY = moveEvent.clientY - rect.top;
          const newDropIndex = findDropIndex(relativeY);
          setDragOverIndex(newDropIndex);
        }
      }
    };

    const handleMouseUp = () => {
      if (draggingIndex !== null && dragOverIndex !== null && draggingIndex !== dragOverIndex) {
        // Reorder items
        const newItems = [...items];
        const [removed] = newItems.splice(draggingIndex, 1);
        newItems.splice(dragOverIndex, 0, removed);
        onReorder(newItems);
      }

      setDraggingIndex(null);
      setDragOverIndex(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isWeb, items, draggingIndex, dragOverIndex, findDropIndex, onReorder]);

  // On mobile, just render the list without drag functionality
  if (!isWeb) {
    return (
      <View style={[styles.container, { gap }]}>
        {items.map((item, index) => (
          <View key={keyExtractor(item)}>
            {renderItem(item, index, {})}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View ref={containerRef} style={[styles.container, { gap }]}>
      {items.map((item, index) => {
        const key = keyExtractor(item);
        const isDragging = draggingIndex === index;
        const isDropTarget = dragOverIndex === index && draggingIndex !== null && draggingIndex !== index;

        const dragHandleProps: DragHandleProps = {
          style: styles.dragHandle,
          onMouseDown: (e: GestureResponderEvent | MouseEvent) => handleDragStart(index, e),
        };

        return (
          <View
            key={key}
            onLayout={(e) => handleItemLayout(key, e)}
            style={[
              styles.itemWrapper,
              isDragging && styles.itemDragging,
              isDropTarget && styles.itemDropTarget,
            ]}
          >
            {renderItem(item, index, dragHandleProps)}
          </View>
        );
      })}
    </View>
  );
}

/**
 * DragHandle - Visual drag handle component
 */
export const DragHandle: React.FC<DragHandleProps & { children?: React.ReactNode }> = ({
  style,
  onMouseDown,
  children,
}) => {
  const isWeb = Platform.OS === 'web';

  if (!isWeb) {
    return null; // No drag handle on mobile
  }

  return (
    <View
      style={[styles.dragHandleContainer, style]}
      onTouchStart={onMouseDown as ViewProps['onTouchStart']}
      {...(isWeb ? { onMouseDown } : {})}
    >
      {children || (
        <Ionicons name="menu" size={20} color={colors.textTertiary} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // gap is set dynamically
  },
  itemWrapper: {
    position: 'relative',
  },
  itemDragging: {
    opacity: 0.5,
    transform: [{ scale: 1.02 }],
  },
  itemDropTarget: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingTop: spacing.xs,
  },
  dragHandle: {
    ...({ cursor: 'grab' } as Record<string, string>),
  },
  dragHandleContainer: {
    padding: spacing.sm,
    ...({ cursor: 'grab' } as Record<string, string>),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DraggableList;
