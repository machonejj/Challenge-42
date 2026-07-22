/**
 * Supabase client — created ONLY when the anon URL/key are configured. In Phase Two dev, they are
 * absent, so this is null and the app uses mock adapters (zero secrets). Only the anon key is ever
 * used on the client; RLS is the real security boundary.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Only instantiate in a real browser / native runtime. During web static rendering (Node, no
// `window`), the client's session storage would touch `window`/localStorage and crash the export.
const canUseStorage = typeof window !== 'undefined';

export const supabase: SupabaseClient | null =
  isSupabaseConfigured && canUseStorage
    ? createClient(url as string, anonKey as string, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
