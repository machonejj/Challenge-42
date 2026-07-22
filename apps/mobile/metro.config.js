// Metro config for the Challenge42 monorepo.
// Teaches Metro to (1) watch the repo root so it can resolve the symlinked `@challenge42/*`
// workspace packages (whose `main` points at TypeScript source Metro transpiles), and
// (2) look in both the app-local and hoisted root `node_modules`.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Prefer a single React instance from the hoisted root to avoid duplicate-React issues.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
