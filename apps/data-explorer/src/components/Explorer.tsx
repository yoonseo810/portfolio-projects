"use client";

import { Alert } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";
import { cn } from "@repo/ui/cn";
import { Skeleton } from "@repo/ui/skeleton";
import { Spinner } from "@repo/ui/spinner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useTransition } from "react";
import { type Filters, parseFilters, type SortKey, serializeFilters } from "@/lib/filters";
import { useExplorer } from "@/lib/use-explorer";
import { fmt, HourChart, MonthChart, RankedBars } from "./charts";
import { DelayTable } from "./DelayTable";
import { FilterBar } from "./FilterBar";

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("min-w-0 p-5", className)}>
      <h2 className="text-sm font-semibold tracking-tight text-fg">{title}</h2>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

export function Explorer() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const filters = parseFilters(new URLSearchParams(params.toString()));
  const { dataset, result, stale, error } = useExplorer(filters);

  const paramsString = params.toString();
  const update = useCallback(
    (patch: Partial<Filters>) => {
      const next = serializeFilters({ ...parseFilters(new URLSearchParams(paramsString)), ...patch });
      startTransition(() => router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false }));
    },
    [paramsString, pathname, router],
  );

  const onSort = (key: SortKey) =>
    update({ sort: key, dir: filters.sort === key ? (filters.dir === "asc" ? "desc" : "asc") : key === "station" || key === "line" || key === "code" ? "asc" : "desc" });

  if (error) {
    return (
      <Alert tone="danger" title="Couldn't load the data" live>
        {error}. Refresh to try again.
      </Alert>
    );
  }

  if (!dataset || !result) {
    return (
      <div aria-busy="true" className="space-y-4">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner label="Loading" /> Loading {dataset ? "results" : "incidents"}…
        </p>
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { summary } = result;
  return (
    <div className="space-y-4">
      {dataset.meta.source === "sample" && (
        <Alert tone="warning" title="Showing synthetic sample data">
          The layout, filters and charts are real, but these incidents are generated. The TTC export replaces them on the next deploy.
        </Alert>
      )}

      <FilterBar dataset={dataset} filters={filters} onChange={update} />

      {/* Results keep their last render, dimmed, while a newer query runs: no flash, no layout jump. */}
      <div className={cn("space-y-4 transition-opacity", stale && "opacity-60")} aria-busy={stale}>
        <p role="status" className="text-sm text-muted">
          <span className="font-medium text-fg">{fmt.format(summary.incidents)}</span> of {fmt.format(dataset.size)} incidents match.
          <span className="ml-2 inline-block">
            <Badge tone="neutral">Filtered in {result.tookMs < 1 ? "<1" : Math.round(result.tookMs)} ms</Badge>
          </span>
        </p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Incidents" value={fmt.format(summary.incidents)} />
          <Stat label="Total delay" value={`${fmt.format(Math.round(summary.totalDelay / 60))} h`} hint={`${fmt.format(summary.totalDelay)} minutes`} />
          <Stat label="Median delay" value={`${summary.medianDelay} min`} />
          <Stat label="90th percentile" value={`${summary.p90Delay} min`} hint="9 in 10 incidents are shorter" />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <Panel title="Delay minutes by month" className="lg:col-span-3">
            <MonthChart data={result.byMonth} />
          </Panel>
          <Panel title="Delay minutes by hour of day" className="lg:col-span-2">
            <HourChart values={result.byHour} selected={filters.hour} onSelect={(hour) => update({ hour })} />
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Stations with the most delay">
            <RankedBars label="Stations ranked by delay minutes" items={result.topStations} selected={filters.station} onSelect={(station) => update({ station })} />
          </Panel>
          <Panel title="Most common causes">
            <RankedBars
              label="Delay codes ranked by delay minutes"
              items={result.topCodes}
              selected={filters.code}
              onSelect={(code) => update({ code })}
              describe={(c) => dataset.codeDescriptions[c]}
            />
          </Panel>
        </div>

        <Panel title="Incidents">
          <DelayTable dataset={dataset} rows={result.rows} sort={filters.sort} dir={filters.dir} onSort={onSort} />
        </Panel>
      </div>

      <p className="text-xs text-muted">
        Source:{" "}
        <a href={dataset.meta.sourceUrl} className="underline decoration-line-strong underline-offset-4 hover:text-fg">
          City of Toronto Open Data, TTC Subway Delay Data
        </a>
        . {dataset.meta.attribution}{" "}
        <a href={dataset.meta.licenseUrl} className="underline decoration-line-strong underline-offset-4 hover:text-fg">
          Licence
        </a>
        .
      </p>
    </div>
  );
}
