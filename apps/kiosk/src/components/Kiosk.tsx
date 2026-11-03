"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/cn";
import { canAdvance, initialState, makeRecord, PROGRESS, reducer } from "@/lib/checkin";
import { fleetLedger, takenSeats } from "@/lib/fleet";
import { AIRLINE, lookupBooking } from "@/lib/flights";
import { type Locale, LOCALES } from "@/lib/i18n";
import { Bags } from "./Bags";
import { BoardingPasses } from "./BoardingPasses";
import { FindBooking } from "./FindBooking";
import { I18nProvider, useI18n } from "./I18n";
import { IdleGuard } from "./IdleGuard";
import { Review } from "./Review";
import { SeatMap } from "./SeatMap";
import { StaffPanel } from "./StaffPanel";
import { Travellers } from "./Travellers";
import { type KioskSync, useKioskSync } from "./useKioskSync";
import { Welcome } from "./parts";

export const BIG = "h-14 px-8 text-lg";

/** The kiosk screen plus the staff panel that shows its outbox and connection. */
export function KioskStation() {
  const [locale, setLocale] = useState<Locale>("en");
  const sync = useKioskSync();
  return (
    <>
      <I18nProvider locale={locale}>
        <KioskScreen locale={locale} setLocale={setLocale} sync={sync} />
      </I18nProvider>
      <StaffPanel sync={sync} />
    </>
  );
}

function KioskScreen({ locale, setLocale, sync }: { locale: Locale; setLocale: (l: Locale) => void; sync: KioskSync }) {
  const { t } = useI18n();
  const [s, dispatch] = useReducer(reducer, initialState);
  const checkins = useMemo(() => sync.entries.map((e) => e.record).sort((a, b) => a.createdAt - b.createdAt), [sync.entries]);
  const waiting = sync.entries.filter((e) => e.status === "pending").length;
  /** Sample departure times count from when the kiosk was first used, so they don't drift. */
  const anchor = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const flightId = s.booking?.flight.id;
  const taken = useMemo(() => takenSeats(flightId ?? "", checkins, sync.remote), [flightId, checkins, sync.remote]);
  const ledger = useMemo(() => fleetLedger(checkins, sync.remote), [checkins, sync.remote]);

  // Each screen starts with its heading focused, so screen readers announce where they are.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    root.current?.querySelector<HTMLElement>("[data-step-heading]")?.focus();
  }, [s.step]);

  const reset = () => {
    dispatch({ type: "reset" });
    setLocale("en");
  };

  const find = (code: string, last: string) => {
    const now = Date.now();
    anchor.current ??= now;
    const result = lookupBooking(code, last, { now, anchor: anchor.current, ledger });
    const sold = result.ok ? takenSeats(result.booking.flight.id, checkins, sync.remote) : new Set<string>();
    dispatch({ type: "lookup", result, taken: sold });
  };

  const confirm = () => {
    const record = makeRecord(s, crypto.randomUUID(), Date.now());
    // Saved to the device first; the outbox uploads it now or whenever the network is back.
    void sync.enqueue(record);
    dispatch({ type: "confirmed", record });
  };

  const stepIndex = PROGRESS.indexOf(s.step);
  const inFlow = s.step !== "welcome";

  return (
    <div
      ref={root}
      lang={locale}
      className="mx-auto flex min-h-[40rem] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_30px_80px_-40px_var(--glow)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <PlaneMark />
          <div>
            <p className="font-semibold tracking-tight">{AIRLINE}</p>
            <p className="text-xs text-muted">{t.brandTag}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p role="status" className={cn("text-sm", sync.online && !waiting && "sr-only")}>
            {!sync.online ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 font-medium text-warning">
                <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
                {t.offline}
                {waiting > 0 && ` · ${t.waiting(waiting)}`}
              </span>
            ) : waiting > 0 ? (
              <span className="text-muted">{t.waiting(waiting)}</span>
            ) : null}
          </p>
          <div role="group" aria-label={t.chooseLanguage} className="flex rounded-xl border border-line p-1">
            {LOCALES.map((l) => (
              <button
                key={l.id}
                type="button"
                lang={l.id}
                aria-pressed={locale === l.id}
                onClick={() => setLocale(l.id)}
                className={cn(
                  "h-11 rounded-lg px-3 text-sm font-medium transition-colors",
                  locale === l.id ? "bg-fg text-bg" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          {inFlow && s.step !== "done" && (
            <Button variant="ghost" className="h-12 px-4" onClick={reset}>
              {t.startOver}
            </Button>
          )}
        </div>
      </div>

      {stepIndex >= 0 && (
        <div className="px-5 pt-5 sm:px-8">
          <p className="text-sm text-muted">{t.stepOf(stepIndex + 1, PROGRESS.length)}</p>
          <ol className="mt-2 grid grid-cols-5 gap-1.5" aria-label={t.stepOf(stepIndex + 1, PROGRESS.length)}>
            {PROGRESS.map((step, i) => (
              <li key={step} aria-current={i === stepIndex ? "step" : undefined}>
                <span className={cn("block h-1.5 rounded-full", i <= stepIndex ? "bg-accent" : "bg-line-strong")} />
                <span className={cn("mt-1.5 hidden text-xs sm:block", i === stepIndex ? "font-medium text-fg" : "text-muted")}>
                  {t.steps[step]}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
        {s.step === "welcome" && <Welcome offline={!sync.online} onStart={() => dispatch({ type: "start" })} />}
        {s.step === "find" && <FindBooking error={s.lookupError} onFind={find} />}
        {s.step === "passengers" && <Travellers state={s} dispatch={dispatch} />}
        {s.step === "seats" && <SeatMap state={s} dispatch={dispatch} taken={taken} />}
        {s.step === "bags" && <Bags state={s} dispatch={dispatch} />}
        {s.step === "review" && <Review state={s} />}
        {s.step === "done" && s.record && s.booking && <BoardingPasses record={s.record} booking={s.booking} checkins={checkins} />}
      </div>

      {inFlow && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-8">
          {s.step === "done" ? (
            <Button className={cn(BIG, "ml-auto")} onClick={reset}>
              {t.finish}
            </Button>
          ) : (
            <>
              <Button variant="secondary" className={BIG} onClick={() => dispatch({ type: "back" })}>
                {t.back}
              </Button>
              {s.step === "review" ? (
                <Button className={BIG} onClick={confirm}>
                  {t.confirm}
                </Button>
              ) : (
                s.step !== "find" && (
                  <Button className={BIG} disabled={!canAdvance(s)} onClick={() => dispatch({ type: "next", taken })}>
                    {t.continue}
                  </Button>
                )
              )}
            </>
          )}
        </div>
      )}

      <IdleGuard active={inFlow} onTimeout={reset} />
    </div>
  );
}

function PlaneMark() {
  return (
    <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
      </svg>
    </span>
  );
}
