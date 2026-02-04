/**
 * Tooltip - Hover tooltip for desktop
 *
 * Shows a tooltip on hover (desktop only).
 * On mobile, just renders children without tooltip.
 *
 * Usage:
 *   <Tooltip text="Edit this item">
 *     <Pressable onPress={handleEdit}>
 *       <Ionicons name="pencil" />
 *     </Pressable>
 *   </Tooltip>
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: React.ReactNode;
  /** Tooltip text */
  text: string;
  /** Preferred position (default: top) */
  position?: TooltipPosition;
  /** Delay before showing tooltip in ms (default: 500) */
  delay?: number;
  /** Disable the tooltip */
  disabled?: boolean;
}

interface TooltipCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  text,
  position = 'top',
  delay = 500,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);
  const containerRef = useRef<View>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isWeb = Platform.OS === 'web';

  const showTooltip = useCallback(() => {
    if (disabled || !isWeb) return;

    // Measure the container position
    const container = containerRef.current as unknown as (HTMLElement & { measure?: (cb: (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => void) => void }) | null;
    if (container?.measure) {
      container.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setCoords({ x: pageX, y: pageY, width, height });
        setIsVisible(true);
      });
    } else if (container?.getBoundingClientRect) {
      const rect = container.getBoundingClientRect();
      setCoords({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
      setIsVisible(true);
    }
  }, [disabled, isWeb]);

  const handleMouseEnter = useCallback(() => {
    if (!isWeb || disabled) return;
    timeoutRef.current = setTimeout(showTooltip, delay);
  }, [isWeb, disabled, delay, showTooltip]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!coords) return {};

    const tooltipOffset = 8;
    const tooltipWidth = text.length * 7 + 24; // Approximate width
    const tooltipHeight = 32;

    let left = coords.x;
    let top = coords.y;

    switch (position) {
      case 'top':
        left = coords.x + coords.width / 2 - tooltipWidth / 2;
        top = coords.y - tooltipHeight - tooltipOffset;
        break;
      case 'bottom':
        left = coords.x + coords.width / 2 - tooltipWidth / 2;
        top = coords.y + coords.height + tooltipOffset;
        break;
      case 'left':
        left = coords.x - tooltipWidth - tooltipOffset;
        top = coords.y + coords.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        left = coords.x + coords.width + tooltipOffset;
        top = coords.y + coords.height / 2 - tooltipHeight / 2;
        break;
    }

    // Keep tooltip in viewport
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    if (left < 8) left = 8;
    if (left + tooltipWidth > viewportWidth - 8) left = viewportWidth - tooltipWidth - 8;
    if (top < 8) top = 8;
    if (top + tooltipHeight > viewportHeight - 8) top = viewportHeight - tooltipHeight - 8;

    return { left, top };
  };

  // On non-web platforms, just render children
  if (!isWeb) {
    return <>{children}</>;
  }

  const webHoverProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return (
    <View ref={containerRef} style={styles.container} {...webHoverProps}>
      {children}

      {isVisible && coords && (
        <Modal
          transparent
          visible={isVisible}
          animationType="none"
          onRequestClose={() => setIsVisible(false)}
        >
          <View style={styles.overlay} pointerEvents="none">
            <View style={[styles.tooltip, getTooltipStyle()]}>
              <Text style={styles.tooltipText}>{text}</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Inherit layout from children
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: glass.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    ...shadows.md,
    // Web-specific backdrop blur
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    } as Record<string, string>),
  },
  tooltipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text,
    textAlign: 'center',
  },
});

export default Tooltip;
