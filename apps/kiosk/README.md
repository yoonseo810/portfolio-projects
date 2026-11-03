# Kiosk Check-in

A touch-first self-service check-in kiosk for a made-up airline, Harbourline Air.

**Live:** https://portfolio-projects-wine.vercel.app/kiosk (a zone under the portfolio domain, once deployed)

## What it does

1. **Find a booking** by confirmation code and any traveller's last name, typed on the on-screen keyboard or a real one. Sample bookings cover a family, a premium traveller, a booking where one person already checked in, and a flight whose check-in has closed.
2. **Choose travellers** to check in now.
3. **Pick seats** on a seat map. The group is seated together automatically. Children can't take exit-row seats, and adults confirm the exit-row rules first.
4. **Add bags** (up to 2 each).
5. **Confirm** and get one boarding pass per traveller, with a QR code in the IATA BCBP layout.

Every screen works in English and French, and the language can change at any step. After 60 seconds without a touch, the kiosk asks if you're still there, then starts over after 20 seconds so the next person never sees your booking.

## Accessibility

- Touch targets are at least 44 px, and most are 56 px.
- Focus moves to each screen's heading, so screen readers announce where you are.
- The seat map is an ARIA grid with one tab stop. Arrow keys, Home and End move between seats, and each seat's label says its type and whether it's free, taken or held for someone in your group. Taken seats show an ×, so colour is never the only signal.
- axe passes on every screen, in both themes, at desktop and phone widths.

## Offline-first

A kiosk can't stop working when the airport Wi-Fi drops, so nothing on the check-in path needs the network.

- **The app is cached.** A service worker (`public/sw.js`) serves the page from cache when the network is down, and keeps hashed scripts cache-first. Flights and bookings ship in the bundle, so lookups work offline too.
- **Check-ins go to an outbox first.** Confirming writes the check-in to IndexedDB (`src/lib/outbox.ts`) and prints the boarding passes straight away. The outbox uploads in the background, oldest first, retrying with backoff (1 s, 2 s, 4 s … up to 30 s). It survives a reload or a crash.
- **Uploads are idempotent.** Each check-in carries an id made on the kiosk. The server stores it once, and any retry of the same id gets the stored answer back (`src/server/checkins.ts`), so a request that times out after the server saved it can't double-book.
- **The database settles seat clashes.** Two kiosks that are both offline can give the same seat away. Primary keys on (fleet, flight, seat) and (fleet, booking, traveller) decide it: the first upload keeps the seat, and the later one is flagged in the staff panel for an agent.
- **Online kiosks share seats.** Every 15 s, an online kiosk pulls the seats other kiosks gave out and greys them out, so clashes only happen when kiosks are offline.

**Try it:** open the kiosk in two tabs (two kiosks). Turn on **Simulate offline** in both staff panels, check in the Tremblay family in one tab and give Priya Patel one of their seats in the other, then turn both back online.

A "fleet" is one browser, so visitors never see each other's check-ins. Without `DATABASE_URL`, the outbox keeps check-ins on the device and the staff panel says the sync server isn't set up.

## Code

- `src/lib/checkin.ts`: the whole flow as a pure reducer (who can sit where, when you can continue, what a reset clears).
- `src/lib/seats.ts`: seat layout, sold seats per flight, and group seating.
- `src/lib/flights.ts`: sample flights and bookings, and booking lookup with the 45-minute check-in cutoff.
- `src/lib/boarding-pass.ts`: the 60-character BCBP barcode text.
- `src/lib/i18n.ts`: English and French strings. A test checks that both have the same keys.
- `src/lib/outbox.ts` and `src/components/useKioskSync.ts`: the IndexedDB outbox and the upload loop.
- `src/server/checkins.ts`: idempotent saves and conflict detection. Its tests run the real migration on PGlite, an in-process Postgres.

## Run it

```bash
pnpm --filter kiosk dev   # http://localhost:3004/kiosk, or via the portfolio at http://localhost:3000/kiosk
pnpm --filter kiosk test
```
