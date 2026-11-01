"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * On/off switch for settings that apply immediately (WAI-ARIA switch pattern).
 * Space or Enter toggles it; use a Checkbox for choices submitted with a form.
 */
export function Switch({
  label,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  className,
}: {
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [internal, setInternal] = useState(defaultChecked);
  const on = checked ?? internal;
  const labelId = useId();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => {
          if (checked === undefined) setInternal(!on);
          onCheckedChange?.(!on);
        }}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-55",
          on ? "border-accent bg-accent" : "border-line-strong bg-surface-2",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
            on ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
      <span id={labelId} className="text-sm font-medium text-fg">
        {label}
      </span>
    </div>
  );
}
