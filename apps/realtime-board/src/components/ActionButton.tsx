"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions";

export function ActionButton({
  action,
  label,
  pendingLabel,
}: {
  action: () => Promise<ActionState>;
  label: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState>(action, {});
  return (
    <form action={formAction} className="flex flex-col items-center gap-3 sm:items-start">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? pendingLabel : label}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
