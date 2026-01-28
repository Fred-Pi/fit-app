/**
 * Sync Service
 *
 * Handles offline-first data synchronization between SQLite and Supabase.
 * - Queues local changes for cloud sync
 * - Processes queue when online
 * - Pulls remote changes on app foreground
 * - Monitors network state
 */

import { Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase, isSupabaseConfigured } from '../supabase';
import { getDatabase } from '../database';

// Supported table names for sync
type SyncTableName =
  | 'workout_logs'
  | 'exercise_logs'
  | 'set_logs'
  | 'daily_nutrition'
  | 'meals'
  | 'daily_steps'
  | 'daily_weights'
  | 'personal_records'
  | 'workout_templates'
  | 'exercise_templates'
  | 'custom_exercises'
  | 'achievements';

type SyncOperation = 'UPSERT' | 'DELETE';

interface SyncQueueItem {
  id: number;
  table_name: SyncTableName;
  record_id: string;
  operation: SyncOperation;
  payload: string | null;
  created_at: string;
  processed_at: string | null;
  error: string | null;
}

class SyncService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private unsubscribeNetInfo: (() => void) | null = null;

  /**
   * Initialize the sync service
   * Sets up network monitoring
   */
  async initialize(): Promise<void> {
    // Check initial network state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;

    // Subscribe to network changes
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // If coming back online, process queue
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }

  /**
   * Cleanup network listener
   */
  cleanup(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  /**
   * Queue a mutation for sync
   * This should be called after every local SQLite write
   */
  async queueMutation(
    tableName: SyncTableName,
    recordId: string,
    operation: SyncOperation,
    payload?: Record<string, unknown>
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    const db = await getDatabase();
    if (!db) return;

    const now = new Date().toISOString();
    const payloadJson = payload ? JSON.stringify(payload) : null;

    await db.runAsync(
      `INSERT INTO sync_queue (table_name, record_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [tableName, recordId, operation, payloadJson, now]
    );

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Process all pending items in the sync queue
   */
  async processQueue(): Promise<void> {
    if (Platform.OS === 'web' || this.isSyncing || !this.isOnline || !isSupabaseConfigured) return;

    const db = await getDatabase();
    if (!db) return;

    this.isSyncing = true;

    try {
      // Get all pending items
      const pendingItems = await db.getAllAsync<SyncQueueItem>(
        'SELECT * FROM sync_queue WHERE processed_at IS NULL ORDER BY created_at ASC'
      );

      for (const item of pendingItems) {
        try {
          await this.processQueueItem(item);

          // Mark as processed
          await db.runAsync(
            'UPDATE sync_queue SET processed_at = ? WHERE id = ?',
            [new Date().toISOString(), item.id]
          );
        } catch (error) {
          // Record error and continue
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await db.runAsync(
            'UPDATE sync_queue SET error = ? WHERE id = ?',
            [errorMessage, item.id]
          );
          console.error(`Sync error for ${item.table_name}/${item.record_id}:`, error);
        }
      }

      // Clean up old processed items (keep last 7 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      await db.runAsync(
        'DELETE FROM sync_queue WHERE processed_at IS NOT NULL AND processed_at < ?',
        [cutoffDate.toISOString()]
      );
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    const payload = item.payload ? JSON.parse(item.payload) : null;

    if (item.operation === 'DELETE') {
      const { error } = await supabase
        .from(item.table_name)
        .delete()
        .eq('id', item.record_id);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found, which is ok for deletes
        throw error;
      }
    } else {
      // UPSERT
      if (!payload) {
        throw new Error('UPSERT operation requires payload');
      }

      const { error } = await supabase.from(item.table_name).upsert(payload);

      if (error) {
        throw error;
      }
    }
  }

  /**
   * Pull changes from Supabase for a specific table
   */
  async pullChanges(tableName: SyncTableName, userId: string): Promise<unknown[]> {
    if (!this.isOnline || !isSupabaseConfigured) return [];

    const db = await getDatabase();
    if (!db) return [];

    // Get last sync time for this table
    const metadata = await db.getFirstAsync<{ last_sync_at: string }>(
      'SELECT last_sync_at FROM sync_metadata WHERE table_name = ?',
      [tableName]
    );

    let query = supabase.from(tableName).select('*');

    // Filter by user_id for user-specific tables
    const userTables = [
      'workout_logs',
      'daily_nutrition',
      'daily_steps',
      'daily_weights',
      'personal_records',
      'workout_templates',
      'custom_exercises',
      'achievements',
    ];

    if (userTables.includes(tableName)) {
      query = query.eq('user_id', userId);
    }

    // Filter by updated_at if we have a last sync time
    if (metadata?.last_sync_at) {
      query = query.gt('updated_at', metadata.last_sync_at);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Failed to pull changes for ${tableName}:`, error);
      return [];
    }

    // Update last sync time
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_at)
       VALUES (?, ?)`,
      [tableName, now]
    );

    return data || [];
  }

  /**
   * Full sync - pull all changes from all tables
   */
  async fullSync(userId: string): Promise<void> {
    if (!this.isOnline || !isSupabaseConfigured) return;

    // First, push any pending changes
    await this.processQueue();

    // Then pull changes from all tables
    const tables: SyncTableName[] = [
      'workout_logs',
      'daily_nutrition',
      'daily_steps',
      'daily_weights',
      'personal_records',
      'workout_templates',
      'custom_exercises',
      'achievements',
    ];

    for (const table of tables) {
      try {
        await this.pullChanges(table, userId);
      } catch (error) {
        console.error(`Failed to sync ${table}:`, error);
      }
    }
  }

  /**
   * Get pending sync count
   */
  async getPendingCount(): Promise<number> {
    if (Platform.OS === 'web') return 0;

    const db = await getDatabase();
    if (!db) return 0;

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE processed_at IS NULL'
    );

    return result?.count || 0;
  }

  /**
   * Check if service is online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Check if currently syncing
   */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

// Export singleton instance
export const syncService = new SyncService();
