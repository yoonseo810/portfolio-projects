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
