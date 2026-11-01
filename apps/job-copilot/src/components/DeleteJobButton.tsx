"use client";

import { unstable_rethrow } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { buttonClass } from "@repo/ui/button";
import { cn } from "@repo/ui/cn";
import { deleteJob } from "@/app/actions";

type Props = {
  jobId: string;
  /** Used in the accessible label, e.g. "Delete Frontend Engineer at Acme". */
  label: string;
  /** Set on the job's own page: after deleting, go back to the dashboard. */
  fromDetail?: boolean;
  className?: string;
};

/** Two-step delete: the first press asks, the second removes. Escape cancels. */
export function DeleteJobButton({ jobId, label, fromDetail = false, className }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Move focus with the swap so keyboard users don't lose their place.
  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
    else if (wasConfirming.current) triggerRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setFailed(false);
          setConfirming(true);
        }}
        aria-label={`Delete ${label}`}
        title="Delete"
        className={buttonClass({
          variant: "ghost",
          size: "sm",
          className: cn("px-2 hover:text-danger", className),
        })}
      >
        <TrashIcon />
        {fromDetail && <span>Delete</span>}
        {failed && (
          <span role="alert" className="text-danger">
            Failed, try again
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Confirm deleting ${label}`}
      className={cn("flex items-center gap-1.5", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !pending) setConfirming(false);
      }}
    >
      <button
        ref={confirmRef}
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await deleteJob(jobId, fromDetail);
            } catch (err) {
              // The redirect back to the dashboard arrives as a thrown error; let Next handle it.
              unstable_rethrow(err);
              setFailed(true);
              setConfirming(false);
            }
          })
        }
        className={buttonClass({ variant: "danger", size: "sm" })}
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className={buttonClass({ variant: "ghost", size: "sm" })}
      >
        Cancel
      </button>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  );
}
