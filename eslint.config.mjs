// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Root ESLint (flat config).
 *
 * Scope: the pure-TypeScript shared packages (`packages/**`).
 * The Expo and Next.js apps self-lint with their framework configs
 * (`eslint-config-expo`, `eslint-config-next`), so we ignore `apps/**` here
 * to avoid requiring those plugins at the repo root.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.expo/**',
      '**/coverage/**',
      'apps/**',
      'supabase/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  prettier,
);
