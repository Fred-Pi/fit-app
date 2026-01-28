/**
 * OAuth Authentication Helpers
 *
 * Handles Google and Apple sign-in flows with Supabase.
 */

import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './client';

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

/**
 * Sign in with Apple
 * Note: Only available on iOS
 */
export const signInWithApple = async (): Promise<{ error: Error | null }> => {
  if (Platform.OS !== 'ios') {
    return { error: new Error('Apple Sign In is only available on iOS') };
  }

  try {
    // Check if Apple Sign In is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return { error: new Error('Apple Sign In is not available on this device') };
    }

    // Request Apple credentials
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { error: new Error('Failed to get identity token from Apple') };
    }

    // Sign in to Supabase with the Apple ID token
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      return { error };
    }

    // If we got the user's name from Apple, update the profile
    if (credential.fullName?.givenName) {
      const name = [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(' ');

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          name,
          email: credential.email || user.email,
        });
      }
    }

    return { error: null };
  } catch (error: unknown) {
    // Handle user cancellation
    if (error && typeof error === 'object' && 'code' in error) {
      const appleError = error as { code: string };
      if (appleError.code === 'ERR_CANCELED') {
        return { error: null }; // User cancelled, not an error
      }
    }

    console.error('Apple sign-in error:', error);
    return { error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Check if Apple Sign In is available
 */
export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return AppleAuthentication.isAvailableAsync();
};
