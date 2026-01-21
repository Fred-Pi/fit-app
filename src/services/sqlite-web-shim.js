/**
 * Web shim for expo-sqlite
 *
 * Provides no-op implementations for web platform where SQLite is not available.
 * The storage service will fall back to AsyncStorage when these return null.
 */

export const openDatabaseAsync = async () => null;
export const openDatabaseSync = () => null;
export const deleteDatabaseAsync = async () => {};
export const deleteDatabaseSync = () => {};

export default {
  openDatabaseAsync,
  openDatabaseSync,
  deleteDatabaseAsync,
  deleteDatabaseSync,
};
