import { cn } from "./cn";

/** Shared look for text inputs, textareas and selects. */
export function fieldClass(className?: string) {
  return cn(
    "w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted/70",
    "transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15",
    "aria-[invalid=true]:border-danger",
    className,
  );
}
