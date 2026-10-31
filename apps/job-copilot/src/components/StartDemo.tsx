"use client";

import { useActionState } from "react";
import { startDemo } from "@/app/actions";

export function StartDemo() {
  const [state, action, pending] = useActionState(startDemo, {});
  return (
    <form action={action} className="mt-8">
      <button
        disabled={pending}
        className="rounded-md bg-zinc-900 px-5 py-2.5 font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Starting…" : "Try it, no sign-up"}
      </button>
      <p role="status" aria-live="polite" className="mt-2 text-sm">
        {state.error ? (
          <span className="text-red-700 dark:text-red-400">{state.error}</span>
        ) : (
          <span className="text-zinc-500">Starts a private guest session. Sample data is one click away.</span>
        )}
      </p>
    </form>
  );
}
