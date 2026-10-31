"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useReducer, useRef, useState } from "react";
import { deleteCard, saveCard } from "@/app/actions";
import {
  applyEvent,
  type BoardEvent,
  type Card,
  COLUMNS,
  type ColumnId,
  cardsIn,
  clock,
  initialState,
  positionAt,
  throttle,
} from "@/lib/board";
import { createClient } from "@/lib/supabase/browser";

type Me = { id: string; name: string; color: string };
type Peer = { id: string; name: string; color: string };
type Cursor = { x: number; y: number; at: number };

export function Board({ boardId, initialCards, me }: { boardId: string; initialCards: Card[]; me: Me }) {
  const [state, dispatch] = useReducer(applyEvent, initialCards, initialState);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const sendCursorRef = useRef<((x: number, y: number) => void) | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`board:${boardId}`, {
      config: { presence: { key: me.id }, broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "card" }, ({ payload }) => dispatch(payload as BoardEvent))
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        const { id, x, y } = payload as { id: string; x: number; y: number };
        setCursors((c) => ({ ...c, [id]: { x, y, at: clock() } }));
      })
      .on("presence", { event: "sync" }, () => {
        const list = Object.values(channel.presenceState<Peer>())
          .map((entries) => entries[0])
          .filter((p): p is Peer & { presence_ref: string } => !!p && p.id !== me.id);
        setPeers(list);
        setCursors((c) => Object.fromEntries(Object.entries(c).filter(([id]) => list.some((p) => p.id === id))));
      })
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          setStatus("live");
          channel.track({ id: me.id, name: me.name, color: me.color });
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          setStatus("offline");
        }
      });
    channelRef.current = channel;
    sendCursorRef.current = throttle((x: number, y: number) => {
      channel.send({ type: "broadcast", event: "cursor", payload: { id: me.id, x, y } });
    }, 50);
    return () => {
      channelRef.current = null;
      sendCursorRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [boardId, me.id, me.name, me.color]);


  /** Optimistic: apply locally and broadcast first, then persist; roll back if the save fails. */
  async function commit(event: BoardEvent, rollback: BoardEvent | null) {
    dispatch(event);
    channelRef.current?.send({ type: "broadcast", event: "card", payload: event });
    try {
      if (event.type === "upsert") await saveCard(boardId, event.card);
      else await deleteCard(boardId, event.id);
      setError(null);
    } catch {
      setError("A change couldn't be saved and was undone.");
      if (rollback) {
        dispatch(rollback);
        channelRef.current?.send({ type: "broadcast", event: "card", payload: rollback });
      }
    }
  }

  function moveCard(card: Card, column: ColumnId, index: number) {
    const list = cardsIn(state, column).filter((c) => c.id !== card.id);
    const next = { ...card, column, position: positionAt(list, index), updatedAt: clock() };
    commit({ type: "upsert", card: next }, { type: "upsert", card: { ...card, updatedAt: next.updatedAt + 1 } });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const card = state.cards[String(active.id)];
    if (!card) return;
    const overCard = state.cards[String(over.id)];
    const column = (overCard?.column ?? over.id) as ColumnId;
    const list = cardsIn(state, column).filter((c) => c.id !== card.id);
    const index = overCard ? list.findIndex((c) => c.id === overCard.id) : list.length;
    // Dropping onto a card below the dragged one in the same column puts it after that card.
    const adjusted =
      overCard && card.column === column && cardsIn(state, column).indexOf(card) < cardsIn(state, column).indexOf(overCard)
        ? index + 1
        : index;
    if (card.column === column && cardsIn(state, column).indexOf(card) === adjusted) return;
    moveCard(card, column, Math.max(0, adjusted));
  }

  function addCard(column: ColumnId, title: string) {
    const list = cardsIn(state, column);
    const card: Card = {
      id: crypto.randomUUID(),
      column,
      title,
      position: positionAt(list, list.length),
      updatedAt: clock(),
    };
    commit({ type: "upsert", card }, { type: "delete", id: card.id, updatedAt: card.updatedAt + 1 });
  }

  function removeCard(card: Card) {
    const at = clock();
    commit({ type: "delete", id: card.id, updatedAt: at }, null);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${status === "live" ? "bg-emerald-500" : status === "offline" ? "bg-rose-500" : "bg-amber-400"}`}
          />
          {status === "live" ? "Live" : status === "offline" ? "Offline: changes still save" : "Connecting…"}
        </span>
        <span className="text-zinc-400">·</span>
        <ul aria-label="People on this board" className="flex items-center gap-1">
          {[me, ...peers].map((p) => (
            <li
              key={p.id}
              title={p.id === me.id ? `${p.name} (you)` : p.name}
              className="flex h-7 items-center rounded-full px-2.5 text-xs font-medium text-white"
              style={{ background: p.color }}
            >
              {p.id === me.id ? "You" : p.name.replace("Guest ", "")}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(window.location.href)}
          className="ml-auto rounded-md border border-zinc-300 px-3 py-1 hover:border-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-100"
        >
          Copy invite link
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">
          {error}
        </p>
      )}

      <div
        ref={areaRef}
        className="relative"
        onPointerMove={(e) => {
          const r = areaRef.current?.getBoundingClientRect();
          if (r) sendCursorRef.current?.((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                id={col.id}
                title={col.title}
                cards={cardsIn(state, col.id)}
                onAdd={(t) => addCard(col.id, t)}
                onDelete={removeCard}
              />
            ))}
          </div>
        </DndContext>

        {peers.map((p) => {
          const c = cursors[p.id];
          if (!c) return null;
          return (
            <div
              key={p.id}
              aria-hidden
              className="pointer-events-none absolute transition-[left,top] duration-75"
              style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ color: p.color }}>
                <path d="M1 1l5 14 2-6 6-2z" fill="currentColor" stroke="white" strokeWidth="1" />
              </svg>
              <span className="ml-3 rounded px-1.5 py-0.5 text-xs text-white" style={{ background: p.color }}>
                {p.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Column({
  id,
  title,
  cards,
  onAdd,
  onDelete,
}: {
  id: ColumnId;
  title: string;
  cards: Card[];
  onAdd: (title: string) => void;
  onDelete: (card: Card) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [draft, setDraft] = useState("");
  return (
    <section
      aria-labelledby={`col-${id}`}
      className={`flex min-h-64 flex-col gap-3 rounded-xl border p-3 ${isOver ? "border-teal-500" : "border-zinc-200 dark:border-zinc-800"} bg-zinc-50 dark:bg-zinc-900/40`}
    >
      <h2 id={`col-${id}`} className="flex items-center justify-between px-1 text-sm font-semibold">
        {title}
        <span className="rounded-full bg-zinc-200 px-2 text-xs dark:bg-zinc-800">{cards.length}</span>
      </h2>
      <SortableContext id={id} items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex flex-1 flex-col gap-2">
          {cards.map((c) => (
            <SortableCard key={c.id} card={c} onDelete={() => onDelete(c)} />
          ))}
        </ul>
      </SortableContext>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft.trim();
          if (t) onAdd(t.slice(0, 200));
          setDraft("");
        }}
      >
        <label htmlFor={`add-${id}`} className="sr-only">
          Add a card to {title}
        </label>
        <input
          id={`add-${id}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="+ Add a card"
          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm placeholder:text-zinc-500 focus:border-zinc-300 focus:bg-white dark:focus:border-zinc-700 dark:focus:bg-zinc-950"
        />
      </form>
    </section>
  );
}

function SortableCard({ card, onDelete }: { card: Card; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${isDragging ? "opacity-60 ring-2 ring-teal-500" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Move "${card.title}"`}
        className="cursor-grab touch-none text-zinc-400 hover:text-zinc-700 active:cursor-grabbing dark:hover:text-zinc-200"
      >
        ⠿
      </button>
      <span className="flex-1 break-words">{card.title}</span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete "${card.title}"`}
        className="text-zinc-400 opacity-0 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100"
      >
        ×
      </button>
    </li>
  );
}
