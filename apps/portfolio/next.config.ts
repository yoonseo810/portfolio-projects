import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

/**
 * Multi-zones: the portfolio is the public front door and proxies each app's base path to that
 * app's own deployment. One host means one Supabase session cookie, so one sign-in covers every app.
 */
const ZONES = [
  { path: "/copilot", origin: process.env.COPILOT_URL ?? (dev ? "http://localhost:3001" : "https://portfolio-projects-xdrt.vercel.app") },
  { path: "/board", origin: process.env.BOARD_URL ?? (dev ? "http://localhost:3002" : "https://portfolio-projects-j5mr.vercel.app") },
];

const nextConfig: NextConfig = {
  async rewrites() {
    return ZONES.flatMap(({ path, origin }) => [
      { source: path, destination: `${origin}${path}` },
      { source: `${path}/:path+`, destination: `${origin}${path}/:path+` },
    ]);
  },
  transpilePackages: ["@repo/ui"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
