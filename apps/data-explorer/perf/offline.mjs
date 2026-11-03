/**
 * Payload sizes for the case study: the TTC CSV, the same rows as a JSON array of objects (what an
 * app usually ships first), and the column-oriented file the explorer ships. Sizes are measured
 * here with Node's zlib at the levels a CDN typically uses; parse times are Node, not a browser.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const kb = (bytes) => Math.round(bytes / 1024);

function sizes(buf) {
  return {
    rawKb: kb(buf.length),
    gzipKb: kb(gzipSync(buf, { level: 9 }).length),
    brotliKb: kb(brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length),
  };
}

function parseMs(text) {
  const times = [];
  for (let i = 0; i < 9; i++) {
    const t = performance.now();
    JSON.parse(text);
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  return Math.round(times[4] * 10) / 10;
}

const pad = (n) => String(n).padStart(2, "0");

export function payloadSizes() {
  const columnarText = readFileSync(join(root, "public/data/subway-delays.json"), "utf8");
  const file = JSON.parse(columnarText);
  const { cols, dict } = file;
  const rows = cols.day.map((d, i) => ({
    date: new Date(d * 86_400_000).toISOString().slice(0, 10),
    time: `${pad(Math.floor(cols.minute[i] / 60))}:${pad(cols.minute[i] % 60)}`,
    station: dict.station[cols.station[i]],
    line: dict.line[cols.line[i]],
    code: dict.code[cols.code[i]],
    bound: dict.bound[cols.bound[i]],
    delay: cols.delay[i],
    gap: cols.gap[i],
  }));
  const rowsText = JSON.stringify(rows);
  const csv = join(root, "data/raw/ttc-subway-delay-data-since-2025.csv");

  return {
    payload: {
      rows: cols.day.length,
      csv: existsSync(csv) ? sizes(readFileSync(csv)) : null,
      rowObjects: { ...sizes(Buffer.from(rowsText)), parseMs: parseMs(rowsText) },
      columnar: { ...sizes(Buffer.from(columnarText)), parseMs: parseMs(columnarText) },
    },
  };
}
