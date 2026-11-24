import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// Google sign-in through Supabase OAuth (PKCE).
// Web: full-page redirect to Google and back. Phone: in-app browser sheet that returns to dietbuddy://auth-callback.
// Returns 'cancelled' when the user closes the sheet; throws on a real failure.
export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) throw error;
    return 'redirected';
  }

  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return 'cancelled';

  const url = new URL(result.url);
  const failure = url.searchParams.get('error_description') || url.searchParams.get('error');
  if (failure) throw new Error(failure);
  const code = url.searchParams.get('code');
  if (!code) throw new Error('No sign-in code returned');
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return 'signed-in';
}
