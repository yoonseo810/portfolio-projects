import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;
let instance: DB | undefined;

function connect(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
  // Supabase's transaction pooler does not support prepared statements.
  return drizzle(postgres(url, { prepare: false }), { schema });
}

/** Connects on first use, so builds and tests don't need a database. */
export const db = new Proxy({} as DB, {
  get(_, prop) {
    instance ??= connect();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
