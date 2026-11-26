// Reglene i mønstrene for god konfig (`plugins/solution/docs/monstre/`) som kan sjekkes maskinelt, kjørt på
// konfigfilene i oppsett/. Hver sjekk har regelens id, nivå og hvorfor, og sjekker bare den delen av regelen som kan
// avgjøres uten skjønn. Et avvik med vilje står i design/ med regelens id og grunnen, og meldes ikke på nytt.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { isMap, items, mdFiles, text } from "./les.mjs";

export const CHECKS = [
  { name: "monstre", about: "Konfigfilene følger reglene i mønstrene som sjekkes maskinelt, eller avviket står i design/ med grunnen" },
  { name: "avvik", about: "Hvert avvik i design/ viser til en regel som finnes, og har grunnen" },
];

const label = (o) => o?.name ?? o?.label ?? o?.slug ?? "(uten navn)";
const blank = (v) => !String(v ?? "").trim();
const dupes = (xs, key) => {
  const seen = new Map();
  for (const o of xs) {
    const k = String(o.spec?.[key] ?? "").trim().toLowerCase();
    if (k) seen.set(k, [...(seen.get(k) ?? []), o]);
  }
  return [...seen.values()].filter((g) => g.length > 1);
};

// `needs` er typene sjekken leser. `run` gir funnene, hvert med fila det gjelder.
export const RULES = [
  {
    name: "navn-er-nokkelen", doc: "00-navn-pakking-og-versjoner.md", level: "rødt", needs: ["caseType"],
    why: "Navnet er unikt per eier; to sakstyper med samme navn kan ikke skilles, og en ny kopi får et tillegg i navnet",
    run: ({ caseType }) => dupes(caseType.map((x) => ({ ...x, spec: x.doc.spec })), "name").flatMap((g) => g.map((x) => ({ fil: x.fil, melding: `${g.length} sakstyper heter «${label(g[0].spec)}» (${g.map((y) => y.fil).join(", ")})` }))),
  },
  {
    name: "navn-og-slug", doc: "01-sakstype.md", level: "gult", needs: ["caseType"],
    why: "Beskrivelsen sier hva saken gjelder og hvor den kommer fra; saksbehandlerne og KI-en velger sakstype etter den",
    run: ({ caseType }) => caseType.filter((x) => blank(x.doc.spec.description)).map((x) => ({ fil: x.fil, melding: `Sakstypen «${label(x.doc.spec)}» har ingen beskrivelse` })),
  },
  {
    name: "ki-forslag-med-vilje", doc: "05-felt-og-saksdata.md", level: "gult", needs: ["caseType", "customFieldDefinition"],
    why: "Uten kriteriet har modellen bare etiketten, og forslaget merkes med at kriteriet mangler",
    run: ({ caseType, customFieldDefinition }) =>
      [
        ...caseType.flatMap((x) => (x.doc.spec.customFields ?? []).map((c) => ({ c, where: `sakstypen «${label(x.doc.spec)}»`, fil: x.fil }))),
        ...customFieldDefinition.map((x) => ({ c: x.doc.spec, where: "org-en", fil: x.fil })),
      ]
        .filter(({ c }) => c?.aiSuggestions === true && blank(c.extractionCriterion))
        .map(({ c, where, fil }) => ({ fil, melding: `Feltet «${label(c)}» i ${where} har KI-forslag uten kriterium` })),
  },
  {
    name: "flyt-aktivering", doc: "07-flyt.md", level: "gult", needs: ["workflow"],
    why: "En flyt som skrives til Neo, lander som utkast, og et utkast kjører ikke før noen har lest gapene og aktivert den",
    run: ({ workflow }) => workflow.map((x) => ({ fil: x.fil, melding: `Flyten «${label(x.doc.spec)}» lander som utkast: les gapene og aktiver den i Neo etter skrivingen` })),
  },
];

// Alle regel-id-ene i mønstrene, også de som leses og ikke sjekkes. Bygget inn i sjekken fra docs/monstre/; fra
// kildekoden leses de fra mappa.
const MONSTRE = join(dirname(fileURLToPath(import.meta.url)), "..", "plugins", "solution", "docs", "monstre");
export function ruleIds() {
  // eslint-disable-next-line no-undef
  if (typeof __REGEL_IDER__ !== "undefined") return new Set(__REGEL_IDER__);
  if (!existsSync(MONSTRE)) throw new Error(`Fant ikke mønstrene i ${MONSTRE}`);
  return new Set(readdirSync(MONSTRE).filter((f) => f.endsWith(".md")).flatMap((f) => [...readFileSync(join(MONSTRE, f), "utf8").matchAll(/^id: (\S+)/gm)].map((m) => m[1])));
}

// Avvikene i design/: et item med `avvik: <regel-id>` og `grunn`, og `fil` når avviket bare gjelder én fil.
export function readDeviations(root, places, ids = ruleIds()) {
  const list = [];
  const findings = [];
  for (const place of places) {
    for (const file of mdFiles(root, `${place.dir}/design`)) {
      for (const it of items(readFileSync(join(root, file), "utf8"))) {
        if (it.error || !isMap(it.fields) || !("avvik" in it.fields)) continue;
        const at = { check: "avvik", file, line: it.line };
        const regel = String(it.fields.avvik ?? "");
        if (!ids.has(regel)) findings.push({ ...at, message: `${it.id}: regelen «${regel}» finnes ikke i mønstrene` });
        if (!text(it.fields.grunn)) findings.push({ ...at, message: `${it.id}: grunn mangler: hvorfor regelen brytes med vilje` });
        const fil = it.fields.fil ? `${place.dir}/oppsett/${String(it.fields.fil).replace(/^oppsett\//, "")}` : undefined;
        if (fil && !existsSync(join(root, fil))) findings.push({ ...at, message: `${it.id}: fil ${it.fields.fil} finnes ikke i ${place.dir}/oppsett/` });
        list.push({ regel, place: place.dir, fil, grunn: it.fields.grunn, file });
      }
    }
  }
  return { list, findings };
}

const excused = (deviations, rule, fil) => deviations.find((d) => d.regel === rule && fil.startsWith(`${d.place}/oppsett/`) && (!d.fil || d.fil === fil));

// Reglene på filene. `losning` gir bare funnene i én løsning (felles/ for de felles).
export function runRules(files, { deviations = [], losning } = {}) {
  const byKind = (k) => files.filter((x) => x.kind === k);
  const ctx = new Proxy({}, { get: (_, k) => byKind(k) });
  const mine = (fil) => !losning || fil.startsWith(losning === "felles" ? "felles/" : `losninger/${losning}/`);
  return RULES.map((r) => {
    const base = { rule: r.name, doc: r.doc, level: r.level, why: r.why };
    if (!r.needs.some((k) => byKind(k).length)) return { ...base, state: "ikke vurdert", findings: [], excused: [], missing: r.needs };
    const all = r.run(ctx).filter((x) => mine(x.fil));
    return { ...base, state: "vurdert", findings: all.filter((x) => !excused(deviations, r.name, x.fil)), excused: all.filter((x) => excused(deviations, r.name, x.fil)) };
  });
}

// Funnene i sjekken: rødt stopper, gult sier fra.
export const ruleFindings = (results) =>
  results.flatMap((r) => (r.level === "info" ? [] : r.findings.map((x) => ({ check: "monstre", level: r.level === "rødt" ? "fail" : "warn", file: x.fil, message: `${x.melding} (${r.doc}#${r.rule})` }))));

const ORDER = { rødt: 0, gult: 1, info: 2 };
export function rulesMarkdown(results) {
  const hits = results.filter((r) => r.findings.length).sort((a, b) => ORDER[a.level] - ORDER[b.level]);
  const count = (l) => hits.filter((r) => r.level === l).reduce((n, r) => n + r.findings.length, 0);
  const lines = [`**${count("rødt")} rødt, ${count("gult")} gult, ${count("info")} info** av ${results.length} regler som sjekkes maskinelt.`, ""];
  for (const r of hits) lines.push(`### ${r.level}: ${r.rule}`, `${r.why}. Regelen: ${r.doc}#${r.rule}.`, "", ...r.findings.map((x) => `- \`${x.fil}\`: ${x.melding}`), "");
  const excused = results.filter((r) => r.excused.length);
  if (excused.length) lines.push("Avvik med vilje (står i design/):", ...excused.flatMap((r) => r.excused.map((x) => `- ${r.rule}: \`${x.fil}\``)), "");
  const notRun = results.filter((r) => r.state === "ikke vurdert");
  if (notRun.length) lines.push(`Ikke vurdert, fordi repoet ikke har filer av typen (det er ikke grønt): ${notRun.map((r) => `${r.rule} (${r.missing.join(", ")})`).join("; ")}.`);
  return `${lines.join("\n")}\n`;
}
