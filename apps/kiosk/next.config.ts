import type { NextConfig } from "next";

/** The public origin that serves every app (the portfolio). This app is a zone under it. */
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://portfolio-projects-wine.vercel.app";
const BASE_PATH = "/kiosk";

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
        // The page lives at /kiosk (no trailing slash), which is outside the default scope of
        // /kiosk/sw.js, so the worker has to be allowed to control it explicitly.
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: BASE_PATH },
          { key: "Cache-Control", value: "no-cache" },
        ],
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
