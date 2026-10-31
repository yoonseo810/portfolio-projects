"use client";

import { useActionState, useRef } from "react";
import { buttonClass } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { fieldClass } from "@repo/ui/field";
import type { FormState } from "@/app/actions";

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  name: string;
  label: string;
  defaultValue?: string;
  sample: string;
  submitLabel: string;
  pendingLabel: string;
  savedLabel?: string;
  rows?: number;
};

export function TextForm({
  action,
  name,
  label,
  defaultValue,
  sample,
  submitLabel,
  pendingLabel,
  savedLabel,
  rows = 10,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLTextAreaElement>(null);
  const id = `${name}-input`;
  const errId = `${name}-error`;

  return (
    <Card className="p-5 sm:p-6">
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <button
          type="button"
          onClick={() => {
            if (ref.current) ref.current.value = sample;
          }}
          className={buttonClass({ variant: "ghost", size: "sm", className: "text-accent" })}
        >
          Use sample
        </button>
      </div>
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        aria-invalid={!!state.error}
        aria-describedby={state.error ? errId : undefined}
        className={fieldClass("font-mono leading-relaxed")}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass()}
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {state.error ? (
            <span id={errId} className="text-danger">
              {state.error}
            </span>
          ) : state.ok && savedLabel ? (
            <span className="text-success">{savedLabel}</span>
          ) : null}
        </p>
      </div>
    </form>
    </Card>
  );
}
