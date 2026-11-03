"use client";

import type { State } from "@/lib/checkin";
import { formatTime } from "@/lib/i18n";
import { useI18n } from "./I18n";
import { StepHeading } from "./parts";

export function Review({ state }: { state: State }) {
  const { t, locale } = useI18n();
  const { flight } = state.booking!;
  return (
    <div>
      <StepHeading title={t.reviewTitle} body={t.reviewBody} />
      <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-line-strong p-5 sm:grid-cols-4">
        <Item term={t.flight} value={flight.number} />
        <Item term={t.departs} value={`${flight.from.code} ${formatTime(flight.departs, locale)}`} />
        <Item term={t.boards} value={formatTime(flight.boards, locale)} />
        <Item term={t.gate} value={flight.gate} />
      </dl>
      <p className="mt-3 text-muted">
        {flight.from.city} → {flight.to.city}
      </p>
      <table className="mt-6 w-full text-left text-lg">
        <caption className="sr-only">{t.steps.passengers}</caption>
        <thead className="text-sm text-muted">
          <tr>
            <th scope="col" className="pb-2 font-medium">
              {t.steps.passengers}
            </th>
            <th scope="col" className="pb-2 font-medium">
              {t.seat}
            </th>
            <th scope="col" className="pb-2 text-right font-medium">
              {t.bags}
            </th>
          </tr>
        </thead>
        <tbody>
          {state.selected.map((id) => {
            const p = state.booking!.passengers.find((x) => x.id === id)!;
            return (
              <tr key={id} className="border-t border-line">
                <th scope="row" className="py-3 font-medium">
                  {p.first} {p.last}
                </th>
                <td className="py-3 font-mono">{state.seats[id]}</td>
                <td className="py-3 text-right tabular-nums">{state.bags[id] ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Item({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{term}</dt>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
    </div>
  );
}
