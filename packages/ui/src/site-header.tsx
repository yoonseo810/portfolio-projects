import type { ReactNode } from "react";
import { cn } from "./cn";
import { ThemeToggle } from "./theme";

/** Gradient monogram used as the brand mark in every app. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-[11px] font-bold text-white shadow-[0_4px_16px_-4px_var(--glow)]",
        className,
      )}
    >
      MS
    </span>
  );
}

/** Sticky translucent top bar with brand, optional nav and the theme toggle. */
export function SiteHeader({
  brand,
  href = "/",
  children,
  maxWidth = "max-w-5xl",
}: {
  brand: string;
  href?: string;
  children?: ReactNode;
  maxWidth?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className={cn("mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6", maxWidth)}>
        <a href={href} className="flex items-center gap-2.5 font-semibold tracking-tight">
          <LogoMark />
          <span>{brand}</span>
        </a>
        <div className="flex items-center gap-2 sm:gap-4">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
