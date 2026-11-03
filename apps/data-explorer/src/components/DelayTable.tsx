"use client";

import { cn } from "@repo/ui/cn";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { type Dataset, dayToIso, minuteToTime } from "@/lib/dataset";
import type { SortDir, SortKey } from "@/lib/filters";
import { fmt } from "./charts";
import { LINE_NAMES } from "./FilterBar";

const COLUMNS: { key: SortKey; label: string; className: string; numeric?: boolean }[] = [
  { key: "date", label: "Date and time", className: "w-[9.5rem]" },
  { key: "station", label: "Station", className: "min-w-0 flex-1" },
  { key: "line", label: "Line", className: "w-20" },
  { key: "code", label: "Code", className: "w-20" },
  { key: "delay", label: "Delay", className: "w-16", numeric: true },
  { key: "gap", label: "Gap", className: "w-14", numeric: true },
];

const ROW_HEIGHT = 36;

/**
 * Renders only the ~20 rows in view out of up to 100k+, using ARIA table roles with
 * aria-rowcount/aria-rowindex so screen readers still know the real size and position.
 */
export function DelayTable({
  dataset,
  rows,
  sort,
  dir,
  onSort,
  virtual = true,
}: {
  dataset: Dataset;
  rows: Int32Array;
  sort: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  /** false renders every row (the case study's baseline). */
  virtual?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // TanStack Virtual returns functions that the React Compiler can't memoize; that's expected here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });
  const { cols, dict, codeDescriptions } = dataset;

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <div role="table" aria-label="Delay incidents" aria-rowcount={rows.length + 1} className="min-w-[38rem] text-sm">
        <div role="rowgroup" className="border-b border-line bg-surface-2">
          <div role="row" aria-rowindex={1} className="flex gap-3 px-3">
            {COLUMNS.map((c) => {
              const active = sort === c.key;
              return (
                <div
                  key={c.key}
                  role="columnheader"
                  aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(c.className, c.numeric && "text-right")}
                >
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1 font-medium transition-colors hover:text-fg",
                      active ? "text-fg" : "text-muted",
                    )}
                  >
                    {c.label}
                    <span aria-hidden className={cn("text-[10px]", !active && "opacity-0")}>
                      {dir === "asc" ? "▲" : "▼"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div
          ref={scrollRef}
          role="rowgroup"
          tabIndex={0}
          aria-label="Incident rows, scrollable"
          className="h-[28rem] overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        >
          {rows.length === 0 ? (
            <div role="row" aria-rowindex={2}>
              <p role="cell" className="py-16 text-center text-muted">
                No incidents match these filters.
              </p>
            </div>
          ) : (
            <div role="presentation" style={virtual ? { height: virtualizer.getTotalSize(), position: "relative" } : undefined}>
              {(virtual ? virtualizer.getVirtualItems() : Array.from(rows, (_, index) => ({ index, key: index, start: 0 }))).map((v) => {
                const i = rows[v.index];
                const code = dict.code[cols.code[i]];
                return (
                  <div
                    key={v.key}
                    role="row"
                    aria-rowindex={v.index + 2}
                    className={cn("flex items-center gap-3 border-b border-line/60 px-3 odd:bg-surface-2/30", virtual && "absolute inset-x-0")}
                    style={virtual ? { height: ROW_HEIGHT, transform: `translateY(${v.start}px)` } : { height: ROW_HEIGHT }}
                  >
                    <span role="cell" className={cn(COLUMNS[0].className, "tabular-nums text-muted")}>
                      {dayToIso(cols.day[i])} {minuteToTime(cols.minute[i])}
                    </span>
                    <span role="cell" className={cn(COLUMNS[1].className, "truncate text-fg")}>
                      {dict.station[cols.station[i]]}
                    </span>
                    <span role="cell" className={cn(COLUMNS[2].className, "truncate")} title={LINE_NAMES[dict.line[cols.line[i]]]?.long}>
                      {LINE_NAMES[dict.line[cols.line[i]]]?.short ?? dict.line[cols.line[i]]}
                    </span>
                    <span role="cell" className={cn(COLUMNS[3].className, "truncate font-mono text-xs")} title={codeDescriptions[code]}>
                      {code}
                    </span>
                    <span role="cell" className={cn(COLUMNS[4].className, "text-right tabular-nums text-fg")}>
                      {fmt.format(cols.delay[i])}
                      <span className="sr-only"> minutes</span>
                    </span>
                    <span role="cell" className={cn(COLUMNS[5].className, "text-right tabular-nums text-muted")}>
                      {fmt.format(cols.gap[i])}
                      <span className="sr-only"> minutes</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
