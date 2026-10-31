import { Backdrop } from "@repo/ui/backdrop";
import { Card } from "@repo/ui/card";
import { Eyebrow } from "@repo/ui/eyebrow";
import { createBoard } from "@/app/actions";
import { ActionButton } from "@/components/ActionButton";

const FEATURES = [
  ["Live cursors", "See where everyone is pointing, throttled to keep traffic light."],
  ["Presence", "Know who's on the board right now, with no sign-up."],
  ["Drag and drop", "Move cards with a mouse, touch, or the keyboard."],
  ["Conflict safe", "Last-write-wins per card, so simultaneous edits settle the same way for everyone."],
];

const PREVIEW = [
  { title: "To do", cards: ["Open in a second window", "Invite a teammate"] },
  { title: "Doing", cards: ["Watch the other cursor"] },
  { title: "Done", cards: ["Create a board"] },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <section className="relative isolate pb-14 pt-20 text-center sm:pt-28">
        <Backdrop />
        <Eyebrow>Real-time collaborative board</Eyebrow>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
          <span className="text-gradient">A kanban board you can share in one click.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted">
          Create a board, send the link, and watch cards and cursors move as your teammates work. Built with Next.js,
          Supabase Realtime, and dnd-kit.
        </p>
        <div className="mt-8">
          <ActionButton action={createBoard} label="Create a board" pendingLabel="Creating…" />
        </div>

        <Card aria-hidden className="relative mx-auto mt-14 max-w-3xl p-4 text-left shadow-[0_30px_80px_-30px_var(--glow)]">
          <div className="grid grid-cols-3 gap-3">
            {PREVIEW.map((col) => (
              <div key={col.title} className="rounded-xl border border-line bg-surface-2/60 p-2.5">
                <p className="px-1 pb-2 text-xs font-medium text-muted">{col.title}</p>
                <div className="space-y-2">
                  {col.cards.map((c) => (
                    <div key={c} className="rounded-lg border border-line bg-surface px-2.5 py-2 text-xs">
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute left-[58%] top-[46%] flex items-start">
            <svg width="16" height="16" viewBox="0 0 16 16" className="text-accent-2">
              <path d="M1 1l5 14 2-6 6-2z" fill="currentColor" stroke="white" strokeWidth="1" />
            </svg>
            <span className="ml-1 mt-3 rounded bg-accent-2 px-1.5 py-0.5 text-[10px] text-white">Guest Otter</span>
          </div>
        </Card>
      </section>
      <ul className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(([title, body]) => (
          <li key={title}>
            <Card interactive className="h-full p-5">
              <h2 className="font-semibold tracking-tight">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
