import { describe, it, expect } from 'vitest';
import { signInSchema, signUpSchema, resetRequestSchema } from './auth';

describe('auth schemas', () => {
  it('signUp requires a valid email and an 8+ char password', () => {
    expect(signUpSchema.safeParse({ email: 'a@b.com', password: 'longenough' }).success).toBe(true);
    expect(signUpSchema.safeParse({ email: 'not-an-email', password: 'longenough' }).success).toBe(
      false,
    );
    expect(signUpSchema.safeParse({ email: 'a@b.com', password: 'short' }).success).toBe(false);
  });

  it('signIn only requires a non-empty password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    expect(signInSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });

  it('resetRequest validates the email', () => {
    expect(resetRequestSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
    expect(resetRequestSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});
