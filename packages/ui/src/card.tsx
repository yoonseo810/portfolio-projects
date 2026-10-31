import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Card({
  interactive = false,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "surface-sheen rounded-2xl border border-line bg-surface",
        interactive && "glow-hover",
        className,
      )}
      {...props}
    />
  );
}
