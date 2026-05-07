import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // typedRoutes type-checks every <Link href> against the existing route tree.
  // Off until Phase 2 routes (projects/new, team, section-library, etc.) are
  // built — turning it on now would block every commit that references a
  // route before the page exists.
  typedRoutes: false,

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
