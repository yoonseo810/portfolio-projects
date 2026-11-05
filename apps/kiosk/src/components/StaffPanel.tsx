"use client";

import { useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Switch } from "@repo/ui/switch";
import { FLIGHTS } from "@/lib/flights";
import type { OutboxEntry } from "@/lib/outbox";
import type { KioskSync } from "./useKioskSync";

const time = (ms: number) => new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(ms);
const flightNumber = (id: string) => FLIGHTS.find((f) => f.id === id)?.number ?? id;

/**
 * What an agent or technician would see on the back of the kiosk: connection, outbox and conflicts.
 * "Simulate offline" lets visitors try the offline path without browser dev tools.
 */
export function StaffPanel({ sync }: { sync: KioskSync }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const count = (s: OutboxEntry["status"]) => sync.entries.filter((e) => e.status === s).length;
  const recent = [...sync.entries].sort((a, b) => b.record.createdAt - a.record.createdAt).slice(0, 8);

  return (
    <section aria-labelledby="staff-title" className="mx-auto mt-8 w-full max-w-3xl rounded-2xl border border-dashed border-line-strong p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="staff-title" className="text-lg font-semibold tracking-tight">
            Staff panel
          </h2>
          <p className="text-sm text-muted">
            Kiosk {sync.kioskId || "…"}. Open this page in another tab to add a second kiosk.
          </p>
        </div>
        <Badge tone={sync.online ? "success" : "warning"} dot>
          {sync.online ? "Online" : sync.simulated ? "Offline (simulated)" : "Offline"}
        </Badge>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Switch label="Simulate offline" checked={sync.simulated} onCheckedChange={sync.setSimulated} />
        <Button variant="secondary" size="sm" disabled={!sync.online || !count("pending")} onClick={sync.syncNow}>
          Sync now
        </Button>
        {confirmClear ? (
          <span className="flex items-center gap-2 text-sm">
            Remove this kiosk&apos;s check-ins from this browser?
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                void sync.clear();
                setConfirmClear(false);
              }}
            >
              Remove
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
          </span>
        ) : (
          <Button variant="ghost" size="sm" disabled={!sync.entries.length} onClick={() => setConfirmClear(true)}>
            Clear this kiosk
          </Button>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Stat term="Waiting to send" value={count("pending")} />
        <Stat term="Synced" value={count("synced")} />
        <Stat term="Needs an agent" value={count("conflict")} />
      </dl>

      <p className="mt-3 text-xs text-muted" role="status">
        {sync.server === "unconfigured"
          ? "The sync server isn't set up on this deployment, so check-ins stay on this device."
          : sync.lastSync
            ? `Last upload at ${time(sync.lastSync)}`
            : "Nothing uploaded yet."}
      </p>

      {recent.length > 0 && (
        <div role="region" aria-label="Recent check-ins" tabIndex={0} className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Recent check-ins on this kiosk</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-2 font-medium">Time</th>
                <th scope="col" className="py-2 font-medium">Booking</th>
                <th scope="col" className="py-2 font-medium">Seats</th>
                <th scope="col" className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((e) => (
                <tr key={e.record.id} className="border-t border-line align-top">
                  <td className="py-2 tabular-nums">{time(e.record.createdAt)}</td>
                  <th scope="row" className="py-2 font-medium">
                    {e.record.code} · {flightNumber(e.record.flightId)}
                  </th>
                  <td className="py-2 font-mono">{e.record.passengers.map((p) => p.seat).join(", ")}</td>
                  <td className="py-2">
                    <Status entry={e} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ term, value }: { term: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <dt className="text-xs text-muted">{term}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Status({ entry: e }: { entry: OutboxEntry }) {
  if (e.status === "synced") return <Badge tone="success">Synced</Badge>;
  if (e.status === "pending")
    return (
      <span>
        <Badge tone="warning">Waiting</Badge>
        {e.lastError && <span className="mt-1 block text-xs text-muted">Try {e.attempts}: {e.lastError}</span>}
      </span>
    );
  return (
    <span>
      <Badge tone="danger">Needs an agent</Badge>
      {e.conflicts.map((c) => {
        const p = e.record.passengers.find((x) => x.id === c.passengerId);
        return (
          <span key={c.passengerId} className="mt-1 block text-xs text-muted">
            {p?.first} {p?.last}: {c.reason === "seat_taken" ? `seat ${c.seat} went to another kiosk first` : "already checked in on another kiosk"}
          </span>
        );
      })}
    </span>
  );
}
