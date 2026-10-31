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
import { buttonClass } from "@repo/ui/button";
import { cn } from "@repo/ui/cn";
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
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-muted">
          <span
            aria-hidden
            className={cn("h-2 w-2 rounded-full", status === "live" ? "animate-pulse bg-success shadow-[0_0_8px_var(--success)]" : status === "offline" ? "bg-danger" : "bg-warning")}
          />
          {status === "live" ? "Live" : status === "offline" ? "Offline: changes still save" : "Connecting…"}
        </span>
                <ul aria-label="People on this board" className="flex items-center -space-x-1.5">
          {[me, ...peers].map((p) => (
            <li
              key={p.id}
              title={p.id === me.id ? `${p.name} (you)` : p.name}
              className="flex h-7 items-center rounded-full px-2.5 text-xs font-medium text-white ring-2 ring-bg"
              style={{ background: p.color }}
            >
              {p.id === me.id ? "You" : p.name.replace("Guest ", "")}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(window.location.href)}
          className={buttonClass({ variant: "secondary", size: "sm", className: "ml-auto" })}
        >
          Copy invite link
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
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
              <span className="ml-3 rounded-md px-1.5 py-0.5 text-xs font-medium text-white shadow-lg" style={{ background: p.color }}>
                {p.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const DOT: Record<ColumnId, string> = {
  todo: "bg-muted",
  doing: "bg-warning",
  done: "bg-success",
};

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
      className={cn("flex min-h-72 flex-col gap-3 rounded-2xl border bg-surface-2/50 p-3 transition-colors", isOver ? "border-accent/60 bg-accent/5" : "border-line")}
    >
      <h2 id={`col-${id}`} className="flex items-center gap-2 px-1.5 pt-1 text-sm font-semibold">
        <span aria-hidden className={cn("h-2 w-2 rounded-full", DOT[id])} />
        {title}
        <span className="ml-auto rounded-full border border-line bg-surface px-2 font-mono text-xs text-muted">{cards.length}</span>
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
          className="w-full rounded-lg border border-dashed border-line-strong bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:border-solid focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15"
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
      className={cn("surface-sheen group flex items-start gap-2 rounded-xl border border-line bg-surface p-3 text-sm shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-[border-color,box-shadow] hover:border-line-strong", isDragging && "z-10 border-accent/60 opacity-80 shadow-[0_16px_40px_-12px_var(--glow)]")}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Move "${card.title}"`}
        className="cursor-grab touch-none text-muted/60 hover:text-fg active:cursor-grabbing"
      >
        ⠿
      </button>
      <span className="flex-1 break-words">{card.title}</span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete "${card.title}"`}
        className="text-muted opacity-0 transition-opacity hover:text-danger focus:opacity-100 group-hover:opacity-100"
      >
        ×
      </button>
    </li>
  );
}
