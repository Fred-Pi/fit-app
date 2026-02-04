/**
 * SelectionToolbar - Floating toolbar for batch operations
 *
 * Desktop: Shows when items are selected in a list
 * Mobile: Not rendered (mobile doesn't have multi-select)
 *
 * Usage:
 *   <SelectionToolbar
 *     selectedCount={3}
 *     totalCount={10}
 *     onSelectAll={() => selectAll()}
 *     onClear={() => clearSelection()}
 *     onDelete={() => handleBatchDelete()}
 *     itemLabel="workout"
 *   />
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import { warningHaptic, lightHaptic } from '../utils/haptics';

interface SelectionToolbarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Total number of items in the list */
  totalCount: number;
  /** Callback to select all items */
  onSelectAll: () => void;
  /** Callback to clear selection */
  onClear: () => void;
  /** Callback to delete selected items */
  onDelete: () => void;
  /** Label for the item type (e.g., "workout", "meal") */
  itemLabel?: string;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
  onDelete,
  itemLabel = 'item',
}) => {
  // Only render on web/desktop
  if (Platform.OS !== 'web' || selectedCount === 0) {
    return null;
  }

  const allSelected = selectedCount === totalCount;
  const pluralLabel = selectedCount === 1 ? itemLabel : `${itemLabel}s`;

  const handleSelectAll = () => {
    lightHaptic();
    onSelectAll();
  };

  const handleClear = () => {
    lightHaptic();
    onClear();
  };

  const handleDelete = () => {
    warningHaptic();
    onDelete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        {/* Selection count */}
        <View style={styles.countSection}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{selectedCount}</Text>
          </View>
          <Text style={styles.selectedText}>
            {pluralLabel} selected
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Select All / Deselect All */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={allSelected ? handleClear : handleSelectAll}
          >
            <Ionicons
              name={allSelected ? 'checkbox' : 'checkbox-outline'}
              size={18}
              color={colors.primary}
            />
            <Text style={styles.actionText}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>

          {/* Clear */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={handleClear}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
            <Text style={[styles.actionText, styles.actionTextSecondary]}>
              Clear
            </Text>
          </Pressable>

          {/* Delete */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={18} color={colors.error} />
            <Text style={[styles.actionText, styles.deleteText]}>
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: glass.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minWidth: 400,
    maxWidth: 600,
    ...shadows.lg,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    } as Record<string, string>),
  },
  countSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  countText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  selectedText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    ...({ cursor: 'pointer' } as Record<string, string>),
  },
  actionButtonPressed: {
    backgroundColor: glass.backgroundLight,
  },
  actionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.primary,
  },
  actionTextSecondary: {
    color: colors.textSecondary,
  },
  deleteButton: {
    backgroundColor: colors.errorMuted,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  deleteButtonPressed: {
    backgroundColor: `${colors.error}30`,
  },
  deleteText: {
    color: colors.error,
  },
});

export default SelectionToolbar;
