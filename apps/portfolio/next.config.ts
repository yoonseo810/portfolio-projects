import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://portfolio-projects-wine.vercel.app";

/**
 * Accepts a zone URL as typed into Vercel ("x.vercel.app", "https://x.vercel.app/", ".../explorer")
 * and returns just its origin. Refuses the portfolio's own host, which would make /path rewrite to itself forever.
 */
function zoneOrigin(raw: string, name: string): string {
  const value = raw.trim();
  const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  if (url.host === new URL(SITE_ORIGIN).host) {
    throw new Error(`${name} points at the portfolio itself (${url.host}). Set it to that app's own deployment URL.`);
  }
  return url.origin;
}

const env = (name: string) => (process.env[name]?.trim() ? zoneOrigin(process.env[name]!, name) : undefined);

/**
 * Multi-zones: the portfolio is the public front door and proxies each app's base path to that
 * app's own deployment. One host means one Supabase session cookie, so one sign-in covers every app.
 */
const ZONES = [
  { path: "/copilot", origin: env("COPILOT_URL") ?? (dev ? "http://localhost:3001" : "https://portfolio-projects-xdrt.vercel.app") },
  { path: "/board", origin: env("BOARD_URL") ?? (dev ? "http://localhost:3002" : "https://portfolio-projects-j5mr.vercel.app") },
  // Set EXPLORER_URL in the portfolio's Vercel project once the explorer has its own deployment.
  ...(env("EXPLORER_URL") || dev ? [{ path: "/explorer", origin: env("EXPLORER_URL") ?? "http://localhost:3003" }] : []),
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
