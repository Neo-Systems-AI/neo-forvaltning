#!/usr/bin/env node
// Kontrollen for repoet: markedsplassen og hver plugin har samme form, og ingenting internt hos Neo Systems eller
// om en kunde kommer med, fordi repoet er offentlig. CI kjører den på hver PR; hver sjekk skriver sin rad i
// sammendraget, også de grønne, og hvert funn er en merknad på fila.
//
//   node scripts/check.mjs [--annotate] [--summary] [--root <dir>]
import { appendFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { plan } from "./sync-shared.mjs";

export const CHECKS = [
  { name: "manifests", about: "Markedsplassen og hver plugin har et gyldig manifest med beskrivelse og lisens" },
  { name: "listed", about: "Hver plugin-mappe står i markedsplassen, og hver oppføring har mappa si" },
  { name: "versions", about: "Versjonen er lik i plugin.json og marketplace.json" },
  { name: "hooks", about: "Hvert skript en hook nevner, finnes" },
  { name: "public", about: "Ingenting internt eller om en kunde: interne verter, repoer og stier" },
  { name: "config", about: "Hver plugin har neo-config.keys.json, og kopiene av de felles modulene er like shared/" },
];

// Det som aldri skal stå i et offentlig repo. Kundenavn holdes ute ved review; her står det som kan sjekkes.
export const INTERNAL = [
  { re: /\.ghe\.com/i, why: "en intern GitHub-vert" },
  { re: /Neo-Systems-AS\//, why: "et internt repo" },
  { re: /\b(memory|methods)#\d+/, why: "en intern PR" },
  { re: /\/Users\/[a-z]/i, why: "en lokal sti" },
  { re: /~\/Code\//, why: "en lokal sti" },
  { re: /\bkv-neo[\w-]*/i, why: "et nøkkelhvelv" },
];

const SKIP = new Set([".git", "node_modules"]);
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    if (SKIP.has(n)) return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const readJson = (root, file, findings, check) => {
  try {
    return JSON.parse(readFileSync(join(root, file), "utf8"));
  } catch (e) {
    findings.push({ check, file, message: existsSync(join(root, file)) ? `Ikke gyldig JSON: ${e.message}` : "Mangler" });
    return null;
  }
};

export function run(root) {
  const f = [];
  const market = readJson(root, ".claude-plugin/marketplace.json", f, "manifests");
  if (market) {
    for (const k of ["name", "owner", "plugins"]) if (!market[k]) f.push({ check: "manifests", file: ".claude-plugin/marketplace.json", message: `«${k}» mangler` });
    const folders = existsSync(join(root, "plugins")) ? readdirSync(join(root, "plugins"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
    const entries = new Map((market.plugins ?? []).map((p) => [p.name, p]));
    for (const dir of folders) if (!entries.has(dir)) f.push({ check: "listed", file: `plugins/${dir}`, message: "Står ikke i marketplace.json, så ingen kan installere den" });
    for (const [name, entry] of entries) {
      const mf = ".claude-plugin/marketplace.json";
      if (entry.source !== `./plugins/${name}`) f.push({ check: "listed", file: mf, message: `${name}: source skal være ./plugins/${name}, ikke ${entry.source}` });
      if (!folders.includes(name)) {
        f.push({ check: "listed", file: mf, message: `${name}: mappa plugins/${name} finnes ikke` });
        continue;
      }
      const pf = `plugins/${name}/.claude-plugin/plugin.json`;
      const plugin = readJson(root, pf, f, "manifests");
      if (!plugin) continue;
      if (plugin.name !== name) f.push({ check: "manifests", file: pf, message: `name er «${plugin.name}», mappa er «${name}»` });
      if (!plugin.description || !entry.description) f.push({ check: "manifests", file: pf, message: `${name}: beskrivelsen mangler (i plugin.json eller marketplace.json)` });
      if (!plugin.license) f.push({ check: "manifests", file: pf, message: `${name}: lisensen mangler. Repoet er offentlig, og uten lisens kan ingen bruke det` });
      if (!plugin.version || plugin.version !== entry.version) {
        f.push({ check: "versions", file: pf, message: `${name}: ${plugin.version ?? "ingen versjon"} i plugin.json, ${entry.version ?? "ingen versjon"} i marketplace.json. Bump begge, ellers ser ingen endringen` });
      }
      const hf = `plugins/${name}/hooks/hooks.json`;
      if (existsSync(join(root, hf))) {
        const hooks = readJson(root, hf, f, "hooks");
        for (const cmd of JSON.stringify(hooks ?? {}).match(/\$\{CLAUDE_PLUGIN_ROOT\}\/[^\s"\\]+/g) ?? []) {
          const rel = cmd.replace("${CLAUDE_PLUGIN_ROOT}/", "");
          if (!existsSync(join(root, "plugins", name, rel))) f.push({ check: "hooks", file: hf, message: `Hooken nevner ${rel}, som ikke finnes. En hook som ikke laster, feiler stille` });
        }
      }
    }
  }
  for (const file of walk(root)) {
    const rel = relative(root, file);
    if (rel === "scripts/check.mjs" || rel === "scripts/check.test.mjs") continue;
    const text = readFileSync(file, "utf8");
    text.split("\n").forEach((line, i) => {
      for (const { re, why } of INTERNAL) if (re.test(line)) f.push({ check: "public", file: rel, line: i + 1, message: `Linja nevner ${why}. Repoet er offentlig` });
    });
  }
  const plugins = existsSync(join(root, "plugins")) ? readdirSync(join(root, "plugins"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  for (const p of plugins) {
    const kf = `plugins/${p}/neo-config.keys.json`;
    if (!existsSync(join(root, kf))) f.push({ check: "config", file: kf, message: "Mangler. Hver plugin sier hva den leser fra .claude/neo.config.json, også når det er ingenting" });
    else {
      const keys = readJson(root, kf, f, "config");
      if (keys && keys.plugin !== p) f.push({ check: "config", file: kf, message: `plugin er «${keys.plugin}», mappa er «${p}»` });
    }
  }
  if (existsSync(join(root, "shared"))) {
    for (const i of plan(root).filter((x) => !x.same)) f.push({ check: "config", file: `plugins/${i.plugin}/scripts/lib/${i.mod.split("/")[1]}`, message: `Ikke lik shared/${i.mod}. Kjør node scripts/sync-shared.mjs` });
  }
  return f.map((x) => ({ level: "fail", ...x }));
}

const esc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

export function summary(findings) {
  const rows = CHECKS.map(({ name, about }) => {
    const n = findings.filter((x) => x.check === name).length;
    return `| ${name} | ${about} | ${n ? `❌ ${n} å rette` : "✅ ok"} |`;
  });
  const details = findings.length ? `\n<details><summary>Funnene</summary>\n\n${findings.map((x) => `- ❌ \`${x.file}${x.line ? `:${x.line}` : ""}\`: ${x.message}`).join("\n")}\n</details>\n` : "";
  return `## Repoet\n\n| Sjekk | Hva den sjekker | Resultat |\n|---|---|---|\n${rows.join("\n")}\n${details}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const root = args.includes("--root") ? args[args.indexOf("--root") + 1] : process.cwd();
  const findings = run(root);
  for (const x of findings) console.log(`✗ ${x.file}${x.line ? `:${x.line}` : ""}: ${x.message}`);
  if (args.includes("--annotate")) for (const x of findings) console.log(`::error file=${x.file}${x.line ? `,line=${x.line}` : ""},title=${x.check}::${esc(x.message)}`);
  if (args.includes("--summary")) {
    const text = summary(findings);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
    else console.log(text);
  }
  if (!findings.length) console.log("Ingen funn.");
  process.exit(findings.length ? 1 : 0);
}
