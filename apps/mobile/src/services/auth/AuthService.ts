import type { AuthResult, AuthSession } from '@challenge42/types';

/**
 * Provider-agnostic auth contract. A dev mock and the real Supabase adapter both implement it, so
 * routing/UI never depend on the provider. Apple Sign In is anticipated via an optional seam.
 */
export interface AuthService {
  readonly id: string;
  getSession(): Promise<AuthSession | null>;
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<AuthResult>;
  /** Future: implemented by the Supabase adapter once Apple Sign In is added. */
  appleSignIn?(identityToken: string): Promise<AuthResult>;
}
