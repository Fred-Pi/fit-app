/**
 * OAuth Authentication Helpers
 *
 * Handles Google sign-in flow with Supabase.
 * Supports both web and native platforms.
 */

import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase, isSupabaseConfigured } from './client';

// Required for OAuth redirect handling on native
WebBrowser.maybeCompleteAuthSession();

const isWeb = Platform.OS === 'web';

// Get the redirect URI for OAuth
const getRedirectUri = () => {
  if (isWeb) {
    // On web, redirect back to the current origin
    return window.location.origin;
  }
  // On native, use deep link
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

    if (isWeb) {
      // On web, let Supabase handle the redirect flow
      // The page will redirect to Google, then back to our app
      // Supabase client will detect the session from URL automatically
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) {
        return { error };
      }

      // On web, this won't be reached as the page redirects
      return { error: null };
    } else {
      // On native, use WebBrowser to handle OAuth in a popup
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
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

        if (result.type === 'success' && 'url' in result && result.url) {
          // Extract tokens from URL hash or query params
          const url = new URL(result.url);
          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          if (url.hash) {
            const hashParams = new URLSearchParams(url.hash.substring(1));
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
          }

          if (!accessToken || !refreshToken) {
            accessToken = url.searchParams.get('access_token');
            refreshToken = url.searchParams.get('refresh_token');
          }

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              return { error: sessionError };
            }
          } else {
            return { error: new Error('Authentication failed - no tokens received') };
          }
        } else if (result.type === 'cancel') {
          return { error: new Error('Authentication was cancelled') };
        }
      }

      return { error: null };
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { error: error instanceof Error ? error : new Error('Unknown error') };
  }
};
