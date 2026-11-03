"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { useI18n } from "./I18n";

/** After this long without a touch or key press, ask if the traveller is still there. */
export const IDLE_MS = 60_000;
/** Then start over after this many seconds, clearing their booking from the screen. */
export const COUNTDOWN_S = 20;

export function IdleGuard({ active, onTimeout }: { active: boolean; onTimeout: () => void }) {
  const { t } = useI18n();
  const [left, setLeft] = useState<number | null>(null);
  const timeout = useRef(onTimeout);
  useEffect(() => {
    timeout.current = onTimeout;
  });

  const dismiss = () => setLeft(null);

  // Restart the idle timer on every interaction while a session is open.
  useEffect(() => {
    if (!active) return;
    let idle: ReturnType<typeof setTimeout>;
    const prompt = () => setLeft(COUNTDOWN_S);
    const arm = () => {
      clearTimeout(idle);
      idle = setTimeout(prompt, IDLE_MS);
    };
    arm();
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    return () => {
      clearTimeout(idle);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [active]);

  // Count down once the prompt is showing; at zero, start over.
  useEffect(() => {
    if (left === null) return;
    const id = setTimeout(() => {
      if (left > 1) return setLeft(left - 1);
      setLeft(null);
      timeout.current();
    }, 1000);
    return () => clearTimeout(id);
  }, [left]);

  return (
    <Dialog
      open={active && left !== null}
      onClose={dismiss}
      title={t.idleTitle}
      description={t.idleBody(left ?? COUNTDOWN_S)}
      footer={
        <>
          <Button variant="secondary" className="h-12 px-5" onClick={() => { dismiss(); onTimeout(); }}>
            {t.startOver}
          </Button>
          <Button className="h-12 px-5" onClick={dismiss}>
            {t.stillHere}
          </Button>
        </>
      }
    />
  );
}
