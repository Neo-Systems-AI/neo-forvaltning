import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RULES, markdown, run } from "./rules.mjs";

const caseType = (name, slug, description, fields = "  customFields: []\n") =>
  `apiVersion: neo-config/v1\nkind: caseType\nspec:\n  name: ${name}\n  slug: ${slug}\n  description: ${description}\n${fields}`;
const FIELD = `  customFields:
    - name: belop
      label: Beløp
      helpText: I kroner
      aiSuggestions: true
      extractionCriterion: ""
`;

const repo = (files) => {
  const root = mkdtempSync(join(tmpdir(), "rules-"));
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), text);
  }
  return root;
};

const sample = () => repo({
  "losninger/skjenking/5-oppsett/case-types/a.yaml": caseType("Skjenking", "a", "Søknad om skjenkebevilling", FIELD),
  "losninger/annen/5-oppsett/case-types/b.yaml": caseType('"skjenking "', "b", "null"),
  "organisasjon/5-oppsett/custom-fields/contact-telefon.yaml": "apiVersion: neo-config/v1\nkind: customFieldDefinition\nspec:\n  name: telefon\n  entityType: contact\n  aiSuggestions: true\n  extractionCriterion: Telefonnummeret\n",
  "losninger/skjenking/5-oppsett/spor.yaml": "case-types/a.yaml: [K1]\n",
});

test("reglene leser filene i Neos format og finner det som mangler og det som er dobbelt", () => {
  const byRule = Object.fromEntries(run(sample()).map((r) => [r.rule, r]));
  assert.deepEqual(byRule["navn-er-nokkelen"].findings, ["2 sakstyper heter «Skjenking» (losninger/skjenking/5-oppsett/case-types/a.yaml, losninger/annen/5-oppsett/case-types/b.yaml)"]);
  assert.deepEqual(byRule["navn-og-slug"].findings, ["Sakstypen «skjenking » har ingen beskrivelse (losninger/annen/5-oppsett/case-types/b.yaml)"]);
  assert.deepEqual(byRule["ki-forslag-med-vilje"].findings, ["Feltet «belop» i sakstypen «Skjenking» har KI-forslag uten kriterium (losninger/skjenking/5-oppsett/case-types/a.yaml)"]);
});

test("en regel uten filer av typen sier ikke vurdert, ikke ok, og en flyt sier at den lander som utkast", () => {
  const r = run(sample()).find((x) => x.rule === "flyt-aktivering");
  assert.equal(r.state, "ikke vurdert");
  assert.deepEqual(r.missing, ["workflow"]);
  const withFlow = repo({ "organisasjon/5-oppsett/workflows/varsel.yaml": "apiVersion: neo-config/v1\nkind: workflow\nspec:\n  name: Varsel\n  description: null\n  definition: {}\n  floodLimit: null\n" });
  assert.match(run(withFlow).find((x) => x.rule === "flyt-aktivering").findings[0], /Flyten «Varsel» lander som utkast/);
});

test("én løsning om gangen, en avslått regel kjøres ikke, og rapporten har rødt først med regelen den viser til", () => {
  assert.equal(run(sample(), { losning: "skjenking" }).find((r) => r.rule === "navn-er-nokkelen").findings.length, 0);
  const results = run(sample(), { off: ["ki-forslag-med-vilje"] });
  assert.equal(results.find((r) => r.rule === "ki-forslag-med-vilje").state, "slått av");
  const md = markdown(results);
  assert.ok(md.indexOf("rødt: navn-er-nokkelen") < md.indexOf("gult: navn-og-slug"));
  assert.match(md, /Regelen: 01-sakstype\.md#navn-og-slug/);
  assert.match(md, /Ikke vurdert/);
});

// Mønstrene og sjekkene er ett regelsett: hver sjekk er en regel i mønstrene med samme id, og hver regel som sier at
// den sjekkes maskinelt, har en sjekk. Mønstrene står i pluginen, i docs/monstre/.
const MONSTRE = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "monstre");
test("hver sjekk er en regel i mønstrene, og hver regel som sjekkes maskinelt, har en sjekk", () => {
  for (const r of RULES) {
    const text = readFileSync(join(MONSTRE, r.doc), "utf8");
    assert.match(text, new RegExp(`^id: ${r.name}\\n(?:.*\\n)*?sjekkes: maskinelt`, "m"), `${r.doc}#${r.name} finnes ikke, eller sier ikke at den sjekkes maskinelt`);
  }
  const marked = readdirSync(MONSTRE).filter((f) => f.endsWith(".md")).flatMap((f) =>
    readFileSync(join(MONSTRE, f), "utf8").split(/^```yaml$/m).slice(1).map((b) => b.split("```")[0])
      .filter((b) => /^sjekkes: maskinelt$/m.test(b)).map((b) => b.match(/^id: (\S+)/m)[1]));
  assert.deepEqual(marked.sort(), RULES.map((r) => r.name).sort());
});
