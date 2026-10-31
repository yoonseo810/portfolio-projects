export const COLUMNS = [
  { id: "todo", title: "To do" },
  { id: "doing", title: "In progress" },
  { id: "done", title: "Done" },
] as const;

export type ColumnId = (typeof COLUMNS)[number]["id"];

export type Card = {
  id: string;
  column: ColumnId;
  position: number;
  title: string;
  /** Epoch ms of the last edit; the newer edit wins when two arrive out of order. */
  updatedAt: number;
};

export type BoardEvent =
  | { type: "upsert"; card: Card }
  | { type: "delete"; id: string; updatedAt: number };

export type BoardState = { cards: Record<string, Card>; deleted: Record<string, number> };

export const initialState = (cards: Card[]): BoardState => ({
  cards: Object.fromEntries(cards.map((c) => [c.id, c])),
  deleted: {},
});

/**
 * Applies a local or remote change with last-write-wins semantics, so peers
 * converge even when broadcasts arrive out of order. Deletions leave a
 * tombstone so a late upsert can't resurrect a card.
 */
export function applyEvent(state: BoardState, event: BoardEvent): BoardState {
  if (event.type === "delete") {
    const current = state.cards[event.id];
    if (current && current.updatedAt > event.updatedAt) return state;
    const { [event.id]: _removed, ...rest } = state.cards;
    void _removed;
    return { cards: rest, deleted: { ...state.deleted, [event.id]: event.updatedAt } };
  }
  const { card } = event;
  const tombstone = state.deleted[card.id];
  if (tombstone !== undefined && tombstone >= card.updatedAt) return state;
  const current = state.cards[card.id];
  if (current && current.updatedAt > card.updatedAt) return state;
  return { ...state, cards: { ...state.cards, [card.id]: card } };
}

export function cardsIn(state: BoardState, column: ColumnId): Card[] {
  return Object.values(state.cards)
    .filter((c) => c.column === column)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

/** A position strictly between two neighbours (either may be missing). */
export function positionBetween(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return 1000;
  if (before === undefined) return after! - 1000;
  if (after === undefined) return before + 1000;
  return (before + after) / 2;
}

/**
 * Where a card lands when dropped at `index` in a column's list. `list` must
 * already exclude the moving card.
 */
export function positionAt(list: Card[], index: number): number {
  return positionBetween(list[index - 1]?.position, list[index]?.position);
}

/** Calls `fn` at most once per `ms`, always delivering the latest arguments. */
export function throttle<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: A | undefined;
  return (...args: A) => {
    const now = Date.now();
    pending = args;
    if (now - last >= ms) {
      last = now;
      fn(...args);
      pending = undefined;
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = undefined;
        last = Date.now();
        if (pending) fn(...pending);
        pending = undefined;
      }, ms - (now - last));
    }
  };
}

const PALETTE = ["#0f766e", "#b45309", "#7c3aed", "#be123c", "#1d4ed8", "#15803d"];
const ANIMALS = ["Otter", "Falcon", "Lynx", "Heron", "Badger", "Orca", "Ibis", "Fox"];

/** Stable display name and colour for a guest, derived from their user id. */
export function identityFor(userId: string) {
  let h = 0;
  for (const ch of userId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { name: `Guest ${ANIMALS[h % ANIMALS.length]}`, color: PALETTE[(h >>> 8) % PALETTE.length] };
}

/** Wall-clock timestamp for LWW ordering. Only called from event handlers, never during render. */
export function clock(): number {
  return Date.now();
}
