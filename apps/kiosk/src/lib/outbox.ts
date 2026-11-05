import type { CheckinRecord } from "./checkin";
import type { SeatConflict, UploadResult } from "./sync-api";

/**
 * Every confirmed check-in goes into an IndexedDB outbox first and is uploaded from there, so a
 * check-in made offline (or one whose upload failed halfway) survives a reload and is sent later.
 */
export type OutboxStatus = "pending" | "synced" | "conflict";

export type OutboxEntry = {
  record: CheckinRecord;
  status: OutboxStatus;
  attempts: number;
  /** Don't try again before this time (ms). */
  retryAt: number;
  conflicts: SeatConflict[];
  syncedAt?: number;
  lastError?: string;
};

export const newEntry = (record: CheckinRecord): OutboxEntry => ({
  record,
  status: "pending",
  attempts: 0,
  retryAt: 0,
  conflicts: [],
});

/** 1 s, 2 s, 4 s … capped at 30 s, so a long outage doesn't hammer the server when it returns. */
export function backoffMs(attempts: number): number {
  return Math.min(30_000, 1000 * 2 ** Math.max(0, attempts - 1));
}

export function applyResult(e: OutboxEntry, r: UploadResult, now: number): OutboxEntry {
  return { ...e, status: r.status === "ok" ? "synced" : "conflict", conflicts: r.conflicts, syncedAt: now, lastError: undefined };
}

export function applyFailure(e: OutboxEntry, error: string, now: number): OutboxEntry {
  const attempts = e.attempts + 1;
  return { ...e, attempts, retryAt: now + backoffMs(attempts), lastError: error };
}

/** Pending uploads that are due, oldest first. */
export const due = (entries: OutboxEntry[], now: number) =>
  entries.filter((e) => e.status === "pending" && e.retryAt <= now).sort((a, b) => a.record.createdAt - b.record.createdAt);

// ---- IndexedDB -------------------------------------------------------------------------------

const DB_NAME = "kiosk";
const STORE = "outbox";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "record.id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req ? req.result : undefined);
        };
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export const outbox = {
  all: async () => ((await run("readonly", (s) => s.getAll())) ?? []) as OutboxEntry[],
  put: (e: OutboxEntry) => run("readwrite", (s) => void s.put(e)),
  clear: () => run("readwrite", (s) => void s.clear()),
};
