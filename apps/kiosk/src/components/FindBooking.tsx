"use client";

import { useId, useRef, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/cn";
import type { LookupFailure } from "@/lib/checkin";
import { DEMO_HINTS, normalizeCode } from "@/lib/flights";
import { useI18n } from "./I18n";
import { StepHeading } from "./parts";

const ROWS = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
type Field = "code" | "last";

export function FindBooking({ error, onFind }: { error: LookupFailure | null; onFind: (code: string, last: string) => void }) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [last, setLast] = useState("");
  const [field, setField] = useState<Field>("code");
  const codeRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const hintId = useId();

  const type = (key: string) => {
    if (field === "code") setCode((v) => (key === "⌫" ? v.slice(0, -1) : normalizeCode(v + key).slice(0, 6)));
    else setLast((v) => (key === "⌫" ? v.slice(0, -1) : (v + key).slice(0, 40)));
    (field === "code" ? codeRef : lastRef).current?.focus();
  };

  const input =
    "mt-2 h-16 w-full rounded-xl border border-line-strong bg-bg px-4 text-2xl tracking-wide text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/40";

  return (
    <div>
      <StepHeading title={t.findTitle} body={t.findBody} />
      <form
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onFind(code, last);
        }}
      >
        <label className="block">
          <span className="text-base font-medium">{t.codeLabel}</span>
          <input
            ref={codeRef}
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value).slice(0, 6))}
            onFocus={() => setField("code")}
            aria-describedby={hintId}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
            minLength={6}
            className={cn(input, "font-mono uppercase")}
          />
          <span id={hintId} className="mt-1 block text-sm text-muted">
            {t.codeHint}
          </span>
        </label>
        <label className="block">
          <span className="text-base font-medium">{t.lastLabel}</span>
          <input
            ref={lastRef}
            value={last}
            onChange={(e) => setLast(e.target.value)}
            onFocus={() => setField("last")}
            autoComplete="off"
            spellCheck={false}
            required
            className={input}
          />
        </label>

        {error && (
          <Alert live tone={error === "not_found" ? "danger" : "warning"} title={t.lookupErrors[error].title} className="text-base sm:col-span-2">
            {t.lookupErrors[error].body}
          </Alert>
        )}

        <Button type="submit" className="h-14 px-8 text-lg sm:col-span-2 sm:justify-self-start">
          {t.findButton}
        </Button>
      </form>

      {/* Phones bring their own keyboard; a kiosk screen needs one drawn on it. */}
      <div role="group" aria-label={t.keyboard} className="mt-8 hidden select-none flex-col items-center gap-2 md:flex">
        {ROWS.map((row) => (
          <div key={row} className="flex gap-2">
            {[...row].map((k) => (
              <Key key={k} label={k} onPress={() => type(k)} />
            ))}
            {row === "ZXCVBNM" && (
              <>
                <Key label="-" onPress={() => type("-")} />
                <Key label="⌫" aria={t.backspace} wide onPress={() => type("⌫")} />
              </>
            )}
          </div>
        ))}
        <Key label={t.space} wide className="w-72" onPress={() => field === "last" && type(" ")} />
      </div>

      <section aria-labelledby="samples" className="mt-8 rounded-2xl border border-dashed border-line-strong p-4">
        <h2 id="samples" className="text-sm font-medium text-muted">
          {t.samplesTitle}
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {DEMO_HINTS.map((h) => (
            <li key={h.code}>
              <button
                type="button"
                onClick={() => {
                  setCode(h.code);
                  setLast(h.last);
                  onFind(h.code, h.last);
                }}
                className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-2 text-left transition-colors hover:bg-line"
              >
                <span>
                  <span className="font-mono font-medium">{h.code}</span> · {h.last}
                </span>
                <span className="text-sm text-muted">{t.samples[h.note]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Key({ label, aria, wide, className, onPress }: { label: string; aria?: string; wide?: boolean; className?: string; onPress: () => void }) {
  return (
    <button
      type="button"
      aria-label={aria}
      // Keep focus in the text field, like a hardware keyboard.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      className={cn(
        "h-12 rounded-lg border border-line bg-surface-2 text-lg font-medium text-fg transition-colors hover:bg-line active:bg-accent active:text-accent-fg",
        wide ? "min-w-20 px-4" : "w-12",
        className,
      )}
    >
      {label}
    </button>
  );
}
