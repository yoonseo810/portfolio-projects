"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";

export type TabItem = { id: string; label: ReactNode; content: ReactNode };

/**
 * Accessible tabs (WAI-ARIA tabs pattern, automatic activation).
 * Arrow keys move between tabs, Home/End jump to the ends, and only the
 * selected tab is in the tab order so Tab moves straight into the panel.
 */
export function Tabs({
  items,
  label,
  defaultValue,
  value,
  onValueChange,
  className,
}: {
  items: TabItem[];
  /** Accessible name for the tab list, e.g. "Code examples". */
  label: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  className?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id);
  const selected = value ?? internal;
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function select(index: number) {
    const item = items[index];
    if (!item) return;
    if (value === undefined) setInternal(item.id);
    onValueChange?.(item.id);
    refs.current[index]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    select(next);
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1">
        {items.map((item, i) => {
          const active = item.id === selected;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${item.id}`}
              aria-selected={active}
              aria-controls={`${base}-panel-${item.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--line-strong)]" : "text-muted hover:text-fg",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-panel-${item.id}`}
          aria-labelledby={`${base}-tab-${item.id}`}
          hidden={item.id !== selected}
          tabIndex={0}
          className="mt-4 rounded-lg"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
