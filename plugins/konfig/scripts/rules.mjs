#!/usr/bin/env node
// Reglene for oppsettet i Neo, kjørt på et normalisert snapshot (forvaltning). Hver regel har navn, nivå og hvorfor,
// og sier «ikke vurdert» når fila den trenger, mangler, i stedet for å si at alt er i orden. En regel kunden ikke vil
// ha, slås av i `.claude/neo.config.json` (`konfig.off`).
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

export const RULES = [
  {
    name: "sakstype-uten-beskrivelse", level: "gult", needs: ["list_case_types.json"],
    why: "Saksbehandlerne og KI-en velger sakstype etter beskrivelsen",
    run: ({ caseTypes }) => caseTypes.filter((c) => !String(c.description ?? "").trim()).map((c) => `Sakstypen «${label(c)}» har ingen beskrivelse`),
  },
  {
    name: "sakstype-navn-dobbelt", level: "rødt", needs: ["list_case_types.json"],
    why: "To sakstyper med samme navn kan ikke skilles i lister og rapporter",
    run: ({ caseTypes }) => dupes(caseTypes, "name").map((g) => `${g.length} sakstyper heter «${label(g[0])}»`),
  },
  {
    name: "felt-uten-hjelpetekst", level: "info", needs: ["list_custom_fields.json"],
    why: "En hjelpetekst sier hva som skal stå i feltet, og KI-en bruker den",
    run: ({ fields }) => fields.filter((f) => !String(f.helpText ?? "").trim()).map((f) => `Feltet «${label(f)}» har ingen hjelpetekst`),
  },
  {
    name: "felt-etikett-dobbelt", level: "gult", needs: ["list_custom_fields.json"],
    why: "To felt med samme etikett på samme sted forveksles",
    run: ({ fields }) => dupes(fields, "label").map((g) => `${g.length} felt har etiketten «${g[0].label}»`),
  },
  {
    name: "ki-felt-uten-kriterium", level: "gult", needs: ["list_custom_fields.json"],
    why: "Et felt der KI-en foreslår verdien, trenger et kriterium for hva den skal hente ut",
    run: ({ fields }) => fields.filter((f) => f.aiSuggestions === true && !String(f.extractionCriterion ?? "").trim()).map((f) => `Feltet «${label(f)}» har KI-forslag uten kriterium`),
  },
  {
    name: "flyt-ikke-publisert", level: "gult", needs: ["list_workflows.json"],
    why: "En flyt som ikke er publisert, kjører ikke",
    run: ({ flows }) => flows.filter((w) => w.isPublished === false).map((w) => `Flyten «${label(w)}» er ikke publisert`),
  },
  {
    name: "flyt-uten-beskrivelse", level: "info", needs: ["list_workflows.json"],
    why: "Den som feilsøker en flyt, trenger å vite hva den skal gjøre",
    run: ({ flows }) => flows.filter((w) => !String(w.description ?? "").trim()).map((w) => `Flyten «${label(w)}» har ingen beskrivelse`),
  },
  {
    name: "oppgave-uten-frist", level: "info", needs: ["get_task_template_set--*.json"],
    why: "En oppgave uten frist blir liggende",
    run: ({ taskSets }) => taskSets.flatMap((s) => items(s.taskTemplates ?? s.templates ?? s.tasks ?? s).filter((t) => t && typeof t === "object" && t.title && t.dueOffsetDays == null).map((t) => `Oppgaven «${t.title}» i «${label(s)}» har ingen frist`)),
  },
];

export function run(dir, { off = [] } = {}) {
  const files = existsSync(dir) ? readdirSync(dir) : [];
  const ctx = {
    caseTypes: items(read(dir, "list_case_types.json")),
    fields: items(read(dir, "list_custom_fields.json")),
    flows: items(read(dir, "list_workflows.json")),
    taskSets: files.filter((f) => f.startsWith("get_task_template_set--")).map((f) => read(dir, f)),
  };
  const has = (need) => (need.includes("*") ? files.some((f) => f.startsWith(need.split("*")[0])) : files.includes(need));
  return RULES.map((r) => {
    if (off.includes(r.name)) return { rule: r.name, level: r.level, state: "slått av", findings: [] };
    if (!r.needs.every(has)) return { rule: r.name, level: r.level, state: "ikke vurdert", findings: [], missing: r.needs.filter((n) => !has(n)) };
    return { rule: r.name, level: r.level, why: r.why, state: "vurdert", findings: r.run(ctx) };
  });
}

const ORDER = { rødt: 0, gult: 1, info: 2 };

export function markdown(results) {
  const hits = results.filter((r) => r.findings.length).sort((a, b) => ORDER[a.level] - ORDER[b.level]);
  const notRun = results.filter((r) => r.state === "ikke vurdert");
  const count = (l) => hits.filter((r) => r.level === l).reduce((n, r) => n + r.findings.length, 0);
  const lines = [`**${count("rødt")} rødt, ${count("gult")} gult, ${count("info")} info** av ${results.length} regler.`, ""];
  for (const r of hits) lines.push(`### ${r.level}: ${r.rule}`, `${r.why}.`, "", ...r.findings.map((f) => `- ${f}`), "");
  if (notRun.length) lines.push(`Ikke vurdert (filen mangler i snapshotet): ${notRun.map((r) => `${r.rule} (${r.missing.join(", ")})`).join("; ")}.`);
  return lines.join("\n") + "\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (!args[0]) {
    console.error("Bruk: node rules.mjs <snapshot-mappe> [--off regel,regel] [--json]");
    process.exit(2);
  }
  // Reglene som er slått av: fra --off, ellers fra konfig.off i config-fila.
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
