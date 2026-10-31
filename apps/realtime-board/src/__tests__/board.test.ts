import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyEvent,
  type Card,
  cardsIn,
  identityFor,
  initialState,
  positionAt,
  positionBetween,
  throttle,
} from "@/lib/board";

const card = (id: string, over: Partial<Card> = {}): Card => ({
  id,
  column: "todo",
  position: 1000,
  title: id,
  updatedAt: 1,
  ...over,
});

describe("applyEvent", () => {
  it("keeps the newer edit when two updates arrive out of order", () => {
    let s = initialState([card("a")]);
    s = applyEvent(s, { type: "upsert", card: card("a", { title: "new", updatedAt: 3 }) });
    s = applyEvent(s, { type: "upsert", card: card("a", { title: "stale", updatedAt: 2 }) });
    expect(s.cards.a.title).toBe("new");
  });

  it("doesn't let a late upsert resurrect a deleted card", () => {
    let s = initialState([card("a")]);
    s = applyEvent(s, { type: "delete", id: "a", updatedAt: 5 });
    s = applyEvent(s, { type: "upsert", card: card("a", { updatedAt: 4 }) });
    expect(s.cards.a).toBeUndefined();
  });

  it("ignores a delete older than the card's latest edit", () => {
    let s = initialState([card("a", { updatedAt: 9 })]);
    s = applyEvent(s, { type: "delete", id: "a", updatedAt: 5 });
    expect(s.cards.a).toBeDefined();
  });

  it("converges to the same state regardless of event order", () => {
    const events = [
      { type: "upsert" as const, card: card("a", { column: "doing", updatedAt: 2 }) },
      { type: "upsert" as const, card: card("a", { column: "done", updatedAt: 3 }) },
      { type: "upsert" as const, card: card("b", { updatedAt: 1 }) },
      { type: "delete" as const, id: "b", updatedAt: 4 },
    ];
    const forward = events.reduce(applyEvent, initialState([]));
    const backward = [...events].reverse().reduce(applyEvent, initialState([]));
    expect(backward.cards).toEqual(forward.cards);
  });
});

describe("ordering", () => {
  it("sorts a column by position", () => {
    const s = initialState([card("x", { position: 30 }), card("y", { position: 10 }), card("z", { column: "done" })]);
    expect(cardsIn(s, "todo").map((c) => c.id)).toEqual(["y", "x"]);
  });

  it("places between, before and after neighbours", () => {
    expect(positionBetween(10, 20)).toBe(15);
    expect(positionBetween(undefined, 20)).toBeLessThan(20);
    expect(positionBetween(10, undefined)).toBeGreaterThan(10);
    expect(positionBetween()).toBe(1000);
  });

  it("computes a drop position that sorts at the target index", () => {
    const list = [card("a", { position: 10 }), card("b", { position: 20 })];
    const p = positionAt(list, 1);
    expect(p).toBeGreaterThan(10);
    expect(p).toBeLessThan(20);
  });
});

describe("throttle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires immediately, then once more with the latest args", () => {
    const fn = vi.fn();
    const t = throttle(fn, 50);
    t(1);
    t(2);
    t(3);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3);
  });
});

describe("identityFor", () => {
  it("is stable per user", () => {
    expect(identityFor("abc")).toEqual(identityFor("abc"));
  });
});
