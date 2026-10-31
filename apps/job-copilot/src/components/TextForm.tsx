"use client";

import { useActionState, useRef } from "react";
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
          className="text-sm text-teal-700 underline-offset-4 hover:underline dark:text-teal-400"
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
        className="w-full rounded-lg border border-zinc-300 bg-transparent p-3 font-mono text-sm dark:border-zinc-700"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {state.error ? (
            <span id={errId} className="text-red-700 dark:text-red-400">
              {state.error}
            </span>
          ) : state.ok && savedLabel ? (
            <span className="text-zinc-500">{savedLabel}</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
