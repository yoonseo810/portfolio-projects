import { cn } from "./cn";

/** Placeholder block shown while content loads. Decorative: announce loading elsewhere (e.g. aria-busy on the region). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-surface-2", className)} />;
}
