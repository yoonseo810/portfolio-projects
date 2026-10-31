import { cn } from "./cn";

/** Decorative hero background: dotted grid plus a soft accent glow. Place inside a `relative` parent. */
export function Backdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden", className)}>
      <div className="bg-grid absolute inset-0" />
      <div className="absolute left-1/2 top-[-12rem] h-[28rem] w-[56rem] max-w-[140vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)] blur-2xl" />
    </div>
  );
}
