"use client";

import { useActionState } from "react";
import { buttonClass } from "@repo/ui/button";
import { startDemo } from "@/app/actions";

export function StartDemo() {
  const [state, action, pending] = useActionState(startDemo, {});
  return (
    <form action={action} className="mt-8 flex flex-col items-center gap-3">
      <button disabled={pending} className={buttonClass({ size: "lg" })}>
        {pending ? "Starting…" : "Try it, no sign-up"}
      </button>
      <p role="status" aria-live="polite" className="text-sm">
        {state.error ? (
          <span className="text-danger">{state.error}</span>
        ) : (
          <span className="text-muted">Starts a private guest session. Sample data is one click away.</span>
        )}
      </p>
    </form>
  );
}
