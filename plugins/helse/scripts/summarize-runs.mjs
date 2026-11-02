#!/usr/bin/env node
// Teller kjøringene per flyt i et tidsvindu: hvor mange, hvor mange feilet, og den siste feilen. Leser svarene fra
// `list_workflow_executions`, ett per flyt (`<flytens nøkkel>.json`). Svaret kan ha kjøringene som en liste eller
// under `items`/`executions`/`data`, og feltnavnene varierer, så skriptet leter etter de vanlige og teller det det ikke
// kan tidfeste for seg, i stedet for å telle feil.
//
//   node summarize-runs.mjs <mappe> [--window 24h|7d|30d] [--now <iso>] [--json]
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const UNITS = { h: 3600e3, d: 86400e3 };
export const windowMs = (w) => {
  const m = String(w).match(/^(\d+)([hd])$/);
  if (!m) throw new Error(`Ugyldig vindu «${w}». Bruk for eksempel 24h, 7d eller 30d`);
  return Number(m[1]) * UNITS[m[2]];
};

// MCP-svaret kan være selve JSON-en, eller {content:[{type:"text",text:"<json>"}]} slik verktøyet returnerer det.
export function unwrap(raw) {
  const text = raw?.content?.find?.((c) => c.type === "text")?.text;
  if (typeof text === "string") {
    try {
      return JSON.parse(text);
    } catch {
      return raw;
    }
  }
  return raw?.structuredContent ?? raw;
}

const FAILED = /^(failed|error|errored|feilet|timed_out|timeout)$/i;
const pick = (o, names) => names.map((n) => o?.[n]).find((v) => v !== undefined && v !== null);
const list = (data) => (Array.isArray(data) ? data : pick(data, ["items", "executions", "data", "results"]) ?? []);

export function summarize(flows, { window = "24h", now = Date.now() } = {}) {
  const since = now - windowMs(window);
  return flows.map(({ flow, data }) => {
    const timed = list(data).map((r) => ({ r, at: Date.parse(pick(r, ["startedAt", "createdAt", "startTime", "started_at"]) ?? "") }));
    const inWindow = timed.filter((t) => !Number.isNaN(t.at) && t.at >= since).sort((a, b) => b.at - a.at);
    const failed = inWindow.filter((t) => FAILED.test(String(pick(t.r, ["status", "state", "result"]) ?? "")));
    const last = failed[0]?.r;
    return {
      flow,
      runs: inWindow.length,
      failed: failed.length,
      lastFailedAt: failed[0] ? new Date(failed[0].at).toISOString() : null,
      lastError: last ? String(pick(last, ["error", "errorMessage", "failureReason", "message"]) ?? "(ingen melding)") : null,
      lastFailedId: last ? pick(last, ["id", "executionId"]) ?? null : null,
      unknownTime: timed.filter((t) => Number.isNaN(t.at)).length,
    };
  });
}

// Ingen flyter er UKJENT, ikke grønt: det vi ikke har sett, er ikke friskt.
export function verdict(rows) {
  if (!rows.length) return "UKJENT";
  if (rows.some((r) => r.failed > 0 && r.failed === r.runs)) return "rødt";
  if (rows.some((r) => r.failed > 0 || r.unknownTime > 0)) return "gult";
  return "grønt";
}

export function markdown(rows, window) {
  const attention = rows.filter((r) => r.failed || r.unknownTime);
  const quiet = rows.filter((r) => !r.runs && !r.unknownTime).length;
  const lines = attention.map((r) => `| ${r.flow} | ${r.runs} | ${r.failed} | ${r.lastFailedAt ?? "—"} | ${r.lastError ?? `${r.unknownTime} uten tidspunkt`} |`);
  const head = `**${verdict(rows)}** for ${rows.length} flyter, siste ${window}.`;
  const rest = `${rows.length - attention.length - quiet} flyter uten feil, ${quiet} uten kjøringer i vinduet.`;
  return attention.length ? `${head}\n\n| Flyt | Kjøringer | Feilet | Sist feilet | Siste feil |\n|---|---|---|---|---|\n${lines.join("\n")}\n\n${rest}\n` : `${head} ${rest}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dir = args[0];
  if (!dir) {
    console.error("Bruk: node summarize-runs.mjs <mappe> [--window 24h] [--now <iso>] [--json]");
    process.exit(2);
  }
  const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const window = arg("--window") ?? "24h";
  const flows = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => ({ flow: basename(f, ".json"), data: unwrap(JSON.parse(readFileSync(join(dir, f), "utf8"))) }));
  const rows = summarize(flows, { window, now: arg("--now") ? Date.parse(arg("--now")) : Date.now() });
  console.log(args.includes("--json") ? JSON.stringify({ verdict: verdict(rows), rows }, null, 2) : markdown(rows, window));
}
