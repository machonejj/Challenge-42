/**
 * Dev/mock auth — AsyncStorage-backed accounts + session. Lets the whole Phase Two flow run with
 * ZERO secrets and no backend. NOT for production (passwords are not securely hashed here).
 */
import type { AuthResult, AuthSession } from '@challenge42/types';
import { storage } from '@/lib/storage';
import { newId } from '@/lib/id';
import type { AuthService } from './AuthService';

const ACCOUNTS_KEY = 'c42.auth.accounts';
const SESSION_KEY = 'c42.auth.session';

interface MockAccount {
  id: string;
  email: string;
  password: string; // dev-only
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

function sessionFor(account: MockAccount): AuthSession {
  return {
    user: { id: account.id, email: account.email },
    accessToken: `mock.${account.id}`,
    refreshToken: null,
    expiresAt: null,
  };
}

export class MockAuthService implements AuthService {
  readonly id = 'mock';

  private async accounts(): Promise<Record<string, MockAccount>> {
    return (await storage.getJSON<Record<string, MockAccount>>(ACCOUNTS_KEY)) ?? {};
  }

  async getSession(): Promise<AuthSession | null> {
    return storage.getJSON<AuthSession>(SESSION_KEY);
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const key = normalize(email);
    const accounts = await this.accounts();
    if (accounts[key]) {
      return { ok: false, session: null, errorCode: 'email_taken' };
    }
    const account: MockAccount = { id: newId(), email: key, password };
    accounts[key] = account;
    await storage.setJSON(ACCOUNTS_KEY, accounts);
    const session = sessionFor(account);
    await storage.setJSON(SESSION_KEY, session);
    return { ok: true, session, errorCode: null };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const key = normalize(email);
    const account = (await this.accounts())[key];
    if (!account || account.password !== password) {
      return { ok: false, session: null, errorCode: 'invalid_credentials' };
    }
    const session = sessionFor(account);
    await storage.setJSON(SESSION_KEY, session);
    return { ok: true, session, errorCode: null };
  }

  async signOut(): Promise<void> {
    await storage.remove(SESSION_KEY);
  }

  async requestPasswordReset(): Promise<AuthResult> {
    // Dev mock: pretend success (never reveals whether an email exists).
    return { ok: true, session: null, errorCode: null };
  }
}
