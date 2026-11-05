"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CheckinRecord } from "@/lib/checkin";
import { applyFailure, applyResult, due, newEntry, outbox, type OutboxEntry } from "@/lib/outbox";
import { BASE_PATH } from "@/lib/site";
import type { FleetSeat, Upload, UploadResult } from "@/lib/sync-api";

const API = `${BASE_PATH}/api/checkins`;
/** How often an online kiosk refreshes the seats other kiosks gave out. */
const PULL_MS = 15_000;

export type ServerState = "unknown" | "ok" | "unconfigured" | "error";

/** Stable ids: the fleet is this browser (shared by its tabs), the kiosk is this tab. */
function ids() {
  const get = (s: Storage, key: string, make: () => string) => {
    try {
      const v = s.getItem(key) ?? make();
      s.setItem(key, v);
      return v;
    } catch {
      return make();
    }
  };
  return {
    fleet: get(localStorage, "kiosk-fleet", () => crypto.randomUUID()),
    kiosk: get(sessionStorage, "kiosk-id", () => `K-${crypto.randomUUID().slice(0, 4).toUpperCase()}`),
  };
}

export function useKioskSync() {
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  const [remote, setRemote] = useState<FleetSeat[]>([]);
  const [browserOnline, setBrowserOnline] = useState(true);
  const [simulated, setSimulatedState] = useState(false);
  const [server, setServer] = useState<ServerState>("unknown");
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [kioskId, setKioskId] = useState("");

  const id = useRef<{ fleet: string; kiosk: string } | null>(null);
  const list = useRef<OutboxEntry[]>([]);
  const busy = useRef(false);
  const retry = useRef<ReturnType<typeof setTimeout>>(undefined);
  const again = useRef<() => void>(() => {});
  const online = browserOnline && !simulated;
  const onlineRef = useRef(online);
  useEffect(() => {
    onlineRef.current = online;
  });

  const save = useCallback(async (e: OutboxEntry) => {
    list.current = [...list.current.filter((x) => x.record.id !== e.record.id), e];
    setEntries(list.current);
    await outbox.put(e).catch(() => {});
  }, []);

  const pull = useCallback(async () => {
    if (!onlineRef.current || !id.current) return;
    try {
      const res = await fetch(`${API}?fleet=${encodeURIComponent(id.current.fleet)}`, { cache: "no-store" });
      if (res.status === 503) return setServer("unconfigured");
      if (!res.ok) return setServer("error");
      setRemote(((await res.json()) as { seats: FleetSeat[] }).seats);
      setServer("ok");
    } catch {
      // Offline or unreachable: keep the last seats we saw.
    }
  }, []);

  /** Uploads every due check-in, oldest first, then refreshes the fleet's seats. */
  const flush = useCallback(async () => {
    if (busy.current || !onlineRef.current || !id.current) return;
    busy.current = true;
    clearTimeout(retry.current);
    try {
      for (const e of due(list.current, Date.now())) {
        if (!onlineRef.current) break;
        const body: Upload = { fleetId: id.current.fleet, kioskId: id.current.kiosk, record: e.record };
        try {
          const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          if (res.status === 503) setServer("unconfigured");
          if (!res.ok) throw new Error(`Server answered ${res.status}`);
          await save(applyResult(e, (await res.json()) as UploadResult, Date.now()));
          setServer("ok");
          setLastSync(Date.now());
        } catch (err) {
          await save(applyFailure(e, err instanceof Error ? err.message : "Upload failed", Date.now()));
        }
      }
      await pull();
    } finally {
      busy.current = false;
    }
    // Come back when the earliest failed upload is due again.
    const next = list.current.filter((e) => e.status === "pending").map((e) => e.retryAt);
    if (next.length) retry.current = setTimeout(() => again.current(), Math.max(500, Math.min(...next) - Date.now()));
  }, [pull, save]);

  useEffect(() => {
    again.current = () => void flush();
  }, [flush]);

  // Load the outbox and ids once, then track the browser's connection.
  useEffect(() => {
    id.current = ids();
    void outbox
      .all()
      .then((all) => {
        list.current = all;
        setEntries(all);
      })
      .catch(() => {})
      .finally(() => {
        setKioskId(id.current!.kiosk);
        setBrowserOnline(navigator.onLine);
        try {
          setSimulatedState(sessionStorage.getItem("kiosk-offline") === "1");
        } catch {}
      });
    const up = () => setBrowserOnline(true);
    const down = () => setBrowserOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
      clearTimeout(retry.current);
    };
  }, []);

  // Whenever the kiosk comes (back) online, send what's waiting; keep the seat list fresh.
  useEffect(() => {
    if (!online || !kioskId) return;
    void flush();
    const t = setInterval(() => void flush(), PULL_MS);
    return () => clearInterval(t);
  }, [online, kioskId, flush]);

  const enqueue = useCallback(
    async (record: CheckinRecord) => {
      await save(newEntry(record));
      void flush();
    },
    [save, flush],
  );

  const setSimulated = (on: boolean) => {
    setSimulatedState(on);
    try {
      sessionStorage.setItem("kiosk-offline", on ? "1" : "0");
    } catch {}
  };

  const clear = async () => {
    list.current = [];
    setEntries([]);
    await outbox.clear().catch(() => {});
  };

  /** Retry everything now instead of waiting out the backoff. */
  const syncNow = () => {
    list.current = list.current.map((e) => (e.status === "pending" ? { ...e, retryAt: 0 } : e));
    void flush();
  };

  return { entries, remote, online, browserOnline, simulated, setSimulated, server, lastSync, kioskId, enqueue, syncNow, clear };
}

export type KioskSync = ReturnType<typeof useKioskSync>;
