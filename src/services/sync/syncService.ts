/**
 * Sync Service
 *
 * Handles offline-first data synchronization between local storage and Supabase.
 * - Queues local changes for cloud sync
 * - Processes queue when online
 * - Pulls remote changes on app foreground
 * - Monitors network state (with web fallback)
 * - Detects and handles sync conflicts
 * - Encrypts sensitive data in sync queue
 */

import { Platform, AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { supabase, isSupabaseConfigured } from '../supabase';
import { getDatabase } from '../database';
import { logWarn, logError, logInfo } from '../../utils/logger';

// Simple encryption key derivation (in production, use secure key storage)
const ENCRYPTION_PREFIX = 'ENC:';
const getEncryptionKey = async (): Promise<string> => {
  // Use a deterministic key based on app identifier
  // In production, store this in secure storage after first generation
  const baseKey = 'fit-app-sync-key-v1';
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    baseKey
  );
  return hash.substring(0, 32);
};

// XOR-based encryption (lightweight, suitable for local obfuscation)
const encryptPayload = async (payload: string): Promise<string> => {
  const key = await getEncryptionKey();
  let encrypted = '';
  for (let i = 0; i < payload.length; i++) {
    const charCode = payload.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  // Base64 encode for safe storage
  return ENCRYPTION_PREFIX + btoa(encrypted);
};

const decryptPayload = async (encrypted: string): Promise<string> => {
  if (!encrypted.startsWith(ENCRYPTION_PREFIX)) {
    // Legacy unencrypted payload, return as-is
    return encrypted;
  }
  const key = await getEncryptionKey();
  const decoded = atob(encrypted.substring(ENCRYPTION_PREFIX.length));
  let decrypted = '';
  for (let i = 0; i < decoded.length; i++) {
    const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    decrypted += String.fromCharCode(charCode);
  }
  return decrypted;
};

// Conflict resolution strategy
type ConflictResolution = 'cloud_wins' | 'local_wins' | 'manual';

interface ConflictInfo {
  tableName: string;
  recordId: string;
  localUpdatedAt: string;
  cloudUpdatedAt: string;
  resolution: ConflictResolution;
}

// Callback for conflict notifications (stores can subscribe)
type ConflictCallback = (conflict: ConflictInfo) => void;
let conflictCallbacks: ConflictCallback[] = [];

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
  | 'achievements'
  | 'food_presets';

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
  private unsubscribeAppState: (() => void) | null = null;
  private conflictResolution: ConflictResolution = 'cloud_wins';
  private currentUserId: string | null = null;
  private lastForegroundSync: number = 0;
  private readonly FOREGROUND_SYNC_DEBOUNCE = 30000; // 30 seconds minimum between foreground syncs

  /**
   * Subscribe to conflict notifications
   */
  onConflict(callback: ConflictCallback): () => void {
    conflictCallbacks.push(callback);
    return () => {
      conflictCallbacks = conflictCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictResolution(strategy: ConflictResolution): void {
    this.conflictResolution = strategy;
  }

  /**
   * Notify listeners of a conflict
   */
  private notifyConflict(conflict: ConflictInfo): void {
    for (const callback of conflictCallbacks) {
      try {
        callback(conflict);
      } catch (error) {
        logError('Conflict callback error', error);
      }
    }
  }

  /**
   * Set the current user ID for foreground sync
   */
  setUserId(userId: string | null): void {
    this.currentUserId = userId;
  }

  /**
   * Handle app state changes - sync when coming to foreground
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && this.isOnline && this.currentUserId) {
      const now = Date.now();
      // Debounce to prevent rapid syncs
      if (now - this.lastForegroundSync > this.FOREGROUND_SYNC_DEBOUNCE) {
        this.lastForegroundSync = now;
        logInfo('App came to foreground, triggering sync');
        this.fullSync(this.currentUserId);
      }
    }
  };

  /**
   * Initialize the sync service
   * Sets up network monitoring and app state listening for foreground sync
   */
  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web: use navigator.onLine with online/offline events
        this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

        if (typeof window !== 'undefined') {
          const handleOnline = () => {
            const wasOffline = !this.isOnline;
            this.isOnline = true;
            if (wasOffline) {
              this.processQueue();
            }
          };
          const handleOffline = () => {
            this.isOnline = false;
          };

          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);

          this.unsubscribeNetInfo = () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
          };
        }
      } else {
        // Native: use NetInfo
        const state = await NetInfo.fetch();
        this.isOnline = state.isConnected ?? false;

        this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
          const wasOffline = !this.isOnline;
          this.isOnline = state.isConnected ?? false;

          if (wasOffline && this.isOnline) {
            this.processQueue();
          }
        });
      }
    } catch (error) {
      // Fallback: assume online
      logWarn('Failed to initialize network monitoring', error);
      this.isOnline = true;
    }

    // Set up app state listener for foreground sync (native only)
    if (Platform.OS !== 'web') {
      const subscription = AppState.addEventListener('change', this.handleAppStateChange);
      this.unsubscribeAppState = () => subscription.remove();
    } else if (typeof document !== 'undefined') {
      // Web: use visibilitychange event
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          this.handleAppStateChange('active');
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      this.unsubscribeAppState = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }

  /**
   * Cleanup network and app state listeners
   */
  cleanup(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    if (this.unsubscribeAppState) {
      this.unsubscribeAppState();
      this.unsubscribeAppState = null;
    }
  }

  /**
   * Queue a mutation for sync
   * This should be called after every local SQLite write
   * Payloads are encrypted before storage for data safety
   */
  async queueMutation(
    tableName: SyncTableName,
    recordId: string,
    operation: SyncOperation,
    payload?: Record<string, unknown>
  ): Promise<void> {
    const db = await getDatabase();
    if (!db) return;

    const now = new Date().toISOString();

    // Ensure updated_at is set for conflict detection
    let finalPayload = payload;
    if (payload && !payload.updated_at) {
      finalPayload = { ...payload, updated_at: now };
    }

    // Encrypt payload before storing
    let encryptedPayload: string | null = null;
    if (finalPayload) {
      const payloadJson = JSON.stringify(finalPayload);
      encryptedPayload = await encryptPayload(payloadJson);
    }

    // Deduplicate: remove any existing pending entry for same record/table
    await db.runAsync(
      `DELETE FROM sync_queue
       WHERE table_name = ? AND record_id = ? AND processed_at IS NULL`,
      [tableName, recordId]
    );

    await db.runAsync(
      `INSERT INTO sync_queue (table_name, record_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [tableName, recordId, operation, encryptedPayload, now]
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
    if (this.isSyncing || !this.isOnline || !isSupabaseConfigured) return;

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
          logError(`Sync error for ${item.table_name}/${item.record_id}`, error);
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
   * Handles decryption, conflict detection, and safe JSON parsing
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    // Safely parse and decrypt payload
    let payload: Record<string, unknown> | null = null;
    if (item.payload) {
      try {
        const decrypted = await decryptPayload(item.payload);
        payload = JSON.parse(decrypted);
      } catch (parseError) {
        logError(`Failed to parse payload for ${item.table_name}/${item.record_id}`, parseError);
        throw new Error('Corrupted sync queue payload');
      }
    }

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
      // UPSERT with conflict detection
      if (!payload) {
        throw new Error('UPSERT operation requires payload');
      }

      // Check for conflicts by fetching current cloud version
      const { data: cloudRecord, error: fetchError } = await supabase
        .from(item.table_name)
        .select('id, updated_at')
        .eq('id', item.record_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = not found, which means this is a new record
        throw fetchError;
      }

      // Conflict detection: compare timestamps
      if (cloudRecord?.updated_at && payload.updated_at) {
        const cloudTime = new Date(cloudRecord.updated_at).getTime();
        const localTime = new Date(payload.updated_at as string).getTime();

        if (cloudTime > localTime) {
          // Cloud version is newer - we have a conflict
          const conflict: ConflictInfo = {
            tableName: item.table_name,
            recordId: item.record_id,
            localUpdatedAt: payload.updated_at as string,
            cloudUpdatedAt: cloudRecord.updated_at,
            resolution: this.conflictResolution,
          };

          this.notifyConflict(conflict);
          logInfo(`Sync conflict detected for ${item.table_name}/${item.record_id}`, {
            localTime: payload.updated_at,
            cloudTime: cloudRecord.updated_at,
            resolution: this.conflictResolution,
          });

          if (this.conflictResolution === 'cloud_wins') {
            // Skip this local change, cloud version is preserved
            return;
          }
          // For 'local_wins', continue with upsert
          // For 'manual', would need UI integration (future enhancement)
        }
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
      logError(`Failed to pull changes for ${tableName}`, error);
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
        logError(`Failed to sync ${table}`, error);
      }
    }
  }

  /**
   * Get pending sync count
   */
  async getPendingCount(): Promise<number> {
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
