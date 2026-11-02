#!/usr/bin/env node
// Vakten for hemmelighetene (PreToolUse): agenten leser aldri `.env.local` eller `.keys/`, og kjører aldri hentingen
// fra hvelvet. Hemmelighetene er kundens, og en verdi i transkriptet er en verdi som har forlatt kunden. Skriptene som
// trenger dem, leser dem selv uten å skrive dem ut.
import { readFileSync } from "node:fs";

const SECRET_PATH = /(^|[\s"'/=])(\.env\.local|\.keys\/)/;
const SHOWS = /\b(cat|less|more|head|tail|bat|grep|rg|awk|sed|cp|base64|xxd|od|strings|source|\.)\s/;

export function decide(input) {
  const tool = input?.tool_name;
  const ti = input?.tool_input ?? {};
  if (["Read", "Edit", "Write", "NotebookEdit"].includes(tool) && SECRET_PATH.test(` ${ti.file_path ?? ti.notebook_path ?? ""}`)) {
    return "Fila har kundens hemmeligheter. Agenten leser og skriver dem aldri; skriptene leser dem selv. Bruk /forvaltning:hemmeligheter for å se hva som er satt (bare navn).";
  }
  if (tool === "Bash") {
    const cmd = String(ti.command ?? "");
    if (/hent-hemmeligheter\.mjs[^|;&]*--hent/.test(cmd)) return "Hentingen fra hvelvet kjøres av et menneske, med sin egen innlogging. Be personen kjøre den selv.";
    if (SECRET_PATH.test(cmd) && SHOWS.test(cmd)) return "Kommandoen ville vist kundens hemmeligheter. Bruk /forvaltning:hemmeligheter for å se hva som er satt (bare navn).";
    if (/(^|[;&|]\s*)(printenv|env|set)\s*($|[;&|])/.test(cmd)) return "Et bart printenv/env/set skriver ut hele miljøet, med hemmelighetene. Spør etter navnet i stedet.";
  }
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    process.exit(0);
  }
  const reason = decide(input);
  if (reason) {
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
  }
  process.exit(0);
}
