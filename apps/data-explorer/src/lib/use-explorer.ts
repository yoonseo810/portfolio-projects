"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Row, runQueryNaive, toRows } from "./baseline";
import { type Dataset, type DatasetFile, decode } from "./dataset";
import { type Filters, parseFilters, serializeFilters } from "./filters";
import type { PerfConfig } from "./perf-mode";
import { type QueryResult, runQuery } from "./query";
import { DATA_URL } from "./site";
import type { FromWorker, ToWorker } from "./worker-protocol";

export type ExplorerState = {
  dataset: Dataset | null;
  /** Result for the most recent filters the worker has answered. */
  result: QueryResult | null;
  /** True while a newer query than `result` is in flight; the UI dims instead of flashing. */
  stale: boolean;
  /** Serialized filters that `result` answers; changes whenever a new result is shown. */
  resultKey: string | null;
  error: string | null;
};

/**
 * Owns the query worker. Each filter change posts a numbered query; answers to older queries are
 * dropped, so fast typing never shows results out of order.
 *
 * With a benchmark mode whose thread is "main" (see perf-mode.ts), loading and querying run on the
 * main thread instead, the way the case study's "before" versions work.
 */
export function useExplorer(filters: Filters, perf: PerfConfig): ExplorerState {
  const workerRef = useRef<Worker | null>(null);
  const latestId = useRef(0);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [answer, setAnswer] = useState<{ key: string; result: QueryResult } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const keys = useRef(new Map<number, string>());
  const rowsRef = useRef<Row[] | null>(null);
  const onMain = perf.thread === "main";

  useEffect(() => {
    if (!onMain) return;
    let cancelled = false;
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Dataset request failed (${res.status})`);
        return res.json() as Promise<DatasetFile>;
      })
      .then((file) => {
        if (cancelled) return;
        const ds = decode(file);
        rowsRef.current = perf.engine === "rows" ? toRows(ds) : null;
        setDataset(ds);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
    return () => {
      cancelled = true;
    };
  }, [onMain, perf.engine]);

  useEffect(() => {
    if (onMain) return;
    const worker = new Worker(new URL("../workers/query.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<FromWorker>) => {
      const msg = e.data;
      if (msg.type === "ready") setDataset(msg.dataset);
      else if (msg.type === "error") setError(msg.message);
      else if (msg.id === latestId.current) setAnswer({ key: keys.current.get(msg.id) ?? "", result: msg.result });
    };
    worker.onerror = () => setError("The data worker failed to start.");
    worker.postMessage({ type: "load", url: DATA_URL } satisfies ToWorker);
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [onMain]);

  const key = serializeFilters(filters);

  const send = useCallback((f: Filters, k: string) => {
    const id = ++latestId.current;
    keys.current.clear();
    keys.current.set(id, k);
    workerRef.current?.postMessage({ type: "query", id, filters: f } satisfies ToWorker);
  }, []);

  // Filters are re-parsed from the URL on every render, so key the effect on their serialized form
  // (parse and serialize round-trip exactly; see filters.test.ts).
  useEffect(() => {
    if (!dataset) return;
    const f = parseFilters(new URLSearchParams(key));
    if (!onMain) {
      send(f, key);
      return;
    }
    // Main-thread modes block here on purpose: that cost is what the case study measures.
    const result = rowsRef.current ? runQueryNaive(rowsRef.current, f) : runQuery(dataset, f);
    setAnswer({ key, result });
  }, [dataset, key, send, onMain]);

  return { dataset, result: answer?.result ?? null, stale: !!dataset && answer?.key !== key, resultKey: answer?.key ?? null, error };
}
