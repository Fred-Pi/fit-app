export { supabase, isSupabaseConfigured } from './client';
export { signInWithGoogle } from './auth';
export {
  fetchProfile,
  createProfile,
  updateProfile,
  ensureProfile,
  type SupabaseProfile,
  type ProfileUpdate,
} from './profile';
