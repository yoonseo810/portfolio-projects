/**
 * Benchmark modes for the performance case study. `?perf=<mode>` turns optimizations off one at a
 * time, cumulatively, so each step's effect can be measured in the same build:
 *   baseline  row objects, queried on the main thread, every row rendered
 *   virtual   + virtualized table
 *   columnar  + typed-array columns and a single-pass query
 *   shipped   + Web Worker (the default)
 */
export type PerfMode = "baseline" | "virtual" | "columnar" | "shipped";

export type PerfConfig = {
  label: string;
  engine: "rows" | "columnar";
  thread: "main" | "worker";
  table: "full" | "virtual";
};

export const PERF_MODES: Record<PerfMode, PerfConfig> = {
  baseline: { label: "Baseline", engine: "rows", thread: "main", table: "full" },
  virtual: { label: "+ Virtualized table", engine: "rows", thread: "main", table: "virtual" },
  columnar: { label: "+ Columnar query", engine: "columnar", thread: "main", table: "virtual" },
  shipped: { label: "+ Web Worker (shipped)", engine: "columnar", thread: "worker", table: "virtual" },
};

export const PERF_ORDER = Object.keys(PERF_MODES) as PerfMode[];

export const parsePerfMode = (value: string | null): PerfMode => (value && value in PERF_MODES ? (value as PerfMode) : "shipped");
