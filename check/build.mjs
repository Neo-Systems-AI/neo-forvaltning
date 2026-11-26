#!/usr/bin/env node
// Bygger sjekken til én fil uten avhengigheter, og YAML-leseren til pluginene. Begge committes; CI stopper når de ikke
// er ferske (`node build.mjs --check`).
//
//   plugins/solution/scripts/sjekk.mjs   sjekken (sjekk.mjs med yaml og ajv), med versjonen og regel-id-ene i mønstrene
//   shared/yaml.mjs                       parseYaml med pakken yaml, kopiert inn i pluginene som leser YAML
import { build } from "esbuild";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const pkg = JSON.parse(readFileSync(join(here, "package.json"), "utf8"));
const monstre = join(repo, "plugins/solution/docs/monstre");
const ids = readdirSync(monstre).filter((f) => f.endsWith(".md")).sort().flatMap((f) => [...readFileSync(join(monstre, f), "utf8").matchAll(/^id: (\S+)/gm)].map((m) => m[1]));

export const TARGETS = [
  {
    entry: "sjekk.mjs",
    out: "plugins/solution/scripts/sjekk.mjs",
    head: `// Sjekken ${pkg.version} for et repo laget fra neo-forvaltning-mal. GENERERT fra check/ i neo-forvaltning med\n// \`node check/build.mjs\`: endres der, ikke her. Én fil uten avhengigheter (yaml ${pkg.dependencies.yaml}, ajv ${pkg.dependencies.ajv} er bygget inn).`,
    define: { __VERSJON__: JSON.stringify(pkg.version), __REGEL_IDER__: JSON.stringify(ids) },
    // ajv er CommonJS; i en ESM-bundle trenger den require.
    require: true,
  },
  {
    entry: "yaml.mjs",
    out: "shared/yaml.mjs",
    head: `// YAML-leseren pluginene deler: pakken yaml ${pkg.dependencies.yaml}, den Neo bruker. GENERERT fra check/yaml.mjs i\n// neo-forvaltning med \`node check/build.mjs\`: endres der, ikke her.`,
    define: {},
    minify: true,
    require: true,
  },
];

async function bundle(t) {
  const r = await build({
    entryPoints: [join(here, t.entry)],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    target: "node22",
    legalComments: "none",
    minify: !!t.minify,
    define: t.define,
    banner: { js: `${t.head}${t.require ? `\nimport { createRequire as __createRequire } from "node:module";\nconst require = __createRequire(import.meta.url);` : ""}` },
    logLevel: "silent",
    absWorkingDir: here,
  });
  return r.outputFiles[0].text;
}

const check = process.argv.includes("--check");
let stale = 0;
for (const t of TARGETS) {
  const text = await bundle(t);
  const dest = join(repo, t.out);
  let have = null;
  try {
    have = readFileSync(dest, "utf8");
  } catch {}
  if (check) {
    if (have !== text) {
      stale++;
      console.log(`✗ ${t.out} er ikke bygget fra check/${t.entry}. Kjør: cd check && npm ci && node build.mjs`);
    }
  } else if (have !== text) {
    writeFileSync(dest, text);
    console.log(`bygget: ${t.out} (${Math.round(text.length / 1024)} kB)`);
  }
}
if (check) process.exit(stale ? 1 : 0);
