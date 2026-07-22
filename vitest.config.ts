import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const resolvePath = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Root Vitest config. Aliases map the `@challenge42/*` packages to their TypeScript source so tests
 * transform them as project files (Vite does not transform TS inside node_modules symlinks).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@challenge42/config': resolvePath('./packages/config/src/index.ts'),
      '@challenge42/types': resolvePath('./packages/types/src/index.ts'),
      '@challenge42/validation': resolvePath('./packages/validation/src/index.ts'),
      '@challenge42/domain': resolvePath('./packages/domain/src/index.ts'),
    },
  },
  test: {
    // Node-runnable unit tests: shared packages + the mobile data layer (no RN render harness here).
    include: ['packages/**/*.test.ts', 'apps/mobile/src/features/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
