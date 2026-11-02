import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { markdown, run } from "./rules.mjs";

const snap = () => {
  const dir = mkdtempSync(join(tmpdir(), "konfig-"));
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
  assert.deepEqual(byRule["sakstype-navn-dobbelt"].findings, ["2 sakstyper heter «Skjenking»"]);
  assert.deepEqual(byRule["sakstype-uten-beskrivelse"].findings, ["Sakstypen «skjenking » har ingen beskrivelse"]);
  assert.deepEqual(byRule["ki-felt-uten-kriterium"].findings, ["Feltet «belop» har KI-forslag uten kriterium"]);
});

test("en regel uten fila sier ikke vurdert, ikke ok", () => {
  const r = run(snap()).find((x) => x.rule === "flyt-ikke-publisert");
  assert.equal(r.state, "ikke vurdert");
  assert.deepEqual(r.missing, ["list_workflows.json"]);
});

test("en avslått regel kjøres ikke, og rapporten har rødt først", () => {
  const results = run(snap(), { off: ["felt-uten-hjelpetekst"] });
  assert.equal(results.find((r) => r.rule === "felt-uten-hjelpetekst").state, "slått av");
  const md = markdown(results);
  assert.ok(md.indexOf("rødt: sakstype-navn-dobbelt") < md.indexOf("gult: sakstype-uten-beskrivelse"));
  assert.match(md, /Ikke vurdert/);
});
