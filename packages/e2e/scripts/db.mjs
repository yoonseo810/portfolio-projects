// An in-memory Postgres for the kiosk's end-to-end tests: PGlite behind the Postgres wire protocol,
// with the kiosk's real migration applied. Runs until killed.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.env.E2E_DB_PORT ?? 5544);
const dir = new URL("../../../apps/kiosk/drizzle/", import.meta.url).pathname;

const db = await PGlite.create();
for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  for (const sql of readFileSync(join(dir, file), "utf8").split("--> statement-breakpoint")) await db.exec(sql);
}
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });
await server.start();
console.log(`e2e database ready on 127.0.0.1:${port}`);

const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
