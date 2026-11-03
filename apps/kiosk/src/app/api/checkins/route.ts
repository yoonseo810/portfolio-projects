import { NextResponse } from "next/server";
import { db } from "@/db";
import { UploadSchema } from "@/lib/sync-api";
import { fleetSeats, saveCheckin } from "@/server/checkins";

const configured = () => !!process.env.DATABASE_URL;
const unavailable = () => NextResponse.json({ error: "Sync server isn't configured" }, { status: 503 });

/** Uploads one check-in from a kiosk's outbox. Safe to retry: the same id always gets the same answer. */
export async function POST(request: Request) {
  if (!configured()) return unavailable();
  const parsed = UploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid check-in" }, { status: 400 });
  try {
    return NextResponse.json(await saveCheckin(db, parsed.data));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Couldn't save the check-in" }, { status: 500 });
  }
}

/** Seats this fleet's kiosks have given out. */
export async function GET(request: Request) {
  if (!configured()) return unavailable();
  const fleet = new URL(request.url).searchParams.get("fleet") ?? "";
  if (fleet.length < 8 || fleet.length > 64) return NextResponse.json({ error: "Missing fleet" }, { status: 400 });
  return NextResponse.json({ seats: await fleetSeats(db, fleet) }, { headers: { "Cache-Control": "no-store" } });
}
