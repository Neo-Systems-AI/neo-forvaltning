#!/usr/bin/env node
// Vakten for hemmelighetene (PreToolUse): agenten leser, skriver og viser aldri `.env`, `.env.*` eller `.keys/`, og
// kjører aldri hentingen fra hvelvet. En verdi i transkriptet er en verdi som har forlatt eieren. Skriptene som trenger
// hemmelighetene, leser dem selv uten å skrive dem ut. Kan vakten ikke lese hva verktøyet skal gjøre, stopper den.
import { readFileSync } from "node:fs";

// `.env`, `.env.local`, `.env.test` …, og `.keys` med alt under. Ikke `.envrc` eller `process.env`.
export const SECRET_PATH = /(^|[\s"'/=<>(])(\.env(\.[\w.-]+)?|\.keys)(?=$|[\s"'/;|&)<>])/;
// Kommandoer som bare ser om fila finnes eller er ignorert, uten å vise innholdet.
const HARMLESS = /^\s*(ls(\s+-\w+)*|test\s+-[ef]|git\s+check-ignore(\s+-\w+)*)\s+[^;&|`$()<>]*$/;

const SHOW = "Bruk /config:show-secrets for å se hva som er satt (bare navn).";

export function decide(input) {
  if (!input || typeof input !== "object" || typeof input.tool_name !== "string") return "Vakten kunne ikke lese hva verktøyet skal gjøre, og stopper det.";
  const tool = input.tool_name;
  const ti = input.tool_input ?? {};
  if (["Read", "Edit", "Write", "NotebookEdit", "Grep", "Glob"].includes(tool)) {
    const paths = [ti.file_path, ti.notebook_path, ti.path, ti.pattern && tool === "Glob" ? ti.pattern : undefined, ti.glob].filter(Boolean);
    if (paths.some((p) => SECRET_PATH.test(` ${p}`))) return `Fila har hemmeligheter. Agenten leser og skriver dem aldri; skriptene leser dem selv. ${SHOW}`;
  }
  if (tool === "Bash") {
    const cmd = String(ti.command ?? "");
    if (/hent-hemmeligheter\.mjs[^|;&]*--hent/.test(cmd)) return "Hentingen fra hvelvet kjøres av et menneske, med sin egen innlogging. Be personen kjøre den selv.";
    if (SECRET_PATH.test(cmd) && !HARMLESS.test(cmd)) return `Kommandoen rører en fil med hemmeligheter. ${SHOW}`;
    if (/(^|[;&|]\s*)(printenv|env|set|export\s+-p)\s*($|[;&|])/.test(cmd)) return "Et bart printenv/env/set skriver ut hele miljøet, med hemmelighetene. Spør etter navnet i stedet.";
  }
  return null;
}

const deny = (reason) => console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = null;
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    input = null;
  }
  const reason = decide(input);
  if (reason) deny(reason);
  process.exit(0);
}
