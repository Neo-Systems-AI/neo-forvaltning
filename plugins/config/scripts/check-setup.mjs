#!/usr/bin/env node
// Oppsettet i repoet for hver plugin fra neo-forvaltning som er på: hva pluginen leser fra `.claude/neo.config.json`,
// hva som er satt, hvor verdien kom fra, og hva som mangler. Pluginene sier selv hva de leser
// (`neo-config.keys.json`); dette skriptet leser nøkkelfila til hver av dem der Claude Code har installert dem.
// Bare lesing.
//
//   node check-setup.mjs [--json]
//   node check-setup.mjs --sti <plugin>     mappa en annen plugin fra markedsplassen er installert i
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { check, load, pluginKeys, validate } from "./lib/neo-config.mjs";
import { lookup } from "./lib/mcp-server.mjs";

export const MARKET = "neo-forvaltning";
const PLUGIN_ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");

const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
};

// Pluginene som er på i repoet: `enabledPlugins` i `.claude/settings.json` og `.claude/settings.local.json`.
export function enabled(root) {
  const on = new Map();
  for (const f of ["settings.json", "settings.local.json"]) {
    for (const [id, v] of Object.entries(readJson(join(root, ".claude", f))?.enabledPlugins ?? {})) {
      const [name, market] = id.split("@");
      if (market === MARKET) on.set(name, v === true);
    }
  }
  return [...on].filter(([, v]) => v).map(([k]) => k).sort();
}

// Nøkkelfila til en plugin: der Claude Code installerte den, ellers ved siden av denne pluginen (i en klone av
// markedsplassen).
export function keysFor(name, { root, installed = join(homedir(), ".claude/plugins/installed_plugins.json"), pluginRoot = PLUGIN_ROOT } = {}) {
  const entries = readJson(installed)?.plugins?.[`${name}@${MARKET}`] ?? [];
  const ranked = [...entries].sort((a, b) => Number(b.projectPath === root) - Number(a.projectPath === root));
  for (const e of ranked) {
    const f = join(e.installPath ?? "", "neo-config.keys.json");
    if (e.installPath && existsSync(f)) return { keys: pluginKeys(f), from: e.installPath, version: e.version ?? null };
  }
  const sibling = join(pluginRoot, "..", name, "neo-config.keys.json");
  if (existsSync(sibling)) return { keys: pluginKeys(sibling), from: dirname(sibling), version: readJson(join(dirname(sibling), ".claude-plugin", "plugin.json"))?.version ?? null };
  return null;
}

export function report(data, root, names, opts = {}) {
  const out = [];
  for (const name of names) {
    const found = keysFor(name, { root, ...opts });
    if (!found) {
      out.push({ plugin: name, missing: true, rows: [] });
      continue;
    }
    out.push({ plugin: name, version: found.version, rows: check(data ?? {}, found.keys) });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const { found, data, errors } = load();
  const root = found?.root ?? process.cwd();
  if (args.includes("--sti")) {
    const name = args[args.indexOf("--sti") + 1];
    const hit = keysFor(name, { root });
    if (!hit) {
      console.error(`${name} er ikke installert. Kjør /plugin install ${name}@${MARKET}.`);
      process.exit(1);
    }
    console.log(hit.from);
    process.exit(0);
  }
  if (!data) console.log(`❌ ${errors.join("\n")}\n`);
  else console.log(`Config: ${found.path}${errors.length ? `\n${errors.map((e) => `❌ ${e}`).join("\n")}` : ""}\n`);
  let names = enabled(root);
  if (!names.length) {
    console.log(`Ingen plugins fra ${MARKET} er på i .claude/settings.json. Viser config.\n`);
    names = ["config"];
  }
  const result = report(data, root, names);
  if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else {
    let sharedShown = false;
    for (const p of result) {
      console.log(`## ${p.plugin}${p.version ? ` ${p.version}` : ""}\n`);
      // Den felles delen (neo.*) vises én gang, under den første pluginen som leser den.
      if (sharedShown) p.rows = p.rows.filter((r) => !r.path.startsWith("neo."));
      else if (p.rows.some((r) => r.path.startsWith("neo."))) sharedShown = true;
      if (p.missing) {
        console.log(`❌ Er på i settings.json, men er ikke installert. Kjør /plugin install ${p.plugin}@${MARKET}.\n`);
        continue;
      }
      if (!p.rows.length) {
        console.log("Leser ingenting fra config-fila.\n");
        continue;
      }
      console.log("| Nøkkel | Verdi | Kilde | Hva |\n|---|---|---|---|");
      for (const r of p.rows) console.log(`| ${r.ok ? "" : "❌ "}\`${r.path}\` | ${r.value === undefined ? "—" : JSON.stringify(r.value)} | ${r.source}${r.required ? ", påkrevd" : ""} | ${r.doc} |`);
      console.log("");
    }
    if (data) {
      console.log("## MCP-serverne\n");
      for (const env of data.neo?.environments ?? []) {
        const m = lookup(data, env, { root });
        console.log(m.error ? `- ❌ ${env}: ${m.error}` : `- ${m.iRepoet ? "" : "❌ "}${env}: ${m.mcpServer}${m.iRepoet ? " står i .mcp.json" : " står ikke i .mcp.json"}`);
      }
    }
  }
  const bad = !data || validate(data).length || result.some((p) => p.missing || p.rows.some((r) => !r.ok));
  process.exit(bad ? 1 : 0);
}
