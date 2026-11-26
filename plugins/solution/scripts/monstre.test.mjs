import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RULES } from "./rules.mjs";

// Mønstrene og sjekkene er ett regelsett: hver sjekk i rules.mjs er en regel i mønstrene med samme id, og hver regel som
// sier at den sjekkes maskinelt, har en sjekk. Mønstrene står i docs/ i pluginen, ved siden av skriptet.
const MONSTRE = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "monstre");

test("hver sjekk er en regel i mønstrene i pluginen, og hver regel som sjekkes maskinelt, har en sjekk", () => {
  for (const r of RULES) assert.match(readFileSync(join(MONSTRE, r.doc), "utf8"), new RegExp(`^id: ${r.name}\\n(?:.*\\n)*?sjekkes: maskinelt`, "m"), `${r.doc}#${r.name}`);
  const marked = readdirSync(MONSTRE).filter((f) => f.endsWith(".md")).flatMap((f) =>
    readFileSync(join(MONSTRE, f), "utf8").split(/^```yaml$/m).slice(1).map((b) => b.split("```")[0])
      .filter((b) => /^sjekkes: maskinelt$/m.test(b)).map((b) => b.match(/^id: (\S+)/m)[1]));
  assert.deepEqual(marked.sort(), RULES.map((r) => r.name).sort());
});
