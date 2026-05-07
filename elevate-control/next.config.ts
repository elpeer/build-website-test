import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Next.js 15.5+ moved typedRoutes out of experimental
  typedRoutes: true,

  // Tell Next.js this folder is the workspace root — silences the warning
  // about a sibling lockfile in the parent monorepo (elevate-control lives
  // inside the larger build-website-test repo).
  outputFileTracingRoot: path.join(__dirname),

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  eslint: {
    // Lint blocks Vercel build by default — relax it (we still run lint locally)
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
