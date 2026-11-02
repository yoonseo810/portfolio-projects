/// <reference lib="webworker" />
import { type Dataset, type DatasetFile, decode } from "@/lib/dataset";
import type { Filters } from "@/lib/filters";
import { runQuery } from "@/lib/query";
import type { FromWorker, ToWorker } from "@/lib/worker-protocol";

// Parsing and every query run here, so typing in a filter never blocks scrolling or input.
let ds: Dataset | null = null;

const post = (msg: FromWorker, transfer: Transferable[] = []) => (self as DedicatedWorkerGlobalScope).postMessage(msg, transfer);

self.onmessage = async (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  try {
    if (msg.type === "load") {
      const res = await fetch(msg.url);
      if (!res.ok) throw new Error(`Dataset request failed (${res.status})`);
      ds = decode((await res.json()) as DatasetFile);
      post({ type: "ready", dataset: ds });
      return;
    }
    if (!ds) throw new Error("Dataset not loaded");
    const result = runQuery(ds, msg.filters as Filters);
    post({ type: "result", id: msg.id, result }, [result.rows.buffer]);
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
