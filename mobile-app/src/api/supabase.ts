/** Supabase client — the app's only connection to the backend (see src/api/backend.ts). */
import 'expo-sqlite/localStorage/install';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** False until mobile-app/.env.local is filled in — screens show a setup message instead of crashing. */
export const backendConfigured = !!(supabaseUrl && supabaseKey);

export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseKey || 'missing-key', {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Only refresh the session token while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
