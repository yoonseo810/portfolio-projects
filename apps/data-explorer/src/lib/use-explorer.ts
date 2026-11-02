"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dataset } from "./dataset";
import { type Filters, parseFilters, serializeFilters } from "./filters";
import type { QueryResult } from "./query";
import { DATA_URL } from "./site";
import type { FromWorker, ToWorker } from "./worker-protocol";

export type ExplorerState = {
  dataset: Dataset | null;
  /** Result for the most recent filters the worker has answered. */
  result: QueryResult | null;
  /** True while a newer query than `result` is in flight; the UI dims instead of flashing. */
  stale: boolean;
  error: string | null;
};

/**
 * Owns the query worker. Each filter change posts a numbered query; answers to older queries are
 * dropped, so fast typing never shows results out of order.
 */
export function useExplorer(filters: Filters): ExplorerState {
  const workerRef = useRef<Worker | null>(null);
  const latestId = useRef(0);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [answer, setAnswer] = useState<{ key: string; result: QueryResult } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const keys = useRef(new Map<number, string>());

  useEffect(() => {
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
  }, []);

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
    if (dataset) send(parseFilters(new URLSearchParams(key)), key);
  }, [dataset, key, send]);

  return { dataset, result: answer?.result ?? null, stale: !!dataset && answer?.key !== key, error };
}
