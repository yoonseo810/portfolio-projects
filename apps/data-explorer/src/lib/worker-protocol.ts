import type { Dataset } from "./dataset";
import type { Filters } from "./filters";
import type { QueryResult } from "./query";

export type ToWorker = { type: "load"; url: string } | { type: "query"; id: number; filters: Filters };

export type FromWorker =
  | { type: "ready"; dataset: Dataset }
  | { type: "result"; id: number; result: QueryResult }
  | { type: "error"; message: string };
