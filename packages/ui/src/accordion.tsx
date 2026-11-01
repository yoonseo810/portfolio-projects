import type { ReactNode } from "react";
import { cn } from "./cn";

export type AccordionItem = { id: string; title: ReactNode; content: ReactNode };

/**
 * Disclosure list built on native <details>/<summary>: keyboard support, find-in-page
 * and no-JS behavior come free. Pass `name` to allow only one open item at a time.
 */
export function Accordion({
  items,
  name,
  defaultOpen,
  className,
}: {
  items: AccordionItem[];
  /** Shared name makes the items exclusive (opening one closes the others). */
  name?: string;
  defaultOpen?: string;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface", className)}>
      {items.map((item) => (
        <details key={item.id} name={name} open={item.id === defaultOpen} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-fg hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
            {item.title}
            <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted transition-transform group-open:rotate-180">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="px-4 pb-4 text-sm text-muted">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
