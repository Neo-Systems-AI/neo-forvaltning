import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYaml, YamlFeil } from "./yaml.mjs";

test("kart, lister og skalarer med innrykk", () => {
  const y = `# kommentar
name: inv_utfall          # nøkkelen
type: select
order: 3
filterable: false
label: "Utfall: vedtaket"
options:
  - key: innvilget
    label: Innvilget
  - key: avslag
    label: 'Avslått'
tom:
`;
  assert.deepEqual(parseYaml(y), {
    name: "inv_utfall", type: "select", order: 3, filterable: false, label: "Utfall: vedtaket",
    options: [{ key: "innvilget", label: "Innvilget" }, { key: "avslag", label: "Avslått" }], tom: null,
  });
});

test("flytform over flere linjer og nøstet", () => {
  const y = `_spor:
  krav: [a, b,
         c]   # slutt
  where: { type: field, fieldId: x, value: [ja, usikker] }
`;
  assert.deepEqual(parseYaml(y), { _spor: { krav: ["a", "b", "c"], where: { type: "field", fieldId: "x", value: ["ja", "usikker"] } } });
});

test("tekstblokker med > og |", () => {
  const y = `a: >
  første linje
  andre linje
b: |-
  en
  to
`;
  assert.deepEqual(parseYaml(y), { a: "første linje andre linje\n", b: "en\nto" });
});

test("liste under en nøkkel på samme innrykk, og lister i lister", () => {
  const y = `steps:
- name: Mottak
  rows:
    - columns:
        - width: 12
`;
  assert.deepEqual(parseYaml(y), { steps: [{ name: "Mottak", rows: [{ columns: [{ width: 12 }] }] }] });
});

test("det leseren ikke forstår, gir en feil med linjenummeret", () => {
  assert.throws(() => parseYaml("a: &anker 1\n"), YamlFeil);
  assert.throws(() => parseYaml("a: 1\na: 2\n"), /linje 2: nøkkelen a står to ganger/);
  assert.throws(() => parseYaml("a: [1, 2\n"), /lista mangler/);
});
