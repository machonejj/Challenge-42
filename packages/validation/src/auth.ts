/** Auth input schemas. Errors are mapped to friendly copy in the UI — raw messages never shown. */
import { z } from 'zod';

export const emailSchema = z.email('Enter a valid email address');

/** Min 8 chars (bcrypt caps at 72). Kept friendly; complexity is encouraged, not enforced. */
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'That password is too long');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const resetRequestSchema = z.object({
  email: emailSchema,
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
