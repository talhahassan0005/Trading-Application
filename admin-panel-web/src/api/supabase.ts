import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** False until admin-panel-web/.env.local is filled in — the sign-in page explains what to do. */
export const backendConfigured = !!(supabaseUrl && supabaseKey);

/** Shared backend with the mobile app. Only adminService.ts and AuthContext use this directly. */
export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseKey || 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true },
});
