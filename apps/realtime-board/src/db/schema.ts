import { doublePrecision, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const columnId = pgEnum("column_id", ["todo", "doing", "done"]);

export const boards = pgTable("boards", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  ownerId: uuid("owner_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Cards are ordered within a column by a fractional `position`, so moving a
 * card writes one row instead of renumbering its neighbours.
 */
export const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    column: columnId("column").notNull(),
    position: doublePrecision("position").notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid("updated_by").notNull(),
  },
  (t) => [index("cards_board_idx").on(t.boardId)],
);
