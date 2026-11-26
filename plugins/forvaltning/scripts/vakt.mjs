#!/usr/bin/env node
// Vakten for hemmelighetene (PreToolUse): agenten henter aldri en verdi fra hvelvet selv, og leser aldri en fil med
// hemmeligheter. Skriptene som trenger en verdi, henter den selv for kjøringen og skriver den aldri ut. Vakten er en dytt
// mot uhell, ikke en sperre: med personens innlogging kan et skript agenten skriver selv, nå hvelvet. Det er personen
// som ser over agenten, som er sperren.
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SECRET_PATH = /(^|[\s"'/=])(\.env(\.[\w.-]+)?(?=$|[\s"'])|\.keys\/)/;
const SHOWS = /\b(cat|less|more|head|tail|bat|grep|rg|awk|sed|cp|base64|xxd|od|strings|source|\.)\s/;
const FETCH = /\bkeyvault\s+secret\s+(show|download|backup)\b|\bop\s+read\b|\bop\s+item\s+get\b/;

export function decide(input) {
  const tool = input?.tool_name;
  const ti = input?.tool_input ?? {};
  if (["Read", "Edit", "Write", "NotebookEdit"].includes(tool) && SECRET_PATH.test(` ${ti.file_path ?? ti.notebook_path ?? ""}`)) {
    return "Fila kan ha hemmeligheter. Agenten leser og skriver dem aldri. Hemmelighetene ligger i hvelvet, og skriptene henter dem selv.";
  }
  if (tool === "Bash") {
    const cmd = String(ti.command ?? "");
    if (FETCH.test(cmd) && !/attributes\.enabled/.test(cmd)) return "Agenten henter aldri en verdi fra hvelvet selv. Skriptene som trenger den, henter den for kjøringen. Bruk /forvaltning:hemmeligheter for å se hva repoet viser til og om du når det (bare navn).";
    if (SECRET_PATH.test(cmd) && SHOWS.test(cmd)) return "Kommandoen ville vist en fil med hemmeligheter. Hemmelighetene ligger i hvelvet, og skriptene henter dem selv.";
    if (/(^|[;&|]\s*)(printenv|env|set)\s*($|[;&|])/.test(cmd)) return "Et bart printenv/env/set skriver ut hele miljøet, med hemmelighetene. Spør etter navnet i stedet.";
  }
  return null;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
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
