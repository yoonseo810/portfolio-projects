"use client";

import { cn } from "@repo/ui/cn";
import { useId, useState } from "react";
import { monthLabel } from "@/lib/dataset";
import type { Ranked } from "@/lib/query";

export const fmt = new Intl.NumberFormat("en-CA");
const compact = new Intl.NumberFormat("en-CA", { notation: "compact", maximumFractionDigits: 1 });

/** Collapsible table with the same numbers as a chart, so nothing depends on seeing or hovering it. */
export function DataTable({ caption, head, rows }: { caption: string; head: [string, string]; rows: [string, number][] }) {
  return (
    <details className="mt-3 text-xs text-muted">
      <summary className="cursor-pointer select-none hover:text-fg">Show as table</summary>
      <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-line">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-surface-2 text-fg">
            <tr>
              <th scope="col" className="px-2 py-1 font-medium">{head[0]}</th>
              <th scope="col" className="px-2 py-1 text-right font-medium">{head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-t border-line">
                <td className="px-2 py-1">{k}</td>
                <td className="px-2 py-1 text-right tabular-nums">{fmt.format(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/**
 * Delay minutes by hour of day. Each bar is a toggle button that filters everything else to that
 * hour; the chart itself ignores the hour filter so the other hours stay visible for comparison.
 */
export function HourChart({ values, selected, onSelect }: { values: number[]; selected: number | null; onSelect: (hour: number | null) => void }) {
  const max = Math.max(1, ...values);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? selected;
  const peak = values.indexOf(Math.max(...values));
  return (
    <div>
      <p className="h-5 text-sm text-muted" aria-live="polite">
        {shown !== null ? (
          <>
            <span className="font-semibold text-fg tabular-nums">{fmt.format(values[shown])} min</span> at {String(shown).padStart(2, "0")}:00
          </>
        ) : (
          <>Peak at {String(peak).padStart(2, "0")}:00. Pick an hour to filter.</>
        )}
      </p>
      <div role="group" aria-label="Filter by hour of day" className="mt-2 flex h-40 items-end gap-[2px]">
        {values.map((v, h) => (
          <button
            key={h}
            type="button"
            aria-pressed={selected === h}
            aria-label={`${String(h).padStart(2, "0")}:00, ${fmt.format(v)} delay minutes`}
            onClick={() => onSelect(selected === h ? null : h)}
            onPointerEnter={() => setHover(h)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(h)}
            onBlur={() => setHover(null)}
            className="group flex h-full flex-1 items-end rounded-t-[4px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span
              className={cn(
                "w-full rounded-t-[4px] transition-[height,opacity] duration-300",
                selected === null || selected === h ? "bg-accent" : "bg-accent/30",
                "group-hover:brightness-125",
              )}
              style={{ height: `${Math.max(v ? 2 : 0, (v / max) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div aria-hidden className="mt-1 flex justify-between text-[11px] text-muted tabular-nums">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
      <DataTable caption="Delay minutes by hour of day" head={["Hour", "Delay minutes"]} rows={values.map((v, h) => [`${String(h).padStart(2, "0")}:00`, v])} />
    </div>
  );
}

/** Monthly delay minutes as a line, with a crosshair that follows the pointer or the arrow keys. */
export function MonthChart({ data }: { data: { month: number; minutes: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const W = 640;
  const H = 180;
  const pad = { l: 44, r: 12, t: 12, b: 24 };
  if (!data.length) return <p className="py-16 text-center text-sm text-muted">No incidents match these filters.</p>;
  const max = Math.max(1, ...data.map((d) => d.minutes));
  const x = (i: number) => pad.l + (data.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (data.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.minutes).toFixed(1)}`).join("");
  const ticks = [0, Math.round(max / 2), max];
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const cur = active !== null ? data[active] : null;

  const nearest = (clientX: number, rect: DOMRect) => {
    const sx = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round(((sx - pad.l) / (W - pad.l - pad.r)) * (data.length - 1));
    return Math.min(data.length - 1, Math.max(0, i));
  };

  return (
    <div>
      <p className="h-5 text-sm text-muted" aria-live="polite">
        {cur ? (
          <>
            <span className="font-semibold text-fg tabular-nums">{fmt.format(cur.minutes)} min</span> in {monthLabel(cur.month)}
          </>
        ) : (
          <>Hover or use the arrow keys to read a month.</>
        )}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 h-auto w-full touch-none overflow-visible rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        role="img"
        aria-labelledby={titleId}
        tabIndex={0}
        onPointerMove={(e) => setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const d = e.key === "ArrowRight" ? 1 : -1;
            setActive((a) => Math.min(data.length - 1, Math.max(0, (a ?? (d > 0 ? -1 : data.length)) + d)));
          }
        }}
      >
        <title id={titleId}>
          {`Delay minutes per month, ${monthLabel(data[0].month)} to ${monthLabel(data[data.length - 1].month)}. Highest: ${fmt.format(max)} minutes.`}
        </title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-muted text-[11px]">
              {compact.format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.month} x={x(i)} y={H - 6} textAnchor="middle" className="fill-muted text-[11px]">
              {monthLabel(d.month)}
            </text>
          ) : null,
        )}
        <path d={path} fill="none" className="stroke-accent" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {cur && active !== null && (
          <g>
            <line x1={x(active)} x2={x(active)} y1={pad.t} y2={H - pad.b} className="stroke-muted" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(active)} cy={y(cur.minutes)} r={5} className="fill-accent stroke-surface" strokeWidth={2} />
          </g>
        )}
      </svg>
      <DataTable caption="Delay minutes per month" head={["Month", "Delay minutes"]} rows={data.map((d) => [monthLabel(d.month), d.minutes])} />
    </div>
  );
}

/** Horizontal ranking. Each row is a toggle that filters to that item. */
export function RankedBars({
  items,
  selected,
  onSelect,
  label,
  describe,
}: {
  items: Ranked[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  label: string;
  describe?: (key: string) => string | undefined;
}) {
  if (!items.length) return <p className="py-8 text-center text-sm text-muted">Nothing to rank.</p>;
  const max = items[0].minutes || 1;
  return (
    <ol aria-label={label} className="space-y-1.5">
      {items.map((it) => {
        const on = selected?.toLowerCase() === it.key.toLowerCase();
        const desc = describe?.(it.key);
        return (
          <li key={it.key}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(on ? null : it.key)}
              title={desc}
              className={cn(
                "group relative block w-full overflow-hidden rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-2",
                on && "ring-1 ring-accent",
              )}
            >
              <span aria-hidden className="absolute inset-y-0 left-0 rounded-r-[4px] bg-accent/15 transition-[width] duration-300 group-hover:bg-accent/25" style={{ width: `${(it.minutes / max) * 100}%` }} />
              <span className="relative flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-fg">
                  {it.key}
                  {desc && <span className="ml-1.5 text-xs text-muted">{desc}</span>}
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  <span className="font-medium text-fg">{fmt.format(it.minutes)}</span> min · {fmt.format(it.count)}
                  <span className="sr-only"> incidents</span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
