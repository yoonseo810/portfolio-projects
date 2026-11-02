#!/usr/bin/env node
/**
 * Builds public/data/subway-delays.json, the compact column format in src/lib/dataset.ts.
 *
 *   node scripts/build-data.mjs            # from the TTC CSV exports in data/raw/*.csv
 *   node scripts/build-data.mjs --sample   # deterministic synthetic data, labelled as a sample in the UI
 *
 * Source: City of Toronto Open Data, "TTC Subway Delay Data",
 * https://open.toronto.ca/dataset/ttc-subway-delay-data/ (Open Government Licence – Toronto).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public/data/subway-delays.json");
const RAW = join(root, "data/raw");

const META = {
  title: "TTC subway delays",
  attribution: "Contains information licensed under the Open Government Licence – Toronto.",
  licenseUrl: "https://open.toronto.ca/open-data-license/",
  sourceUrl: "https://open.toronto.ca/dataset/ttc-subway-delay-data/",
};

/** RFC 4180-ish CSV: quoted fields, escaped quotes, CRLF. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

const DAY_MS = 86_400_000;

/** "2024-01-31", "2024/01/31" or "1/31/2024" -> days since epoch. */
function toDay(s) {
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY_MS;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return Date.UTC(+m[3], +m[1] - 1, +m[2]) / DAY_MS;
  return null;
}

function toMinute(s) {
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  return m ? Math.min(1439, +m[1] * 60 + +m[2]) : null;
}

class Dict {
  values = [];
  index = new Map();
  id(v) {
    let i = this.index.get(v);
    if (i === undefined) {
      i = this.values.length;
      this.values.push(v);
      this.index.set(v, i);
    }
    return i;
  }
}

function emptyCols() {
  return { day: [], minute: [], station: [], line: [], code: [], bound: [], delay: [], gap: [] };
}

function fromCsvFiles() {
  const files = readdirSync(RAW).filter((f) => f.toLowerCase().endsWith(".csv"));
  if (!files.length) throw new Error(`No CSV files in ${RAW}. Export the TTC sheets as CSV, or run with --sample.`);
  const dicts = { station: new Dict(), line: new Dict(), code: new Dict(), bound: new Dict() };
  const cols = emptyCols();
  const codeDescriptions = {};
  let skipped = 0;

  for (const file of files) {
    const [header, ...rows] = parseCsv(readFileSync(join(RAW, file), "utf8"));
    const h = header.map((x) => x.trim().toLowerCase().replace(/^﻿/, ""));
    const col = (...names) => h.findIndex((x) => names.includes(x));

    // The delay-code lookup file: code + description columns, no dates.
    const codeCol = col("sub rmenu code", "code");
    const descCol = col("code description", "description");
    if (col("date") === -1 && codeCol !== -1 && descCol !== -1) {
      for (const r of rows) if (r[codeCol]?.trim()) codeDescriptions[r[codeCol].trim()] = r[descCol].trim();
      continue;
    }

    const c = {
      date: col("date"),
      time: col("time"),
      station: col("station"),
      code: col("code"),
      delay: col("min delay"),
      gap: col("min gap"),
      bound: col("bound"),
      line: col("line"),
    };
    const missing = Object.entries(c).filter(([, i]) => i === -1).map(([k]) => k);
    if (missing.length) throw new Error(`${file}: missing columns ${missing.join(", ")} (found: ${h.join(", ")})`);

    for (const r of rows) {
      const day = toDay(r[c.date]?.trim() ?? "");
      const minute = toMinute(r[c.time]?.trim() ?? "");
      const delay = Number(r[c.delay]);
      if (day === null || minute === null || !Number.isFinite(delay)) {
        skipped++;
        continue;
      }
      cols.day.push(day);
      cols.minute.push(minute);
      cols.station.push(dicts.station.id(r[c.station].trim().toUpperCase() || "UNKNOWN"));
      cols.line.push(dicts.line.id(r[c.line].trim().toUpperCase() || "UNKNOWN"));
      cols.code.push(dicts.code.id(r[c.code].trim().toUpperCase() || "UNKNOWN"));
      cols.bound.push(dicts.bound.id(r[c.bound].trim().toUpperCase()));
      cols.delay.push(Math.max(0, Math.round(delay)));
      cols.gap.push(Math.max(0, Math.round(Number(r[c.gap]) || 0)));
    }
  }
  console.log(`Read ${cols.day.length} incidents from ${files.length} file(s); skipped ${skipped} malformed rows.`);
  return { source: "ttc", dicts, cols, codeDescriptions };
}

/** Plausible, clearly-labelled synthetic incidents so the app works before the real export is added. */
function sample() {
  let seed = 42;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const pick = (arr, weights) => {
    let r = rand() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < arr.length; i++) if ((r -= weights[i]) < 0) return arr[i];
    return arr[arr.length - 1];
  };
  const lines = {
    YU: ["FINCH", "NORTH YORK CENTRE", "SHEPPARD-YONGE", "YORK MILLS", "EGLINTON", "ST CLAIR", "BLOOR-YONGE", "COLLEGE", "DUNDAS", "QUEEN", "KING", "UNION", "ST ANDREW", "OSGOODE", "ST GEORGE", "SPADINA", "ST CLAIR WEST", "EGLINTON WEST", "WILSON", "SHEPPARD WEST", "DOWNSVIEW PARK", "VAUGHAN MC"],
    BD: ["KIPLING", "ISLINGTON", "ROYAL YORK", "JANE", "KEELE", "DUNDAS WEST", "LANSDOWNE", "OSSINGTON", "BATHURST", "SPADINA", "ST GEORGE", "BAY", "BLOOR-YONGE", "SHERBOURNE", "CASTLE FRANK", "BROADVIEW", "PAPE", "DONLANDS", "MAIN STREET", "VICTORIA PARK", "WARDEN", "KENNEDY"],
    SHP: ["SHEPPARD-YONGE", "BAYVIEW", "BESSARION", "LESLIE", "DON MILLS"],
  };
  const codes = [
    ["MUIS", "Injured or ill customer on train - transported", 14],
    ["MUPAA", "Passenger assistance alarm activated - no trouble found", 12],
    ["SUDP", "Disorderly patron", 10],
    ["MUSC", "Miscellaneous speed control", 9],
    ["PUOPO", "OPTO (COMMS) train door monitoring", 8],
    ["MUATC", "ATC project", 6],
    ["TUSC", "Operator overspeeding", 6],
    ["SUUT", "Unauthorized at track level", 5],
    ["MUI", "Injured customer on train - no transport", 5],
    ["PUSTS", "Signal trouble", 4],
    ["EUDO", "Door problems - faulty equipment", 4],
    ["MUTO", "Misc. transportation other - employee non-chargeable", 3],
    ["SUO", "Passenger other", 3],
    ["PUTWZ", "Work zone problems - track", 2],
    ["MUWEA", "Weather reports / related delays", 2],
  ];
  const lineWeights = [60, 35, 5];
  const hourWeights = [2, 1, 0.5, 0.2, 0.2, 1, 3, 6, 9, 7, 5, 5, 5, 5, 6, 7, 8, 9, 7, 5, 4, 3, 3, 2.5];
  const dicts = { station: new Dict(), line: new Dict(), code: new Dict(), bound: new Dict() };
  const cols = emptyCols();
  const start = Date.UTC(2023, 0, 1) / DAY_MS;
  const end = Date.UTC(2024, 11, 31) / DAY_MS;
  for (let day = start; day <= end; day++) {
    const perDay = 55 + Math.floor(rand() * 40);
    for (let k = 0; k < perDay; k++) {
      const line = pick(Object.keys(lines), lineWeights);
      const stations = lines[line];
      // Terminal and interchange stations see more incidents.
      const station = pick(stations, stations.map((s, i) => (i === 0 || i === stations.length - 1 || s.includes("BLOOR") || s === "UNION" ? 4 : 1)));
      const [code] = pick(codes, codes.map((c) => c[2]));
      const hour = pick([...Array(24).keys()], hourWeights);
      const zero = rand() < 0.35;
      const delay = zero ? 0 : Math.max(1, Math.round(-Math.log(1 - rand()) * (code === "PUSTS" || code === "SUUT" ? 12 : 5)));
      cols.day.push(day);
      cols.minute.push(hour * 60 + Math.floor(rand() * 60));
      cols.station.push(dicts.station.id(`${station} STATION`));
      cols.line.push(dicts.line.id(line));
      cols.code.push(dicts.code.id(code));
      cols.bound.push(dicts.bound.id(line === "BD" ? (rand() < 0.5 ? "E" : "W") : rand() < 0.5 ? "N" : "S"));
      cols.delay.push(delay);
      cols.gap.push(delay ? delay + 3 + Math.floor(rand() * 4) : 0);
    }
  }
  return { source: "sample", dicts, cols, codeDescriptions: Object.fromEntries(codes.map(([c, d]) => [c, d])) };
}

const built = process.argv.includes("--sample") ? sample() : fromCsvFiles();
const out = {
  meta: { ...META, source: built.source, generatedAt: new Date().toISOString(), rowCount: built.cols.day.length },
  dict: Object.fromEntries(Object.entries(built.dicts).map(([k, d]) => [k, d.values])),
  codeDescriptions: built.codeDescriptions,
  cols: built.cols,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out));
console.log(`Wrote ${out.meta.rowCount} rows (${built.source}) to ${OUT}`);
