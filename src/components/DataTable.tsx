/**
 * DataTable - Compact table view for desktop
 *
 * Desktop: Shows data in a sortable table format
 * Mobile: Falls back to card/list view
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: 'name', label: 'Exercise', width: 200 },
 *       { key: 'weight', label: 'Weight', align: 'right' },
 *       { key: 'date', label: 'Date' },
 *     ]}
 *     data={personalRecords}
 *     keyExtractor={(item) => item.id}
 *     onRowPress={(item) => handlePress(item)}
 *     renderMobileItem={(item) => <PRCard pr={item} />}
 *   />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, spacing, typography } from '../utils/theme';

type SortDirection = 'asc' | 'desc';

interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowPress?: (item: T) => void;
  /** Custom render for each row on mobile */
  renderMobileItem?: (item: T, index: number) => React.ReactNode;
  /** Show row actions on hover (desktop) */
  renderRowActions?: (item: T) => React.ReactNode;
  /** Initial sort column */
  defaultSortKey?: keyof T | string;
  /** Initial sort direction */
  defaultSortDirection?: SortDirection;
  /** Empty state message */
  emptyMessage?: string;
}

function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowPress,
  renderMobileItem,
  renderRowActions,
  defaultSortKey,
  defaultSortDirection = 'desc',
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const isWeb = Platform.OS === 'web';
  const [sortKey, setSortKey] = useState<keyof T | string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey as string];
      const bVal = (b as Record<string, unknown>)[sortKey as string];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const handleSort = (columnKey: keyof T | string) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(columnKey);
      setSortDirection('desc');
    }
  };

  const getCellValue = (item: T, column: Column<T>): React.ReactNode => {
    if (column.render) {
      return column.render(item, sortedData.indexOf(item));
    }
    const value = (item as Record<string, unknown>)[column.key as string];
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  // On mobile, use the mobile renderer if provided
  if (!isWeb && renderMobileItem) {
    return (
      <View style={styles.mobileContainer}>
        {sortedData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          sortedData.map((item, index) => (
            <View key={keyExtractor(item)}>
              {renderMobileItem(item, index)}
            </View>
          ))
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row */}
          <View style={styles.headerRow}>
            {columns.map((column) => (
              <Pressable
                key={String(column.key)}
                style={[
                  styles.headerCell,
                  { width: column.width, minWidth: column.minWidth || 80 },
                  column.sortable !== false && styles.headerCellSortable,
                ]}
                onPress={() => column.sortable !== false && handleSort(column.key)}
                disabled={column.sortable === false}
              >
                <Text
                  style={[
                    styles.headerText,
                    column.align === 'right' && styles.textRight,
                    column.align === 'center' && styles.textCenter,
                  ]}
                >
                  {column.label}
                </Text>
                {column.sortable !== false && sortKey === column.key && (
                  <Ionicons
                    name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.primary}
                    style={styles.sortIcon}
                  />
                )}
              </Pressable>
            ))}
            {renderRowActions && <View style={styles.actionsHeader} />}
          </View>

          {/* Data Rows */}
          {sortedData.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          ) : (
            sortedData.map((item) => {
              const key = keyExtractor(item);
              const isHovered = hoveredRow === key;

              const rowHoverProps = isWeb ? {
                onMouseEnter: () => setHoveredRow(key),
                onMouseLeave: () => setHoveredRow(null),
              } : {};

              return (
                <Pressable
                  key={key}
                  style={[
                    styles.dataRow,
                    isHovered && styles.dataRowHovered,
                    onRowPress && styles.dataRowClickable,
                  ]}
                  onPress={() => onRowPress?.(item)}
                  {...rowHoverProps}
                >
                  {columns.map((column) => (
                    <View
                      key={String(column.key)}
                      style={[
                        styles.dataCell,
                        { width: column.width, minWidth: column.minWidth || 80 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          column.align === 'right' && styles.textRight,
                          column.align === 'center' && styles.textCenter,
                        ]}
                        numberOfLines={1}
                      >
                        {getCellValue(item, column)}
                      </Text>
                    </View>
                  ))}
                  {renderRowActions && (
                    <View style={[styles.actionsCell, !isHovered && styles.actionsCellHidden]}>
                      {renderRowActions(item)}
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.border,
    overflow: 'hidden',
  },
  mobileContainer: {
    // Mobile uses custom renderMobileItem
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: glass.background,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerCellSortable: {
    ...({ cursor: 'pointer' } as Record<string, string>),
  },
  headerText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortIcon: {
    marginLeft: spacing.xs,
  },
  actionsHeader: {
    width: 80,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  dataRowHovered: {
    backgroundColor: glass.backgroundLight,
  },
  dataRowClickable: {
    ...({ cursor: 'pointer' } as Record<string, string>),
  },
  dataCell: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: typography.size.sm,
    color: colors.text,
  },
  textRight: {
    textAlign: 'right',
  },
  textCenter: {
    textAlign: 'center',
  },
  actionsCell: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: spacing.md,
    gap: spacing.xs,
  },
  actionsCellHidden: {
    opacity: 0,
  },
  emptyState: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
});

export default DataTable;
