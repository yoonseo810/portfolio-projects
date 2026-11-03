"use client";

import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/cn";
import { AIRLINE } from "@/lib/flights";
import { useI18n } from "./I18n";

/** Each screen's title. Focus moves here when the screen changes (see Kiosk). */
export function StepHeading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mb-6">
      <h1 data-step-heading tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none sm:text-3xl">
        {title}
      </h1>
      {body && <p className="mt-2 text-base text-muted sm:text-lg">{body}</p>}
    </div>
  );
}

export function Welcome({ onStart, offline }: { onStart: () => void; offline: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
      <h1 data-step-heading tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none sm:text-5xl">
        {t.welcomeTitle(AIRLINE)}
      </h1>
      <p className="max-w-md text-lg text-muted">{t.welcomeBody}</p>
      <Button className="h-16 px-10 text-xl" onClick={onStart}>
        {t.start}
      </Button>
      {offline && <p className="max-w-md text-base text-muted">{t.offlineNote}</p>}
    </div>
  );
}

/** A large stepper button for touch screens. */
export function RoundButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-14 w-14 items-center justify-center rounded-full border border-line-strong bg-surface text-2xl font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
