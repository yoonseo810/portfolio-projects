import type { ReactNode } from "react";
import { cn } from "./cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

const tones: Record<AlertTone, { box: string; icon: string }> = {
  info: { box: "border-accent/30 bg-accent/10", icon: "text-accent" },
  success: { box: "border-success/30 bg-success/10", icon: "text-success" },
  warning: { box: "border-warning/30 bg-warning/10", icon: "text-warning" },
  danger: { box: "border-danger/30 bg-danger/10", icon: "text-danger" },
};

const paths: Record<AlertTone, string> = {
  info: "M12 16v-4M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
  success: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3",
  warning: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  danger: "M12 8v4M12 16h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
};

/**
 * Inline message about the page or a form. Static by default; pass `live` when it
 * appears in response to an action so screen readers announce it (danger interrupts,
 * the rest wait politely).
 */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  live = false,
  className,
}: {
  tone?: AlertTone;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  live?: boolean;
  className?: string;
}) {
  const role = live ? (tone === "danger" ? "alert" : "status") : undefined;
  return (
    <div role={role} className={cn("flex gap-3 rounded-xl border p-4 text-sm", tones[tone].box, className)}>
      <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("mt-0.5 shrink-0", tones[tone].icon)}>
        <path d={paths[tone]} />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-fg">{title}</p>
        {children && <div className="mt-1 text-muted">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
