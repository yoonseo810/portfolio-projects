"use client";

import type { Dispatch } from "react";
import { cn } from "@repo/ui/cn";
import type { Action, State } from "@/lib/checkin";
import { useI18n } from "./I18n";
import { StepHeading } from "./parts";

export function Travellers({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const { t } = useI18n();
  return (
    <div>
      <StepHeading title={t.travellersTitle} body={t.travellersBody} />
      <ul className="grid gap-3">
        {state.booking!.passengers.map((p) => {
          const on = state.selected.includes(p.id);
          const done = !!p.checkedIn;
          return (
            <li key={p.id}>
              <label
                className={cn(
                  "flex min-h-20 items-center gap-4 rounded-2xl border p-4 transition-colors",
                  done ? "border-line bg-surface-2 text-muted" : on ? "cursor-pointer border-accent bg-accent/10" : "cursor-pointer border-line-strong hover:bg-surface-2",
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={done}
                  onChange={() => dispatch({ type: "toggle", passengerId: p.id })}
                  className="h-7 w-7 shrink-0 accent-[var(--accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-medium text-fg">
                    {p.first} {p.last}
                  </span>
                  <span className="block text-sm text-muted">
                    {done ? t.alreadyCheckedIn(p.checkedIn!.seat) : [t.cabin[p.cabin], p.type === "child" && t.child].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
