/** Authentication contract — provider-agnostic so mock/dev and Supabase satisfy the same shape. */
import type { UUID } from './primitives';

export interface AuthUser {
  id: UUID;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  /** Opaque token(s). Never logged or sent to analytics. */
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null; // epoch seconds
}

/** Friendly, non-leaky error codes. Raw provider messages are never surfaced to users. */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'invalid_email'
  | 'network'
  | 'rate_limited'
  | 'unknown';

export interface AuthResult {
  ok: boolean;
  session: AuthSession | null;
  errorCode: AuthErrorCode | null;
}
