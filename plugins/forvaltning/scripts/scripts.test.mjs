import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectIds, normalize, run, unwrap } from "./normalize.mjs";
import { diffValue, markdown, plan } from "./diff.mjs";

const caseTypes = [
  { id: "u2", slug: "skjenking", name: "Skjenkebevilling", organizationId: "o1", updatedAt: "2026-11-01", statusGroupId: "g1" },
  { id: "u1", slug: "byggesak", name: "Byggesak", organizationId: "o1", updatedAt: "2026-11-01", statusGroupId: "g1" },
];
const groups = [{ id: "g1", key: "standard", name: "Standard" }];

test("id-er og tidsstempler fjernes, referanser blir nøkler, lister sorteres", () => {
  const ids = collectIds([caseTypes, groups]);
  const out = normalize(caseTypes, ids);
  assert.deepEqual(out, [
    { name: "Byggesak", slug: "byggesak", statusGroupId: "ref:standard" },
    { name: "Skjenkebevilling", slug: "skjenking", statusGroupId: "ref:standard" },
  ]);
});

test("MCP-svaret pakkes ut av content", () => {
  assert.deepEqual(unwrap({ content: [{ type: "text", text: JSON.stringify({ a: 1 }) }] }), { a: 1 });
  assert.deepEqual(unwrap({ a: 2 }), { a: 2 });
});

test("sandkasse og produksjon med ulike id-er gir samme fil", () => {
  const prod = normalize(caseTypes, collectIds(caseTypes));
  const sandbox = caseTypes.map((c) => ({ ...c, id: c.id + "-sb", organizationId: "sb" }));
  assert.deepEqual(normalize(sandbox, collectIds(sandbox)), prod);
});

test("diffen matcher på nøkkel, ikke på plass", () => {
  const have = [{ slug: "a", name: "A" }, { slug: "b", name: "B" }];
  const want = [{ slug: "b", name: "B2" }, { slug: "c", name: "C" }];
  assert.deepEqual(diffValue(want, have), [
    { kind: "endret", key: "b", fields: ["name"] },
    { kind: "ny", key: "c" },
    { kind: "fjernet", key: "a" },
  ]);
});

test("planen over to mapper, med fil som ikke er styrt", () => {
  const root = mkdtempSync(join(tmpdir(), "forvaltning-"));
  const raw = join(root, "raw");
  mkdirSync(raw);
  writeFileSync(join(raw, "list_case_types.json"), JSON.stringify({ content: [{ type: "text", text: JSON.stringify(caseTypes) }] }));
  writeFileSync(join(raw, "list_workflows.json"), JSON.stringify([{ id: "w1", name: "Varsel" }]));
  run(raw, join(root, "snap"));
  const snap = JSON.parse(readFileSync(join(root, "snap", "list_case_types.json"), "utf8"));
  const want = join(root, "want");
  mkdirSync(want);
  writeFileSync(join(want, "list_case_types.json"), JSON.stringify([...snap, { slug: "ny", name: "Ny" }]));
  const result = plan(want, join(root, "snap"));
  assert.deepEqual(result, [
    { file: "list_case_types.json", changes: [{ kind: "ny", key: "ny" }] },
    { file: "list_workflows.json", changes: [{ kind: "ikke-styrt", key: "(fila)" }] },
  ]);
  assert.match(markdown(result), /\| `list_case_types.json` \| ny \| ny \|/);
});
