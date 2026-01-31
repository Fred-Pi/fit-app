/**
 * ContextMenu - Right-click context menu for desktop
 *
 * Shows a native-feeling dropdown menu on right-click.
 * Only renders on web platform.
 *
 * Usage:
 *   <ContextMenu
 *     items={[
 *       { label: 'Edit', icon: 'pencil', onPress: handleEdit },
 *       { label: 'Delete', icon: 'trash', onPress: handleDelete, destructive: true },
 *     ]}
 *   >
 *     <YourContent />
 *   </ContextMenu>
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';

export interface ContextMenuItem {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  /** Disable the context menu */
  disabled?: boolean;
}

interface MenuPosition {
  x: number;
  y: number;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  items,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const containerRef = useRef<View>(null);

  const isWeb = Platform.OS === 'web';

  // Attach context menu event listener on web
  useEffect(() => {
    if (!isWeb || disabled) return;

    const container = containerRef.current as any;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Get click position
      const clientX = e.pageX || 0;
      const clientY = e.pageY || 0;

      // Adjust position to keep menu in viewport
      const menuWidth = 180;
      const menuHeight = items.length * 44 + 16;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = clientX;
      let y = clientY;

      if (x + menuWidth > viewportWidth) {
        x = viewportWidth - menuWidth - 8;
      }
      if (y + menuHeight > viewportHeight) {
        y = viewportHeight - menuHeight - 8;
      }

      setPosition({ x, y });
      setIsVisible(true);
    };

    // Get the DOM node
    const node = container._nativeTag || container;
    if (node?.addEventListener) {
      node.addEventListener('contextmenu', handleContextMenu);
      return () => node.removeEventListener('contextmenu', handleContextMenu);
    }
  }, [isWeb, disabled, items.length]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isWeb || !isVisible) return;

    const handleClick = () => {
      setIsVisible(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    // Add listeners after a small delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWeb, isVisible]);

  const handleItemPress = useCallback((item: ContextMenuItem) => {
    if (item.disabled) return;
    setIsVisible(false);
    item.onPress();
  }, []);

  // On non-web platforms, just render children
  if (!isWeb) {
    return <>{children}</>;
  }

  return (
    <View ref={containerRef} style={styles.container}>
      {children}

      {isVisible && (
        <Modal
          transparent
          visible={isVisible}
          animationType="none"
          onRequestClose={() => setIsVisible(false)}
        >
          <View style={styles.overlay}>
            <View
              style={[
                styles.menu,
                {
                  left: position.x,
                  top: position.y,
                },
              ]}
            >
              {items.map((item, index) => (
                <MenuItemButton
                  key={index}
                  item={item}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                  onPress={() => handleItemPress(item)}
                />
              ))}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

/**
 * Menu item button with hover state handling
 */
const MenuItemButton: React.FC<{
  item: ContextMenuItem;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
}> = ({ item, isFirst, isLast, onPress }) => {
  const [isHovered, setIsHovered] = useState(false);

  const webHoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        isHovered && styles.menuItemHovered,
        pressed && styles.menuItemPressed,
        item.disabled && styles.menuItemDisabled,
        isFirst && styles.menuItemFirst,
        isLast && styles.menuItemLast,
      ]}
      onPress={onPress}
      disabled={item.disabled}
      {...webHoverProps}
    >
      {item.icon && (
        <Ionicons
          name={item.icon}
          size={16}
          color={
            item.disabled
              ? colors.textTertiary
              : item.destructive
              ? colors.error
              : colors.text
          }
          style={styles.menuItemIcon}
        />
      )}
      <Text
        style={[
          styles.menuItemLabel,
          item.destructive && styles.menuItemLabelDestructive,
          item.disabled && styles.menuItemLabelDisabled,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
};

/**
 * Separator for context menu items
 */
export const ContextMenuSeparator: React.FC = () => (
  <View style={styles.separator} />
);

const styles = StyleSheet.create({
  container: {
    // Inherit layout from parent
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    minWidth: 180,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.border,
    paddingVertical: spacing.xs,
    ...shadows.lg,
    // Web-specific styles
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    } as any),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    cursor: 'pointer' as any,
  },
  menuItemFirst: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  menuItemLast: {
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  menuItemHovered: {
    backgroundColor: glass.backgroundLight,
  },
  menuItemPressed: {
    backgroundColor: glass.background,
  },
  menuItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed' as any,
  },
  menuItemIcon: {
    marginRight: spacing.sm,
  },
  menuItemLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  menuItemLabelDestructive: {
    color: colors.error,
  },
  menuItemLabelDisabled: {
    color: colors.textTertiary,
  },
  separator: {
    height: 1,
    backgroundColor: glass.border,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.sm,
  },
});

export default ContextMenu;
