import { test } from "node:test";
import assert from "node:assert/strict";
import { relock } from "./las-malen.mjs";

const A = "a".repeat(64);
const B = "b".repeat(64);

test("låsen byttes i begge filene, med taggen og sha256, og ingenting annet", () => {
  const files = {
    "check.yml": `REF: "sjekk-v3.0.0"\nSHA256: "${A}"\nuses: actions/checkout@v4\n`,
    "method.json": `curl .../neo-forvaltning/sjekk-v3.0.0/plugins/... && echo "${A}  $f"`,
  };
  const out = relock(files, "sjekk-v3.1.0", B);
  assert.equal(out["check.yml"], `REF: "sjekk-v3.1.0"\nSHA256: "${B}"\nuses: actions/checkout@v4\n`);
  assert.equal(out["method.json"], `curl .../neo-forvaltning/sjekk-v3.1.0/plugins/... && echo "${B}  $f"`);
});

test("en commit som lås byttes også, og en fil uten nøyaktig én lås stopper", () => {
  const c = "1".repeat(40);
  assert.equal(relock({ f: `${c} ${A}` }, "sjekk-v3.1.0", B).f, `sjekk-v3.1.0 ${B}`);
  assert.throws(() => relock({ f: `sjekk-v3.0.0 ${A} sjekk-v2.0.0` }, "sjekk-v3.1.0", B), /2 versjoner/);
  assert.throws(() => relock({ f: "sjekk-v3.0.0" }, "sjekk-v3.1.0", B), /0 sha256/);
});
