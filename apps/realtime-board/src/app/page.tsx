import { createBoard } from "@/app/actions";
import { ActionButton } from "@/components/ActionButton";

const FEATURES = [
  ["Live cursors", "See where everyone is pointing, throttled to keep traffic light."],
  ["Presence", "Know who's on the board right now, with no sign-up."],
  ["Drag and drop", "Move cards with a mouse, touch, or the keyboard."],
  ["Conflict safe", "Last-write-wins per card, so simultaneous edits settle the same way for everyone."],
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-20">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Real-time collaborative board
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">A kanban board you can share in one click.</h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Create a board, send the link, and watch cards and cursors move as your teammates work. Built with
          Next.js, Supabase Realtime, and dnd-kit.
        </p>
      </div>
      <ActionButton action={createBoard} label="Create a board" pendingLabel="Creating…" />
      <ul className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(([title, body]) => (
          <li key={title} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-medium">{title}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
