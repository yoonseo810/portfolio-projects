import type { NextConfig } from "next";

/** The public origin that serves every app (the portfolio). Each app is a zone under it. */
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://portfolio-projects-wine.vercel.app";
const BASE_PATH = "/copilot";

/** Paths this app served before it moved under the portfolio domain. Old links redirect there. */
const LEGACY_PATHS = ["/", "/dashboard", "/jobs/:id"];

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  transpilePackages: ["@repo/ui"],
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Visitors reach this app through the portfolio's rewrite, so their Origin is the portfolio host.
    serverActions: { allowedOrigins: [new URL(SITE_ORIGIN).host] },
  },
  async redirects() {
    return LEGACY_PATHS.map((source) => ({
      source,
      destination: `${SITE_ORIGIN}${BASE_PATH}${source === "/" ? "" : source}`,
      basePath: false as const,
      permanent: false,
    }));
  },
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
