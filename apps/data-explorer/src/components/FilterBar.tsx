"use client";

import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/cn";
import { fieldClass } from "@repo/ui/field";
import { useEffect, useId, useState } from "react";
import { type Dataset, dayToIso } from "@/lib/dataset";
import { activeFilterCount, type Filters } from "@/lib/filters";

const MIN_DELAYS = [0, 5, 10, 30];

/** Display names for the normalized Line values (see scripts/build-data.mjs). */
export const LINE_NAMES: Record<string, { short: string; long: string }> = {
  YU: { short: "Line 1", long: "Line 1 Yonge-University" },
  BD: { short: "Line 2", long: "Line 2 Bloor-Danforth" },
  SHP: { short: "Line 4", long: "Line 4 Sheppard" },
  MULTI: { short: "Multiple", long: "Incidents affecting more than one line" },
  OTHER: { short: "Other", long: "Other or unrecorded line" },
};
const LINE_ORDER = Object.keys(LINE_NAMES);

/** One row of filters above everything they scope. Every change is written to the URL. */
export function FilterBar({ dataset, filters, onChange }: { dataset: Dataset; filters: Filters; onChange: (patch: Partial<Filters>) => void }) {
  const ids = { from: useId(), to: useId(), station: useId(), code: useId(), min: useId(), list: useId() };
  const { day } = dataset.cols;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < day.length; i++) {
    if (day[i] < lo) lo = day[i];
    if (day[i] > hi) hi = day[i];
  }
  const minDate = dayToIso(lo);
  const maxDate = dayToIso(hi);
  const years = Array.from({ length: Number(maxDate.slice(0, 4)) - Number(minDate.slice(0, 4)) + 1 }, (_, i) => Number(minDate.slice(0, 4)) + i);

  // Station search is debounced so each keystroke doesn't rewrite the URL and history.
  const [station, setStation] = useState(filters.station ?? "");
  const [lastExternal, setLastExternal] = useState(filters.station);
  if (filters.station !== lastExternal) {
    setLastExternal(filters.station);
    setStation(filters.station ?? "");
  }
  useEffect(() => {
    const value = station.trim() || null;
    if (value === filters.station) return;
    const t = setTimeout(() => onChange({ station: value }), 250);
    return () => clearTimeout(t);
  }, [station, filters.station, onChange]);

  const preset = (from: string | null, to: string | null) => onChange({ from, to });
  const isPreset = (from: string | null, to: string | null) => filters.from === from && filters.to === to;
  const count = activeFilterCount(filters);

  return (
    <section aria-label="Filters" className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <fieldset className="flex flex-wrap items-end gap-2">
          <legend className="mb-1.5 text-xs font-medium text-muted">Date range</legend>
          <div role="group" aria-label="Date presets" className="flex rounded-lg border border-line-strong p-0.5">
            {[["All", null, null] as const, ...years.map((y) => [String(y), `${y}-01-01`, `${y}-12-31`] as const)].map(([label, from, to]) => (
              <button
                key={label}
                type="button"
                aria-pressed={isPreset(from, to)}
                onClick={() => preset(from, to)}
                className="h-8 rounded-md px-2.5 text-sm text-muted transition-colors hover:text-fg aria-pressed:bg-surface-2 aria-pressed:font-medium aria-pressed:text-fg"
              >
                {label}
              </button>
            ))}
          </div>
          <label htmlFor={ids.from} className="sr-only">
            From
          </label>
          <input id={ids.from} type="date" min={minDate} max={maxDate} value={filters.from ?? ""} onChange={(e) => onChange({ from: e.target.value || null })} className={fieldClass("h-9 w-auto! py-1")} />
          <span aria-hidden className="pb-2 text-muted">
            –
          </span>
          <label htmlFor={ids.to} className="sr-only">
            To
          </label>
          <input id={ids.to} type="date" min={minDate} max={maxDate} value={filters.to ?? ""} onChange={(e) => onChange({ to: e.target.value || null })} className={fieldClass("h-9 w-auto! py-1")} />
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-muted">Line</legend>
          <div className="flex flex-wrap gap-1">
            {[...dataset.dict.line]
              .sort((a, b) => (LINE_ORDER.indexOf(a) + 1 || 99) - (LINE_ORDER.indexOf(b) + 1 || 99))
              .map((l) => {
                const on = filters.lines.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange({ lines: on ? filters.lines.filter((x) => x !== l) : [...filters.lines, l] })}
                    title={LINE_NAMES[l]?.long}
                    className={cn(
                      "h-9 rounded-lg border px-3 text-sm font-medium whitespace-nowrap transition-colors",
                      on ? "border-accent bg-accent/10 text-fg" : "border-line-strong text-muted hover:text-fg",
                    )}
                  >
                    {LINE_NAMES[l]?.short ?? l}
                  </button>
                );
              })}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="min-w-48 flex-1">
          <label htmlFor={ids.station} className="mb-1.5 block text-xs font-medium text-muted">
            Station
          </label>
          <input
            id={ids.station}
            type="search"
            list={ids.list}
            value={station}
            onChange={(e) => setStation(e.target.value)}
            placeholder="e.g. Union"
            className={fieldClass("h-9 py-1")}
          />
          <datalist id={ids.list}>
            {dataset.dict.station.slice(0, 400).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div className="min-w-48 flex-1">
          <label htmlFor={ids.code} className="mb-1.5 block text-xs font-medium text-muted">
            Delay code
          </label>
          <select id={ids.code} value={filters.code ?? ""} onChange={(e) => onChange({ code: e.target.value || null })} className={fieldClass("h-9 py-1")}>
            <option value="">All codes</option>
            {[...dataset.dict.code].sort().map((c) => (
              <option key={c} value={c}>
                {c}
                {dataset.codeDescriptions[c] ? ` – ${dataset.codeDescriptions[c]}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={ids.min} className="mb-1.5 block text-xs font-medium text-muted">
            Minimum delay
          </label>
          <select id={ids.min} value={filters.minDelay} onChange={(e) => onChange({ minDelay: Number(e.target.value) })} className={fieldClass("h-9 w-auto! py-1")}>
            {MIN_DELAYS.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? "Any" : `${m}+ min`}
              </option>
            ))}
          </select>
        </div>
        {filters.hour !== null && (
          <Button variant="secondary" size="sm" className="h-9" onClick={() => onChange({ hour: null })}>
            {String(filters.hour).padStart(2, "0")}:00 only ✕<span className="sr-only">, remove hour filter</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          disabled={count === 0}
          onClick={() => onChange({ from: null, to: null, lines: [], station: null, code: null, hour: null, minDelay: 0 })}
        >
          Reset{count ? ` (${count})` : ""}
        </Button>
      </div>
    </section>
  );
}
