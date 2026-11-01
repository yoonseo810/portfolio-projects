"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * Modal dialog built on the native <dialog> element, which gives a real focus
 * trap, an inert background and Escape-to-close for free. Focus goes back to
 * whatever opened it when it closes.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Action buttons, rendered bottom-right. */
  footer?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={(e) => {
        // The close event is queued; ignore a stale one if the dialog has already reopened.
        if (e.currentTarget.open) return;
        returnTo.current?.focus();
        if (open) onClose();
      }}
      onKeyDown={(e) => {
        // Close through state so the parent stays the source of truth.
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> itself.
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl",
        "backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-1 text-sm text-muted">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </dialog>
  );
}
