"use client";

import { cloneElement, useId, useState, type ReactElement, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * Short supplementary label shown on hover and keyboard focus (WAI-ARIA tooltip).
 * The trigger gets aria-describedby, Escape dismisses it, and it stays open while
 * hovered so it can be read (WCAG 1.4.13). Never put essential info only here.
 */
export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: ReactNode;
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      {cloneElement(children, { "aria-describedby": id })}
      <span
        role="tooltip"
        id={id}
        hidden={!open}
        className={cn(
          "absolute left-1/2 z-40 w-max max-w-xs -translate-x-1/2 rounded-md border border-line-strong bg-surface-2 px-2 py-1 text-xs text-fg shadow-lg",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {content}
      </span>
    </span>
  );
}
