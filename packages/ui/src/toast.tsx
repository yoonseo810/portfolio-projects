"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "./cn";

export type ToastTone = "neutral" | "success" | "danger";
type Toast = { id: number; title: ReactNode; description?: ReactNode; tone: ToastTone };
type Notify = (toast: { title: ReactNode; description?: ReactNode; tone?: ToastTone }) => void;

const ToastContext = createContext<Notify | null>(null);

/** Call `useToast()(...)` anywhere under a <ToastProvider> to show a brief message. */
export function useToast(): Notify {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used inside <ToastProvider>");
  return notify;
}

const tones: Record<ToastTone, string> = {
  neutral: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
};

/**
 * Renders toasts in a polite live region (bottom-right), so screen readers announce
 * them without stealing focus. Each auto-dismisses after `duration` ms but pauses
 * while hovered or focused, and has its own close button.
 */
export function ToastProvider({ children, duration = 5000 }: { children: ReactNode; duration?: number }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const notify = useCallback<Notify>(({ title, description, tone = "neutral" }) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((list) => [...list.slice(-2), { id, title, description, tone }]);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} duration={duration} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, duration, onDismiss }: { toast: Toast; duration: number; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [paused, duration, onDismiss]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line-strong bg-surface p-4 text-sm shadow-xl"
    >
      <span aria-hidden className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", tones[toast.tone])} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-fg">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-m-1 rounded p-1 text-muted hover:bg-surface-2 hover:text-fg"
      >
        <svg aria-hidden viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
