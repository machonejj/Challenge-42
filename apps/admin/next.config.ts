import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Transpile the workspace packages (shipped as TypeScript source) for the Next build.
  transpilePackages: [
    '@challenge42/config',
    '@challenge42/types',
    '@challenge42/domain',
    '@challenge42/validation',
  ],
};

export default nextConfig;
