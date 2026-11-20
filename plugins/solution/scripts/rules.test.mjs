import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RULES, markdown, run } from "./rules.mjs";

const snap = () => {
  const dir = mkdtempSync(join(tmpdir(), "rules-"));
  writeFileSync(join(dir, "list_case_types.json"), JSON.stringify([
    { slug: "a", name: "Skjenking", description: "Søknad om skjenkebevilling" },
    { slug: "b", name: "skjenking " },
  ]));
  writeFileSync(join(dir, "list_custom_fields.json"), JSON.stringify([
    { name: "belop", label: "Beløp", helpText: "I kroner", aiSuggestions: true, extractionCriterion: "" },
  ]));
  return dir;
};

test("reglene finner det som mangler og det som er dobbelt", () => {
  const byRule = Object.fromEntries(run(snap()).map((r) => [r.rule, r]));
  assert.deepEqual(byRule["navn-er-nokkelen"].findings, ["2 sakstyper heter «Skjenking»"]);
  assert.deepEqual(byRule["navn-og-slug"].findings, ["Sakstypen «skjenking » har ingen beskrivelse"]);
  assert.deepEqual(byRule["ki-forslag-med-vilje"].findings, ["Feltet «belop» har KI-forslag uten kriterium"]);
});

test("en regel uten fila sier ikke vurdert, ikke ok", () => {
  const r = run(snap()).find((x) => x.rule === "flyt-aktivering");
  assert.equal(r.state, "ikke vurdert");
  assert.deepEqual(r.missing, ["list_workflows.json"]);
});

test("en avslått regel kjøres ikke, og rapporten har rødt først med regelen den viser til", () => {
  const results = run(snap(), { off: ["ki-forslag-med-vilje"] });
  assert.equal(results.find((r) => r.rule === "ki-forslag-med-vilje").state, "slått av");
  const md = markdown(results);
  assert.ok(md.indexOf("rødt: navn-er-nokkelen") < md.indexOf("gult: navn-og-slug"));
  assert.match(md, /Regelen: 01-sakstype\.md#navn-og-slug/);
  assert.match(md, /Ikke vurdert/);
});

// Mønstrene og sjekkene er ett regelsett: hver sjekk er en regel i mønstrene med samme id, og hver regel som sier at
// den sjekkes maskinelt, har en sjekk. Mønstrene står i docs/ i repoet, ikke i pluginen.
const MONSTRE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "docs", "monstre");
test("hver sjekk er en regel i mønstrene, og hver regel som sjekkes maskinelt, har en sjekk", { skip: !existsSync(MONSTRE) && "mønstrene er ikke ved siden av" }, () => {
  for (const r of RULES) {
    const text = readFileSync(join(MONSTRE, r.doc), "utf8");
    assert.match(text, new RegExp(`^id: ${r.name}\\n(?:.*\\n)*?sjekkes: maskinelt`, "m"), `${r.doc}#${r.name} finnes ikke, eller sier ikke at den sjekkes maskinelt`);
  }
  const marked = readdirSync(MONSTRE).filter((f) => f.endsWith(".md")).flatMap((f) =>
    readFileSync(join(MONSTRE, f), "utf8").split(/^```yaml$/m).slice(1).map((b) => b.split("```")[0])
      .filter((b) => /^sjekkes: maskinelt$/m.test(b)).map((b) => b.match(/^id: (\S+)/m)[1]));
  assert.deepEqual(marked.sort(), RULES.map((r) => r.name).sort());
});
