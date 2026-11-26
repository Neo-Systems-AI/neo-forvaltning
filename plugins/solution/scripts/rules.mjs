#!/usr/bin/env node
// Reglene i mønstrene for god konfig som kan sjekkes maskinelt, kjørt på konfigen slik den kjører i et miljø
// (svarene fra list_case_types, list_custom_fields og list_workflows). Hver sjekk har regelens id, nivå og hvorfor, og sier «ikke vurdert» når fila den trenger, mangler, i
// stedet for å si at alt er i orden. En regel kunden ikke vil ha, slås av i `.claude/neo.config.json` med id-en.
//
//   node rules.mjs <snapshot-mappe> [--off regel,regel] [--json]
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const read = (dir, file) => (existsSync(join(dir, file)) ? JSON.parse(readFileSync(join(dir, file), "utf8")) : undefined);
const items = (v) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v).find(Array.isArray) ?? [] : []);
const label = (o) => o?.name ?? o?.title ?? o?.label ?? o?.slug ?? "(uten navn)";
const dupes = (list, key) => {
  const seen = new Map();
  for (const o of list) {
    const k = String(o?.[key] ?? "").trim().toLowerCase();
    if (k) seen.set(k, [...(seen.get(k) ?? []), o]);
  }
  return [...seen.values()].filter((g) => g.length > 1);
};

// Hver sjekk er en regel i mønstrene for god konfig (docs/monstre/ i neo-forvaltning), med samme id, og bare den delen
// av regelen som kan avgjøres uten skjønn. Resten av regelen, og reglene uten sjekk, leses mot mønstrene.
export const RULES = [
  {
    name: "navn-er-nokkelen", doc: "00-navn-pakking-og-versjoner.md", level: "rødt", needs: ["list_case_types.json"],
    why: "Navnet er unikt per eier; to sakstyper med samme navn kan ikke skilles, og en ny kopi får et tillegg i navnet",
    run: ({ caseTypes }) => dupes(caseTypes, "name").map((g) => `${g.length} sakstyper heter «${label(g[0])}»`),
  },
  {
    name: "navn-og-slug", doc: "01-sakstype.md", level: "gult", needs: ["list_case_types.json"],
    why: "Beskrivelsen sier hva saken gjelder og hvor den kommer fra; saksbehandlerne og KI-en velger sakstype etter den",
    run: ({ caseTypes }) => caseTypes.filter((c) => !String(c.description ?? "").trim()).map((c) => `Sakstypen «${label(c)}» har ingen beskrivelse`),
  },
  {
    name: "ki-forslag-med-vilje", doc: "05-felt-og-saksdata.md", level: "gult", needs: ["list_custom_fields.json"],
    why: "Uten kriteriet har modellen bare etiketten, og forslaget merkes med at kriteriet mangler",
    run: ({ fields }) => fields.filter((f) => f.aiSuggestions === true && !String(f.extractionCriterion ?? "").trim()).map((f) => `Feltet «${label(f)}» har KI-forslag uten kriterium`),
  },
  {
    name: "flyt-aktivering", doc: "07-flyt.md", level: "gult", needs: ["list_workflows.json"],
    why: "En flyt er et utkast til noen aktiverer den, og et utkast kjører ikke",
    run: ({ flows }) => flows.filter((w) => w.isPublished === false).map((w) => `Flyten «${label(w)}» er ikke aktivert`),
  },
];

export function run(dir, { off = [] } = {}) {
  const files = existsSync(dir) ? readdirSync(dir) : [];
  const ctx = {
    caseTypes: items(read(dir, "list_case_types.json")),
    fields: items(read(dir, "list_custom_fields.json")),
    flows: items(read(dir, "list_workflows.json")),
  };
  const has = (need) => (need.includes("*") ? files.some((f) => f.startsWith(need.split("*")[0])) : files.includes(need));
  return RULES.map((r) => {
    if (off.includes(r.name)) return { rule: r.name, level: r.level, state: "slått av", findings: [] };
    if (!r.needs.every(has)) return { rule: r.name, level: r.level, state: "ikke vurdert", findings: [], missing: r.needs.filter((n) => !has(n)) };
    return { rule: r.name, doc: r.doc, level: r.level, why: r.why, state: "vurdert", findings: r.run(ctx) };
  });
}

const ORDER = { rødt: 0, gult: 1, info: 2 };

export function markdown(results) {
  const hits = results.filter((r) => r.findings.length).sort((a, b) => ORDER[a.level] - ORDER[b.level]);
  const notRun = results.filter((r) => r.state === "ikke vurdert");
  const count = (l) => hits.filter((r) => r.level === l).reduce((n, r) => n + r.findings.length, 0);
  const lines = [`**${count("rødt")} rødt, ${count("gult")} gult, ${count("info")} info** av ${results.length} regler.`, ""];
  for (const r of hits) lines.push(`### ${r.level}: ${r.rule}`, `${r.why}. Regelen: ${r.doc}#${r.rule}.`, "", ...r.findings.map((f) => `- ${f}`), "");
  if (notRun.length) lines.push(`Ikke vurdert (filen mangler i snapshotet): ${notRun.map((r) => `${r.rule} (${r.missing.join(", ")})`).join("; ")}.`);
  return lines.join("\n") + "\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (!args[0]) {
    console.error("Bruk: node rules.mjs <snapshot-mappe> [--off regel,regel] [--json]");
    process.exit(2);
  }
  // Reglene som er slått av: fra --off, ellers fra off i pluginens del av config-fila.
  let off = args.includes("--off") ? args[args.indexOf("--off") + 1].split(",") : null;
  if (!off) {
    const { load, resolve } = await import("./lib/neo-config.mjs");
    const { data } = load();
    off = data ? resolve(data, "off").value : [];
  }
  const results = run(args[0], { off });
  console.log(args.includes("--json") ? JSON.stringify(results, null, 2) : markdown(results));
  process.exit(results.some((r) => r.level === "rødt" && r.findings.length) ? 1 : 0);
}
