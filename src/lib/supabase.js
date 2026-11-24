import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const backendConfigured = Boolean(url && key);

// The publishable key is safe to ship in the app; row level security protects the data.
export const supabase = createClient(url || 'https://missing.invalid', key || 'missing', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On the web the OAuth redirect lands back in the page, so the session is read from the URL there.
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});
