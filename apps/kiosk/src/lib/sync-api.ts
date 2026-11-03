import { z } from "zod";

/** What a kiosk uploads: one confirmed check-in. Shared by the client and the route handler. */
export const UploadSchema = z.object({
  fleetId: z.string().min(8).max(64),
  kioskId: z.string().min(1).max(64),
  record: z.object({
    id: z.uuid(),
    code: z.string().regex(/^[A-Z0-9]{6}$/),
    flightId: z.string().min(1).max(16),
    createdAt: z.number().int().positive(),
    passengers: z
      .array(
        z.object({
          id: z.string().min(1).max(16),
          first: z.string().max(80),
          last: z.string().max(80),
          seat: z.string().regex(/^\d{1,2}[A-F]$/),
          bags: z.number().int().min(0).max(2),
        }),
      )
      .min(1)
      .max(9),
  }),
});
export type Upload = z.infer<typeof UploadSchema>;

export type SeatConflict = { passengerId: string; seat: string; reason: "seat_taken" | "already_checked_in" };

/** The server's answer. `replayed` means it had already stored this check-in and is repeating its result. */
export type UploadResult = { status: "ok" | "conflict"; conflicts: SeatConflict[]; replayed: boolean };

/** Seats this fleet's kiosks have already given out, so every kiosk can grey them out. */
export type FleetSeat = { flightId: string; seat: string; code: string; passengerId: string };
