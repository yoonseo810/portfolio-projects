import type { NextConfig } from "next";

/** The public origin that serves every app (the portfolio). This app is a zone under it. */
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://portfolio-projects-wine.vercel.app";
const BASE_PATH = "/explorer";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  transpilePackages: ["@repo/ui"],
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    // The app's own deployment URL sends visitors to the portfolio domain.
    return [{ source: "/", destination: `${SITE_ORIGIN}${BASE_PATH}`, basePath: false as const, permanent: false }];
  },
  async headers() {
    return [
      {
        // The dataset only changes on deploy, so let browsers and the CDN keep it for a day.
        source: "/data/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
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
