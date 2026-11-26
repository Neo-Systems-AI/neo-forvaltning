#!/usr/bin/env node
// De felles modulene i `shared/` kopieres inn i pluginene (`scripts/lib/`), fordi en plugin installeres alene og ikke
// kan lese utenfor sin egen mappe. Hva hver plugin får, avledes av importene: et skript i pluginen som importerer
// `./lib/<modul>.mjs` (eller en skill som kjører `scripts/lib/<modul>.mjs`), får modulen, og det modulen selv
// importerer fra `shared/`. `shared/` er kilden; kjør denne etter en endring der, og `check` stopper en kopi som har
// glidd, og en kopi ingen importerer.
//
// Nøkkelfilene til alle pluginene samles også i `plugins/forvaltning/scripts/nokler.json`, så sjekken av oppsettet vet
// hva hver plugin trenger uten å lete etter dem der Claude Code har installert dem.
//
//   node scripts/sync-shared.mjs [--root <dir>]
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const walk = (dir) => (existsSync(dir) ? readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)])) : []);
const imports = (file) => [...readFileSync(file, "utf8").matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1]);

// Modulene en plugin trenger: det skriptene importerer fra lib/, og det de modulene importerer igjen.
export function needs(root, plugin) {
  const scripts = join(root, "plugins", plugin, "scripts");
  const want = new Set();
  const queue = [];
  for (const f of walk(scripts).filter((f) => f.endsWith(".mjs") && !relative(scripts, f).startsWith("lib/"))) {
    for (const spec of imports(f)) {
      const m = spec.match(/^(?:\.\/|\.\.\/)+lib\/([\w-]+\.mjs)$/);
      if (m) queue.push(m[1]);
    }
  }
  for (const f of walk(join(root, "plugins", plugin, "skills")).filter((f) => f.endsWith(".md"))) {
    for (const [, mod] of readFileSync(f, "utf8").matchAll(/scripts\/lib\/([\w-]+\.mjs)/g)) queue.push(mod);
  }
  while (queue.length) {
    const mod = queue.shift();
    if (want.has(mod)) continue;
    want.add(mod);
    const src = join(root, "shared", mod);
    if (!existsSync(src)) continue;
    for (const spec of imports(src)) {
      const m = spec.match(/^\.\/([\w-]+\.mjs)$/);
      if (m) queue.push(m[1]);
    }
  }
  return [...want].sort();
}

// Kopiene: det som skal være der (`same` når den er lik shared/), det som mangler i shared/, og det ingen importerer.
export function plan(root) {
  const out = [];
  const plugins = existsSync(join(root, "plugins")) ? readdirSync(join(root, "plugins"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  for (const p of plugins) {
    const lib = join(root, "plugins", p, "scripts", "lib");
    const want = needs(root, p);
    for (const mod of want) {
      const src = join(root, "shared", mod);
      const dst = join(lib, mod);
      if (!existsSync(src)) out.push({ plugin: p, mod, missing: true });
      else out.push({ plugin: p, mod, src, dst, same: existsSync(dst) && readFileSync(src, "utf8") === readFileSync(dst, "utf8") });
    }
    for (const f of existsSync(lib) ? readdirSync(lib) : []) if (!want.includes(f)) out.push({ plugin: p, mod: f, dst: join(lib, f), unused: true });
  }
  if (plugins.includes("forvaltning")) {
    const dst = join(root, "plugins/forvaltning/scripts/nokler.json");
    const text = keysText(root, plugins);
    out.push({ plugin: "forvaltning", mod: "nokler.json", dst, text, same: existsSync(dst) && readFileSync(dst, "utf8") === text });
  }
  return out;
}

// Nøkkelfilene til alle pluginene, i én fil: { <plugin>: { keys, nokler } }.
export function keysText(root, plugins) {
  const all = {};
  for (const p of [...plugins].sort()) {
    const f = join(root, "plugins", p, "neo-config.keys.json");
    if (!existsSync(f)) continue;
    const { plugin, ...rest } = JSON.parse(readFileSync(f, "utf8"));
    all[plugin] = rest;
  }
  return `${JSON.stringify(all, null, 2)}\n`;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  const root = args.includes("--root") ? args[args.indexOf("--root") + 1] : process.cwd();
  for (const i of plan(root)) {
    if (i.missing) console.log(`✗ plugins/${i.plugin} importerer lib/${i.mod}, som ikke finnes i shared/`);
    else if (i.unused) {
      rmSync(i.dst);
      console.log(`fjernet: plugins/${i.plugin}/scripts/lib/${i.mod} (ingen importerer den)`);
    } else if (!i.same && i.text !== undefined) {
      writeFileSync(i.dst, i.text);
      console.log(`skrevet: plugins/${i.plugin}/scripts/${i.mod}`);
    } else if (!i.same) {
      mkdirSync(join(i.dst, ".."), { recursive: true });
      copyFileSync(i.src, i.dst);
      console.log(`kopiert: shared/${i.mod} → plugins/${i.plugin}`);
    }
  }
}
