/**
 * Real Supabase auth adapter. Selected only when Supabase is configured. Maps provider results into
 * our provider-agnostic shapes and NEVER surfaces raw provider error text to the UI.
 */
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { AuthErrorCode, AuthResult, AuthSession } from '@challenge42/types';
import type { AuthService } from './AuthService';

function toSession(session: Session | null): AuthSession | null {
  if (!session || !session.user.email) return null;
  return {
    user: { id: session.user.id, email: session.user.email },
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? null,
    expiresAt: session.expires_at ?? null,
  };
}

/** Map opaque provider errors to friendly, non-leaky codes. */
function mapError(message: string | undefined, status?: number): AuthErrorCode {
  const m = (message ?? '').toLowerCase();
  if (status === 429 || m.includes('rate')) return 'rate_limited';
  if (m.includes('already registered') || m.includes('already exists')) return 'email_taken';
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'invalid_credentials';
  if (m.includes('password')) return 'weak_password';
  if (m.includes('email')) return 'invalid_email';
  if (m.includes('network') || m.includes('fetch')) return 'network';
  return 'unknown';
}

export class SupabaseAuthService implements AuthService {
  readonly id = 'supabase';
  constructor(private readonly client: SupabaseClient) {}

  async getSession(): Promise<AuthSession | null> {
    const { data } = await this.client.auth.getSession();
    return toSession(data.session);
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error)
      return { ok: false, session: null, errorCode: mapError(error.message, error.status) };
    return { ok: true, session: toSession(data.session), errorCode: null };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error)
      return { ok: false, session: null, errorCode: mapError(error.message, error.status) };
    return { ok: true, session: toSession(data.session), errorCode: null };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async requestPasswordReset(email: string): Promise<AuthResult> {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error)
      return { ok: false, session: null, errorCode: mapError(error.message, error.status) };
    return { ok: true, session: null, errorCode: null };
  }
}
