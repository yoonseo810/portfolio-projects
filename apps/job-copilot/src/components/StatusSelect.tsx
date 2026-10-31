"use client";

import { updateStatus } from "@/app/actions";

const labels = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
} as const;

export function StatusSelect({ jobId, status }: { jobId: string; status: keyof typeof labels }) {
  return (
    <form action={updateStatus.bind(null, jobId)}>
      <label className="sr-only" htmlFor={`status-${jobId}`}>
        Application status
      </label>
      <select
        id={`status-${jobId}`}
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
      >
        {Object.entries(labels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
}
