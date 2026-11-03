"use client";

import type { Dispatch } from "react";
import { type Action, MAX_BAGS, type State } from "@/lib/checkin";
import { useI18n } from "./I18n";
import { RoundButton, StepHeading } from "./parts";

export function Bags({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const { t } = useI18n();
  return (
    <div>
      <StepHeading title={t.bagsTitle} body={t.bagsBody} />
      <ul className="grid gap-3">
        {state.selected.map((id) => {
          const p = state.booking!.passengers.find((x) => x.id === id)!;
          const n = state.bags[id] ?? 0;
          const name = `${p.first} ${p.last}`;
          const set = (count: number) => dispatch({ type: "bags", passengerId: id, count });
          return (
            <li key={id} className="flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-line-strong p-4">
              <span className="text-lg font-medium">{name}</span>
              <span className="flex items-center gap-3">
                <RoundButton aria-label={t.removeBag(name)} disabled={n === 0} onClick={() => set(n - 1)}>
                  −
                </RoundButton>
                <output aria-live="polite" className="w-20 text-center text-lg tabular-nums">
                  {t.bagCount(n)}
                </output>
                <RoundButton aria-label={t.addBag(name)} disabled={n >= MAX_BAGS} onClick={() => set(n + 1)}>
                  +
                </RoundButton>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
