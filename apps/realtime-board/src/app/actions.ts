"use server";

import { and, eq, lt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { boards, cards } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string };

async function ensureSession(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) return data.claims.sub;
  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("signInAnonymously failed", error);
    return null;
  }
  return signedIn.user?.id ?? null;
}

const SEED: { column: "todo" | "doing" | "done"; title: string }[] = [
  { column: "todo", title: "Open this board in a second window" },
  { column: "todo", title: "Drag me to another column" },
  { column: "doing", title: "Watch the other cursor move" },
  { column: "done", title: "Create a board" },
];

export async function createBoard(): Promise<ActionState> {
  const userId = await ensureSession();
  if (!userId) return { error: "Couldn't start a guest session. Please try again in a minute." };
  const [board] = await db
    .insert(boards)
    .values({ title: "Untitled board", ownerId: userId })
    .returning({ id: boards.id });
  await db.insert(cards).values(
    SEED.map((s, i) => ({
      id: crypto.randomUUID(),
      boardId: board.id,
      column: s.column,
      position: (i + 1) * 1000,
      title: s.title,
      updatedBy: userId,
    })),
  );
  redirect(`/b/${board.id}`);
}

export async function joinBoard(boardId: string): Promise<ActionState> {
  const userId = await ensureSession();
  if (!userId) return { error: "Couldn't start a guest session. Please try again in a minute." };
  redirect(`/b/${boardId}`);
}

const cardSchema = z.object({
  id: z.uuid(),
  column: z.enum(["todo", "doing", "done"]),
  position: z.number().finite(),
  title: z.string().trim().min(1).max(200),
  updatedAt: z.number().int().positive(),
});

/**
 * Saves a card with the same last-write-wins rule the clients use: the row is
 * only overwritten when the incoming edit is newer, and only within its board.
 */
export async function saveCard(boardId: string, input: unknown): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const card = cardSchema.parse(input);
  const board = z.uuid().parse(boardId);
  const updatedAt = new Date(card.updatedAt);
  await db
    .insert(cards)
    .values({ ...card, boardId: board, updatedAt, updatedBy: userId })
    .onConflictDoUpdate({
      target: cards.id,
      set: {
        column: card.column,
        position: card.position,
        title: card.title,
        updatedAt,
        updatedBy: userId,
      },
      setWhere: and(eq(cards.boardId, board), lt(cards.updatedAt, updatedAt)),
    });
  return { ok: true };
}

export async function deleteCard(boardId: string, id: string): Promise<{ ok: boolean }> {
  await requireUserId();
  await db
    .delete(cards)
    .where(and(eq(cards.id, z.uuid().parse(id)), eq(cards.boardId, z.uuid().parse(boardId))));
  return { ok: true };
}
