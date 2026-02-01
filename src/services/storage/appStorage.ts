/**
 * App initialization and cleanup storage operations
 */

import { User } from '../../types';
import { getUser, saveUser, createDefaultUser } from './userStorage';
import { logError } from '../../utils/logger';

export const initializeApp = async (): Promise<User> => {
  let user = await getUser();

  if (!user) {
    user = createDefaultUser();
    await saveUser(user);
  }

  return user;
};

export const clearAllData = async (): Promise<void> => {
  try {
    const { clearDatabase } = await import('../database');
    await clearDatabase();
  } catch (error) {
    logError('Error clearing data', error);
  }
};
