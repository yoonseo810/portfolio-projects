import { cn } from "./cn";

/** Loading indicator with an accessible name. Prefer a Skeleton when the layout is known. */
export function Spinner({ label = "Loading", size = 16, className }: { label?: string; size?: number; className?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center", className)}>
      <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} className="animate-spin text-accent">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
