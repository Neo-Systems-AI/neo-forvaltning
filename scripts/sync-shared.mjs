#!/usr/bin/env node
// De felles modulene i `shared/` kopieres inn i hver plugin (`scripts/lib/`), fordi en plugin installeres alene og
// ikke kan lese utenfor sin egen mappe. `shared/` er kilden; kjør denne etter en endring der, og `check` stopper en
// kopi som har glidd.
//
//   node scripts/sync-shared.mjs [--check] [--root <dir>]
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Hvilke moduler hver plugin får: config-modulen alle, kall-modulene bare de som snakker med et eksternt system.
export const MODULES = {
  "neo-config/neo-config.mjs": () => true,
  "neo-kall/hemmeligheter.mjs": (keys) => keys?.environments || keys?.plugin === "forvaltning",
  "neo-kall/http.mjs": (keys) => keys?.environments,
  "neo-kall/maskinporten.mjs": (keys) => keys?.maskinporten,
};

export function plan(root) {
  const out = [];
  const plugins = existsSync(join(root, "plugins")) ? readdirSync(join(root, "plugins"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  for (const p of plugins) {
    const kf = join(root, "plugins", p, "neo-config.keys.json");
    const keys = existsSync(kf) ? JSON.parse(readFileSync(kf, "utf8")) : null;
    for (const [mod, wants] of Object.entries(MODULES)) {
      if (!wants(keys)) continue;
      const src = join(root, "shared", mod);
      const dst = join(root, "plugins", p, "scripts", "lib", mod.split("/")[1]);
      const same = existsSync(dst) && readFileSync(src, "utf8") === readFileSync(dst, "utf8");
      out.push({ plugin: p, mod, src, dst, same });
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const root = args.includes("--root") ? args[args.indexOf("--root") + 1] : process.cwd();
  const items = plan(root);
  if (args.includes("--check")) {
    const off = items.filter((i) => !i.same);
    for (const i of off) console.log(`✗ plugins/${i.plugin}/scripts/lib/${i.mod.split("/")[1]} er ikke lik shared/${i.mod}. Kjør node scripts/sync-shared.mjs`);
    process.exit(off.length ? 1 : 0);
  }
  for (const i of items.filter((x) => !x.same)) {
    mkdirSync(join(i.dst, ".."), { recursive: true });
    copyFileSync(i.src, i.dst);
    console.log(`kopiert: ${i.mod} → plugins/${i.plugin}`);
  }
}
