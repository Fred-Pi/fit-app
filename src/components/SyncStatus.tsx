/**
 * Sync Status Component
 *
 * Displays the current sync status and pending changes count.
 * Allows manual sync trigger when online.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { syncService } from '../services/sync';
import { isSupabaseConfigured } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { colors, glass, spacing, typography, radius } from '../utils/theme';
import { lightHaptic, successHaptic } from '../utils/haptics';
import { logError } from '../utils/logger';

const SyncStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const user = useAuthStore((s) => s.user);

  const refreshStatus = useCallback(async () => {
    setIsOnline(syncService.getIsOnline());
    setIsSyncing(syncService.getIsSyncing());
    const count = await syncService.getPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshStatus();
    // Refresh status every 10 seconds
    const interval = setInterval(refreshStatus, 10000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const handleSync = async () => {
    if (!isOnline || !user?.id) return;

    lightHaptic();
    setIsSyncing(true);

    try {
      await syncService.fullSync(user.id);
      successHaptic();
    } catch (error) {
      logError('Sync failed', error);
    } finally {
      setIsSyncing(false);
      await refreshStatus();
    }
  };

  // Don't show if Supabase isn't configured
  if (!isSupabaseConfigured) {
    return (
      <View style={styles.container}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, styles.statusDotOffline]} />
          <Text style={styles.statusText}>Local only (cloud sync not configured)</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>{pendingCount} pending</Text>
          </View>
        )}
      </View>

      {isOnline && (
        <Pressable
          style={({ pressed }) => [
            styles.syncButton,
            pressed && styles.syncButtonPressed,
            isSyncing && styles.syncButtonDisabled,
          ]}
          onPress={handleSync}
          disabled={isSyncing}
          accessibilityRole="button"
          accessibilityLabel={isSyncing ? 'Syncing' : 'Sync now'}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="sync" size={18} color={colors.primary} />
          )}
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOnline: {
    backgroundColor: colors.success,
  },
  statusDotOffline: {
    backgroundColor: colors.textTertiary,
  },
  statusText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  pendingBadge: {
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  pendingText: {
    fontSize: typography.size.xs,
    color: colors.warning,
    fontWeight: typography.weight.medium,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.border,
  },
  syncButtonPressed: {
    backgroundColor: glass.background,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.medium,
  },
});

export default SyncStatus;
