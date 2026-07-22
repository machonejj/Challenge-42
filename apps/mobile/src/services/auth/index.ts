import type { AuthErrorCode } from '@challenge42/types';
import { supabase, isSupabaseConfigured } from '@/services/supabase/client';
import type { AuthService } from './AuthService';
import { MockAuthService } from './mockAuthService';
import { SupabaseAuthService } from './supabaseAuthService';

let instance: AuthService | null = null;

/** The real Supabase adapter when configured; otherwise the zero-secret dev mock. */
export function getAuthService(): AuthService {
  if (instance) return instance;
  instance =
    isSupabaseConfigured && supabase ? new SupabaseAuthService(supabase) : new MockAuthService();
  return instance;
}

/** Friendly, non-leaky copy for each error code. */
export const AUTH_ERROR_COPY: Record<AuthErrorCode, string> = {
  invalid_credentials: 'That email or password doesn’t match. Try again.',
  email_taken: 'An account already exists for that email. Try signing in.',
  weak_password: 'Please choose a stronger password (at least 8 characters).',
  invalid_email: 'That email doesn’t look right.',
  network: 'We couldn’t reach the network. Check your connection and try again.',
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
  unknown: 'Something went wrong. Please try again.',
};

export type { AuthService } from './AuthService';
