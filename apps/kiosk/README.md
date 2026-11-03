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

## Code

- `src/lib/checkin.ts`: the whole flow as a pure reducer (who can sit where, when you can continue, what a reset clears).
- `src/lib/seats.ts`: seat layout, sold seats per flight, and group seating.
- `src/lib/flights.ts`: sample flights and bookings, and booking lookup with the 45-minute check-in cutoff.
- `src/lib/boarding-pass.ts`: the 60-character BCBP barcode text.
- `src/lib/i18n.ts`: English and French strings. A test checks that both have the same keys.

## Run it

```bash
pnpm --filter kiosk dev   # http://localhost:3004/kiosk, or via the portfolio at http://localhost:3000/kiosk
pnpm --filter kiosk test
```

## Next

Offline-first: a service worker caches the app and the day's flights, check-ins queue in IndexedDB and sync when the network returns, and the server resolves two kiosks selling the same seat.
