import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Oppskriftene har ingen kunnskap av egen; de viser til reglene. En henvisning til en regel som ikke finnes, eller en
// lenke til en oppskrift som ikke finnes, sender den som bygger, til noe som ikke er der.
const DOCS = join(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const OPP = join(DOCS, "oppskrifter");
const MON = join(DOCS, "monstre");

const ids = (file) => new Set([...readFileSync(join(MON, file), "utf8").matchAll(/^id: (\S+)/gm)].map((m) => m[1]));

test("hver regel en oppskrift viser til, finnes i den fila i mønstrene", () => {
  const missing = [];
  for (const f of readdirSync(OPP).filter((x) => x.endsWith(".md"))) {
    const text = readFileSync(join(OPP, f), "utf8");
    for (const [, file, id] of text.matchAll(/\.\.\/monstre\/([0-9a-z-]+\.md)#([a-z0-9-]+)/g)) {
      if (!existsSync(join(MON, file)) || !ids(file).has(id)) missing.push(`${f}: ${file}#${id}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("hver lenke mellom oppskriftene peker på en oppskrift som finnes", () => {
  const missing = [];
  for (const f of readdirSync(OPP).filter((x) => x.endsWith(".md"))) {
    for (const [, target] of readFileSync(join(OPP, f), "utf8").matchAll(/\]\(([a-z0-9-]+\.md)(#[^)]*)?\)/g)) {
      if (!existsSync(join(OPP, target))) missing.push(`${f} → ${target}`);
    }
  }
  assert.deepEqual(missing, []);
});
