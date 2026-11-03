import type { CheckinRecord } from "./checkin";
import { type CheckinLedger, ledgerKey } from "./flights";
import { soldSeats } from "./seats";
import type { FleetSeat } from "./sync-api";

/**
 * What one kiosk knows about a flight: seats sold elsewhere, its own check-ins (synced or not),
 * and the seats other kiosks in the fleet reported the last time it was online.
 */
export function takenSeats(flightId: string, local: CheckinRecord[], remote: FleetSeat[]): Set<string> {
  const set = soldSeats(flightId);
  for (const c of local) if (c.flightId === flightId) c.passengers.forEach((p) => set.add(p.seat));
  for (const s of remote) if (s.flightId === flightId) set.add(s.seat);
  return set;
}

/** Travellers already checked in on any kiosk this one has heard from. */
export function fleetLedger(local: CheckinRecord[], remote: FleetSeat[]): CheckinLedger {
  return {
    ...Object.fromEntries(remote.map((s) => [ledgerKey(s.code, s.passengerId), s.seat])),
    ...Object.fromEntries(local.flatMap((c) => c.passengers.map((p) => [ledgerKey(c.code, p.id), p.seat]))),
  };
}
