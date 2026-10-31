"use client";

import { useActionState } from "react";
import { buttonClass } from "@repo/ui/button";
import type { ActionState } from "@/app/actions";

export function ActionButton({
  action,
  label,
  pendingLabel,
  align = "center",
}: {
  action: () => Promise<ActionState>;
  label: string;
  pendingLabel: string;
  align?: "center" | "start";
}) {
  const [state, formAction, pending] = useActionState<ActionState>(action, {});
  return (
    <form action={formAction} className={`flex flex-col gap-3 ${align === "center" ? "items-center" : "items-start"}`}>
      <button type="submit" disabled={pending} className={buttonClass({ size: "lg" })}>
        {pending ? pendingLabel : label}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
