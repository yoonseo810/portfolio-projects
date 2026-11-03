"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { bcbp } from "@/lib/boarding-pass";
import type { CheckinRecord } from "@/lib/checkin";
import { AIRLINE, type Booking } from "@/lib/flights";
import { formatTime } from "@/lib/i18n";
import { useI18n } from "./I18n";
import { StepHeading } from "./parts";

export function BoardingPasses({ record, booking, checkins }: { record: CheckinRecord; booking: Booking; checkins: CheckinRecord[] }) {
  const { t } = useI18n();
  // Boarding sequence numbers count every traveller this kiosk has checked in on the flight.
  const before = checkins
    .slice(0, checkins.indexOf(record))
    .filter((c) => c.flightId === record.flightId)
    .reduce((n, c) => n + c.passengers.length, 0);
  return (
    <div>
      <StepHeading title={t.doneTitle} body={t.doneBody} />
      <ul className="grid gap-5">
        {record.passengers.map((p, i) => (
          <li key={p.id}>
            <Pass passenger={p} booking={booking} sequence={before + i + 1} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pass({ passenger: p, booking, sequence }: { passenger: CheckinRecord["passengers"][number]; booking: Booking; sequence: number }) {
  const { t, locale } = useI18n();
  const { flight } = booking;
  const cabin = booking.passengers.find((x) => x.id === p.id)!.cabin;
  const [svg, setSvg] = useState("");
  const name = `${p.first} ${p.last}`;

  useEffect(() => {
    const text = bcbp({ ...p, code: booking.code, from: flight.from.code, to: flight.to.code, flight: flight.number, departs: flight.departs, cabin, sequence });
    QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M" }).then(setSvg, () => setSvg(""));
  }, [p, booking.code, flight, cabin, sequence]);

  return (
    <article aria-label={t.passFor(name)} className="overflow-hidden rounded-2xl border border-line-strong">
      <div className="flex items-center justify-between bg-gradient-to-r from-accent to-accent-2 px-5 py-3 text-white">
        <span className="font-semibold">{AIRLINE}</span>
        <span className="text-sm">
          {t.boardingPass} · {t.cabin[cabin]}
        </span>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-xl font-semibold">{name}</p>
          <dl className="mt-4 grid grid-cols-3 gap-4">
            <Field term={t.from} value={flight.from.code} sub={flight.from.city} />
            <Field term={t.to} value={flight.to.code} sub={flight.to.city} />
            <Field term={t.flight} value={flight.number} />
            <Field term={t.seat} value={p.seat} big />
            <Field term={t.gate} value={flight.gate} big />
            <Field term={t.boards} value={formatTime(flight.boards, locale)} big />
          </dl>
        </div>
        {/* Scanners need dark modules on white, whatever the theme. */}
        <div
          role="img"
          aria-label={t.barcode}
          className="mx-auto h-40 w-40 shrink-0 rounded-xl bg-white p-1 [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </article>
  );
}

function Field({ term, value, sub, big }: { term: string; value: string; sub?: string; big?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted uppercase">{term}</dt>
      <dd className={big ? "text-2xl font-semibold" : "text-lg font-medium"}>
        {value}
        {sub && <span className="block text-xs font-normal text-muted">{sub}</span>}
      </dd>
    </div>
  );
}
