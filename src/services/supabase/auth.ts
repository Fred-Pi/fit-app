/**
 * OAuth Authentication Helpers
 *
 * Handles Google sign-in flow with Supabase.
 */

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase, isSupabaseConfigured } from './client';

// Required for OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

// Get the redirect URI for OAuth
const getRedirectUri = () => {
  return AuthSession.makeRedirectUri({
    scheme: 'fitapp',
    path: 'auth/callback',
  });
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured') };
  }

  try {
    const redirectUri = getRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { error };
    }

    if (data?.url) {
      // Open the browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success' && result.url) {
        // Extract the auth code/tokens from the URL
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session manually
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            return { error: sessionError };
          }
        }
      }
    }

    return { error: null };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { error: error instanceof Error ? error : new Error('Unknown error') };
  }
};
