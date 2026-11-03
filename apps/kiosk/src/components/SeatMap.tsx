"use client";

import { type Dispatch, type KeyboardEvent, useMemo, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/cn";
import { Dialog } from "@repo/ui/dialog";
import type { Action, State } from "@/lib/checkin";
import type { Cabin, PassengerDef } from "@/lib/flights";
import { ECONOMY_LETTERS, type Seat, SEATS, seatBlock } from "@/lib/seats";
import { useI18n } from "./I18n";
import { StepHeading } from "./parts";

const CABINS: Cabin[] = ["premium", "economy"];

export function SeatMap({ state, dispatch, taken }: { state: State; dispatch: Dispatch<Action>; taken: ReadonlySet<string> }) {
  const { t } = useI18n();
  const people = useMemo(
    () => state.selected.map((id) => state.booking!.passengers.find((p) => p.id === id)!),
    [state.selected, state.booking],
  );
  const [activeId, setActiveId] = useState(people[0]?.id);
  const active = people.find((p) => p.id === activeId) ?? people[0];
  const [exitSeat, setExitSeat] = useState<Seat | null>(null);
  const [focusSeat, setFocusSeat] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  const holder = useMemo(() => {
    const m = new Map<string, PassengerDef>();
    for (const p of people) if (state.seats[p.id]) m.set(state.seats[p.id], p);
    return m;
  }, [people, state.seats]);

  const name = (p: PassengerDef) => `${p.first} ${p.last}`;
  // The one seat in the tab order: the last one focused, else the active traveller's seat.
  const tabStop = focusSeat ?? state.seats[active.id] ?? SEATS.find((s) => !seatBlock(s, active, taken))?.id;

  const assign = (seat: Seat) => {
    dispatch({ type: "seat", passengerId: active.id, seat: seat.id, taken });
    // Move on to a traveller who still needs a seat, if there is one.
    const next = people.find((p) => p.id !== active.id && !state.seats[p.id]);
    if (next) setActiveId(next.id);
  };

  const pick = (seat: Seat) => {
    const held = holder.get(seat.id);
    if (held?.id === active.id) return;
    if (!held && seatBlock(seat, active, taken)) return;
    if (held && seatBlock(seat, active, new Set())) return;
    if (seat.exit) setExitSeat(seat);
    else assign(seat);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement;
    const row = Number(el.dataset.row);
    const col = Number(el.dataset.col);
    if (!el.dataset.seat) return;
    const buttons = [...grid.current!.querySelectorAll<HTMLButtonElement>("button[data-seat]")];
    const rows = [...new Set(buttons.map((b) => Number(b.dataset.row)))];
    let target: HTMLButtonElement | undefined;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const same = buttons.filter((b) => Number(b.dataset.row) === row);
      target = same[same.indexOf(el as HTMLButtonElement) + (e.key === "ArrowLeft" ? -1 : 1)];
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const r = rows[rows.indexOf(row) + (e.key === "ArrowUp" ? -1 : 1)];
      const inRow = buttons.filter((b) => Number(b.dataset.row) === r);
      target = inRow.sort((a, b) => Math.abs(Number(a.dataset.col) - col) - Math.abs(Number(b.dataset.col) - col))[0];
    } else if (e.key === "Home" || e.key === "End") {
      const same = buttons.filter((b) => Number(b.dataset.row) === row);
      target = e.key === "Home" ? same[0] : same.at(-1);
    } else return;
    e.preventDefault();
    if (target) {
      setFocusSeat(target.dataset.seat!);
      target.focus();
    }
  };

  const label = (seat: Seat) => {
    const held = holder.get(seat.id);
    const block = held ? null : seatBlock(seat, active, taken);
    const status = held
      ? t.seatStatus.heldBy(name(held))
      : block
        ? t.blocked[block]
        : seat.exit
          ? t.seatStatus.exitOpen
          : t.seatStatus.open;
    return { status: t.seatLabel(seat.id, t.kind[seat.kind], status), held, block };
  };

  return (
    <div>
      <StepHeading title={t.seatsTitle} body={people.length > 1 ? t.seatsBody : undefined} />

      {people.length > 1 && (
        <div role="group" aria-label={t.steps.passengers} className="mb-4 flex flex-wrap gap-2">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === active.id}
              onClick={() => setActiveId(p.id)}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-xl border px-4 text-left transition-colors",
                p.id === active.id ? "border-accent bg-accent/10" : "border-line-strong hover:bg-surface-2",
              )}
            >
              <span className="font-medium">{p.first}</span>
              <span className="font-mono text-sm text-muted">{state.seats[p.id] ?? t.noSeat}</span>
            </button>
          ))}
        </div>
      )}
      <p role="status" className="mb-4 text-lg font-medium">
        {t.seatFor(name(active))}
        {state.seats[active.id] && <span className="ml-2 font-mono text-accent">{state.seats[active.id]}</span>}
      </p>

      <Legend />

      <div
        ref={grid}
        onKeyDown={onKeyDown}
        className="mt-4 max-h-[30rem] overflow-y-auto rounded-2xl border border-line bg-bg px-1 py-4 sm:px-6"
      >
        <p className="mb-3 text-center text-xs tracking-widest text-muted uppercase">{t.frontOfPlane}</p>
        {CABINS.map((cabin) => {
          const seats = SEATS.filter((s) => s.cabin === cabin);
          const rows = [...new Set(seats.map((s) => s.row))];
          const letters = cabin === "premium" ? ["A", "C", "D", "F"] : [...ECONOMY_LETTERS];
          return (
            <div key={cabin} role="grid" aria-label={`${t.seatMap}, ${t.cabin[cabin]}`} className="mx-auto mb-6 w-fit">
              <div role="row" className="flex items-center gap-1 pb-1 sm:gap-1.5">
                <span role="columnheader" className="w-7 text-center text-xs text-muted sm:w-8">
                  <span className="sr-only">{t.cabin[cabin]}</span>
                </span>
                {letters.map((l, i) => (
                  <span key={l} role="columnheader" className={cn("text-center text-xs font-medium text-muted", cabin === "premium" ? "w-12 sm:w-14" : "w-9 sm:w-11", aisleAfter(cabin, i) && "mr-3 sm:mr-6")}>
                    {l}
                  </span>
                ))}
              </div>
              {rows.map((row) => (
                <div key={row} role="row" className="flex items-center gap-1 py-0.5 sm:gap-1.5">
                  <span role="rowheader" aria-label={t.row(row)} className={cn("w-7 text-center text-xs tabular-nums sm:w-8", seats.find((s) => s.row === row)?.exit ? "font-semibold text-warning" : "text-muted")}>
                    {row}
                  </span>
                  {seats
                    .filter((s) => s.row === row)
                    .map((seat, i) => {
                      const { status, held, block } = label(seat);
                      return (
                        <span key={seat.id} role="gridcell" className={cn(aisleAfter(cabin, i) && "mr-3 sm:mr-6")}>
                          <button
                            type="button"
                            data-seat={seat.id}
                            data-row={seat.row}
                            data-col={ECONOMY_LETTERS.indexOf(seat.letter as (typeof ECONOMY_LETTERS)[number])}
                            tabIndex={seat.id === tabStop ? 0 : -1}
                            aria-label={status}
                            aria-pressed={held?.id === active.id}
                            aria-disabled={!!block || undefined}
                            onFocus={() => setFocusSeat(seat.id)}
                            onClick={() => pick(seat)}
                            className={cn(
                              "flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                              cabin === "premium" ? "w-12 sm:w-14" : "w-9 sm:w-11",
                              held
                                ? held.id === active.id
                                  ? "border-fg bg-fg text-bg ring-2 ring-accent ring-offset-2 ring-offset-bg"
                                  : "border-accent bg-accent/25 text-fg"
                                : block === "taken"
                                  ? "border-transparent bg-line-strong text-muted"
                                  : block
                                    ? "border-line bg-surface text-muted opacity-50"
                                    : seat.exit
                                      ? "border-2 border-dashed border-warning bg-surface text-fg hover:bg-surface-2"
                                      : "border-line-strong bg-surface text-fg hover:border-accent hover:bg-accent/10",
                            )}
                          >
                            <span aria-hidden>{held ? held.first[0] : block === "taken" ? "×" : seat.letter}</span>
                          </button>
                        </span>
                      );
                    })}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!exitSeat}
        onClose={() => setExitSeat(null)}
        title={t.exitTitle}
        description={t.exitBody}
        footer={
          <>
            <Button variant="secondary" className="h-12 px-5" onClick={() => setExitSeat(null)}>
              {t.exitCancel}
            </Button>
            <Button
              className="h-12 px-5"
              onClick={() => {
                if (exitSeat) assign(exitSeat);
                setExitSeat(null);
              }}
            >
              {t.exitAgree}
            </Button>
          </>
        }
      />
    </div>
  );
}

/** The aisle sits after C (index 2 in economy, 1 in premium). */
const aisleAfter = (cabin: Cabin, i: number) => (cabin === "premium" ? i === 1 : i === 2);

function Legend() {
  const { t } = useI18n();
  const item = (cls: string, text: string, glyph = "") => (
    <li className="flex items-center gap-2">
      <span aria-hidden className={cn("flex h-6 w-6 items-center justify-center rounded-md border text-xs", cls)}>
        {glyph}
      </span>
      {text}
    </li>
  );
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
      {item("border-line-strong bg-surface", t.legend.open)}
      {item("border-transparent bg-line-strong text-muted", t.legend.taken, "×")}
      {item("border-fg bg-fg text-bg", t.legend.yours)}
      {item("border-2 border-dashed border-warning bg-surface", t.legend.exit)}
    </ul>
  );
}
