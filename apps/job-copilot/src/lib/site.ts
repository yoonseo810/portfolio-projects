/** This app's base path under the portfolio domain (keep in sync with next.config.ts). */
export const BASE_PATH = "/copilot";
/** Public origin every app is served from. Fallback for building auth redirect URLs. */
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://portfolio-projects-wine.vercel.app";

/** Only same-app relative paths, so a crafted `next` can't send someone to another site. */
export function safeNext(value: unknown): string {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}
