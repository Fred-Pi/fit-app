/**
 * Database utilities for storage modules
 */

import { getDatabase } from '../database';

/**
 * Get database with non-null assertion
 * On web, this will return null from the shim - callers should check Platform.OS
 */
export const getDb = async () => {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database not available on this platform');
  }
  return db;
};
