import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { boards, cards } from "@/db/schema";
import type { Card } from "@/lib/board";

export async function getBoard(id: string) {
  const [board] = await db.select().from(boards).where(eq(boards.id, id)).limit(1);
  if (!board) return null;
  const rows = await db.select().from(cards).where(eq(cards.boardId, id)).orderBy(asc(cards.position));
  const list: Card[] = rows.map((r) => ({
    id: r.id,
    column: r.column,
    position: r.position,
    title: r.title,
    updatedAt: r.updatedAt.getTime(),
  }));
  return { board, cards: list };
}
