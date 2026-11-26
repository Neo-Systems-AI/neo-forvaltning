// Lista kunden jobber fra: oppgavene i integrasjoner/<system>/hos-kunden.md samlet på tvers av systemene, med det som
// kan gjøres nå, det som venter, og lenken til oppskriften. Lages ved behov og committes ikke; kilden er oppgavene.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { anchor } from "./les.mjs";
import { tasks } from "./struktur.mjs";

// Oppskriftene står i docs/ i pluginene, i repoet til markedsplassen pluginene kommer fra (.claude/settings.json).
export function recipeBase(root) {
  const file = join(root, ".claude/settings.json");
  const repo = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).extraKnownMarketplaces?.["neo-forvaltning"]?.source?.repo : undefined;
  if (!repo) throw new Error(".claude/settings.json sier ikke hvilket repo markedsplassen neo-forvaltning er i (extraKnownMarketplaces), så lista kan ikke lenke til oppskriftene");
  return `https://github.com/${repo}/blob/main/docs/README.md`;
}

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

export function render(root) {
  const base = recipeBase(root);
  const all = tasks(root).filter((t) => !t.error);
  const status = new Map(all.map((t) => [t.ref, t.fields.status]));
  const open = all.filter((t) => t.fields.status !== "ferdig");
  const waiting = (t) => t.etter.filter((e) => status.get(e) !== "ferdig");
  const now = open.filter((t) => !waiting(t).length);
  const later = open.filter((t) => waiting(t).length);
  const row = (t, extra = []) => `| ${t.system} | [${cell(t.title || t.id)}](integrasjoner/${t.system}/hos-kunden.md#${anchor(`${t.id} ${t.title}`)}) | ${cell(t.fields.status)} | ${cell(t.fields.hvem)} | ${extra.map((x) => `${cell(x)} | `).join("")}[${t.system}](${base}) |`;
  const out = ["# Det kunden må gjøre", "", "Oppgavene kunden selv gjør for at Neo skal kobles til systemene, samlet fra `integrasjoner/*/hos-kunden.md`.", ""];
  if (!all.length) return [...out, "Ingen integrasjoner har oppgaver hos kunden ennå.", ""].join("\n");
  out.push("## Nå", "");
  if (now.length) out.push("| System | Oppgaven | Status | Hvem | Oppskriften |", "|---|---|---|---|---|", ...now.map((t) => row(t)), "");
  else out.push("Ingenting kan gjøres nå: alt som står igjen, venter på noe annet.", "");
  if (later.length) out.push("## Senere", "", "| System | Oppgaven | Status | Hvem | Venter på | Oppskriften |", "|---|---|---|---|---|---|", ...later.map((t) => row(t, [waiting(t).join(", ")])), "");
  out.push("## Ferdig", "", `${all.length - open.length} av ${all.length} oppgaver er ferdige.`, "");
  return out.join("\n");
}
