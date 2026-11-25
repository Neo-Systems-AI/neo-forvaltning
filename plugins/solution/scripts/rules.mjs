#!/usr/bin/env node
// Reglene i mønstrene for god konfig som kan sjekkes maskinelt, kjørt på konfigfilene i repoet: filene i Neos format
// i hver løsnings `5-oppsett/` og i `organisasjon/5-oppsett/`. Hver sjekk har regelens id, nivå og hvorfor, og sier
// «ikke vurdert» når repoet ikke har filene den trenger, i stedet for å si at alt er i orden. En regel kunden ikke vil
// ha, slås av i `.claude/neo.config.json` (`solution.off`) med id-en.
//
//   node rules.mjs [<repo>] [--losning <navn>] [--off regel,regel] [--json]
import { collect } from "./lib/konfigfiler.mjs";

const label = (o) => o?.name ?? o?.label ?? o?.slug ?? "(uten navn)";
const blank = (v) => !String(v ?? "").trim();
const dupes = (list, key) => {
  const seen = new Map();
  for (const o of list) {
    const k = String(o?.[key] ?? "").trim().toLowerCase();
    if (k) seen.set(k, [...(seen.get(k) ?? []), o]);
  }
  return [...seen.values()].filter((g) => g.length > 1);
};

// Hver sjekk er en regel i mønstrene for god konfig (`docs/monstre/` i pluginen), med samme id, og bare den delen av
// regelen som kan avgjøres uten skjønn. Resten av regelen, og reglene uten sjekk, leses mot mønstrene. `needs` er
// typene sjekken leser.
export const RULES = [
  {
    name: "navn-er-nokkelen", doc: "00-navn-pakking-og-versjoner.md", level: "rødt", needs: ["caseType"],
    why: "Navnet er unikt per eier; to sakstyper med samme navn kan ikke skilles, og en ny kopi får et tillegg i navnet",
    run: ({ caseType }) => dupes(caseType.map((f) => ({ ...f.doc.spec, fil: f.fil })), "name").map((g) => `${g.length} sakstyper heter «${label(g[0])}» (${g.map((x) => x.fil).join(", ")})`),
  },
  {
    name: "navn-og-slug", doc: "01-sakstype.md", level: "gult", needs: ["caseType"],
    why: "Beskrivelsen sier hva saken gjelder og hvor den kommer fra; saksbehandlerne og KI-en velger sakstype etter den",
    run: ({ caseType }) => caseType.filter((f) => blank(f.doc.spec.description)).map((f) => `Sakstypen «${label(f.doc.spec)}» har ingen beskrivelse (${f.fil})`),
  },
  {
    name: "ki-forslag-med-vilje", doc: "05-felt-og-saksdata.md", level: "gult", needs: ["caseType", "customFieldDefinition"],
    why: "Uten kriteriet har modellen bare etiketten, og forslaget merkes med at kriteriet mangler",
    run: ({ caseType, customFieldDefinition }) => [
      ...caseType.flatMap((f) => (f.doc.spec.customFields ?? []).map((c) => ({ c, where: `sakstypen «${label(f.doc.spec)}»`, fil: f.fil }))),
      ...customFieldDefinition.map((f) => ({ c: f.doc.spec, where: "org-en", fil: f.fil })),
    ].filter(({ c }) => c.aiSuggestions === true && blank(c.extractionCriterion)).map(({ c, where, fil }) => `Feltet «${label(c)}» i ${where} har KI-forslag uten kriterium (${fil})`),
  },
  {
    name: "flyt-aktivering", doc: "07-flyt.md", level: "gult", needs: ["workflow"],
    why: "En flyt som skrives til Neo, lander som utkast, og et utkast kjører ikke før noen har lest gapene og aktivert den",
    run: ({ workflow }) => workflow.map((f) => `Flyten «${label(f.doc.spec)}» lander som utkast: les gapene og aktiver den i Neo etter apply (${f.fil})`),
  },
];

export function run(root, { off = [], losning } = {}) {
  const { files } = collect(root);
  const mine = losning ? files.filter((f) => f.eier === losning) : files;
  const byKind = (k) => mine.filter((f) => f.kind === k);
  const ctx = new Proxy({}, { get: (_, k) => byKind(k) });
  return RULES.map((r) => {
    if (off.includes(r.name)) return { rule: r.name, level: r.level, state: "slått av", findings: [] };
    if (!r.needs.some((k) => byKind(k).length)) return { rule: r.name, level: r.level, state: "ikke vurdert", findings: [], missing: r.needs };
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
  if (notRun.length) lines.push(`Ikke vurdert (ingen fil av typen i repoet): ${notRun.map((r) => `${r.rule} (${r.missing.join(", ")})`).join("; ")}.`);
  return lines.join("\n") + "\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const flags = new Set(["--off", "--losning"]);
  const root = args.find((a, i) => !a.startsWith("--") && !flags.has(args[i - 1]));
  // Reglene som er slått av: fra --off, ellers fra off i pluginens del av config-fila.
  let off = arg("--off")?.split(",") ?? null;
  let repo = root;
  if (!off || !repo) {
    const { load, resolve } = await import("./lib/neo-config.mjs");
    const { found, data } = load();
    off ??= data ? resolve(data, "off").value : [];
    repo ??= found?.root ?? process.cwd();
  }
  const results = run(repo, { off, losning: arg("--losning") });
  console.log(args.includes("--json") ? JSON.stringify(results, null, 2) : markdown(results));
  process.exit(results.some((r) => r.level === "rødt" && r.findings.length) ? 1 : 0);
}
