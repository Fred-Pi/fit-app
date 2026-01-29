/**
 * Supabase Profile Service
 *
 * Handles user profile CRUD operations with Supabase.
 * Syncs profile data across devices/sessions.
 */

import { supabase, isSupabaseConfigured } from './client';

export interface SupabaseProfile {
  id: string;
  name: string;
  email?: string;
  daily_calorie_target: number;
  daily_step_goal: number;
  preferred_weight_unit: 'kg' | 'lbs';
  goal_weight?: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  name?: string;
  daily_calorie_target?: number;
  daily_step_goal?: number;
  preferred_weight_unit?: 'kg' | 'lbs';
  goal_weight?: number | null;
}

/**
 * Fetch user profile from Supabase
 */
export const fetchProfile = async (userId: string): Promise<SupabaseProfile | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

/**
 * Create a new profile in Supabase
 */
export const createProfile = async (
  userId: string,
  name: string,
  email?: string
): Promise<SupabaseProfile | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name,
        email,
        daily_calorie_target: 2200,
        daily_step_goal: 10000,
        preferred_weight_unit: 'kg',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    return null;
  }
};

/**
 * Update user profile in Supabase
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdate
): Promise<SupabaseProfile | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
};

/**
 * Ensure profile exists for user (create if missing)
 * Useful for OAuth users who may not have a profile yet
 */
export const ensureProfile = async (
  userId: string,
  name: string,
  email?: string
): Promise<SupabaseProfile | null> => {
  // Try to fetch existing profile
  let profile = await fetchProfile(userId);

  // If no profile exists, create one
  if (!profile) {
    profile = await createProfile(userId, name, email);
  }

  return profile;
};
