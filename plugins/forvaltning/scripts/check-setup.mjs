#!/usr/bin/env node
// Oppsettet i repoet for hver plugin fra neo-forvaltning som er på: hva pluginen leser fra `.claude/neo.config.json`,
// hva som er satt, hvor verdien kom fra, og hva som mangler, også MCP-serveren per miljø i Neo, referansene til hvelvet
// under `<system>.hemmeligheter` og Maskinporten-klientene pluginene viser til. Hva hver plugin trenger, står i
// `nokler.json` ved siden av (samlet fra nøkkelfilene til alle pluginene). Bare lesing. Exit 1 når noe påkrevd mangler.
//
//   node check-setup.mjs [--json]
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { environments, get, load, neo } from "./lib/neo-config.mjs";
import { ref } from "./lib/hemmeligheter.mjs";

export const MARKET = "neo-forvaltning";
const KEYS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "nokler.json"), "utf8"));

const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
};
const blank = (v) => v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);

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

// En referanse under <system>.hemmeligheter.<navn>.
const hasRef = (data, path) => {
  const [, system, navn] = path.match(/^([^.]+)\.hemmeligheter\.(.+)$/);
  try {
    ref(data, system, navn);
    return { ok: true };
  } catch (e) {
    return { ok: false, why: e.message };
  }
};

// Neo per miljø, for en plugin som snakker med Neo: MCP-serveren er påkrevd, adressen vises.
export function neoRows(data) {
  if (!environments(data).length) return [{ path: "neo.environments", source: "usatt", required: true, ok: false, doc: "Miljøene i Neo: sandkasse og produksjon" }];
  const out = [];
  for (const env of environments(data)) {
    for (const k of ["mcpServer", "url"]) {
      const path = `neo.byEnv.${env}.${k}`;
      const v = get(data, path);
      const unset = blank(v) || (typeof v === "string" && v.includes("<"));
      out.push({ path, value: v, source: unset ? "usatt" : "config", required: k === "mcpServer", ok: k === "url" || !unset, doc: k === "mcpServer" ? `MCP-serveren for ${env} i .mcp.json` : `Adressen til Neo for ${env}` });
    }
  }
  return out;
}

// Radene for én plugin: Neo når den snakker med Neo, hver nøkkel, hver referanse, og klientene den viser til. Nøklene
// står relativt til pluginens del av config-fila (`window` er `monitoring.window`).
export function rows(data, plugin, keys = KEYS) {
  const spec = keys[plugin];
  if (!spec) return [{ path: plugin, ok: false, doc: `${plugin} er ikke en plugin i ${MARKET}` }];
  const out = spec.neo ? neoRows(data) : [];
  for (const k of spec.keys ?? []) {
    const path = `${plugin}.${k.path}`;
    const v = get(data, path);
    const set = !blank(v);
    out.push({ path, value: set ? v : k.fallback, source: set ? "config" : k.fallback !== undefined ? "plugin-standard" : "usatt", required: !!k.required, ok: set || !k.required || k.fallback !== undefined, doc: k.doc });
    if (k.klient && set) {
      const klient = get(data, `maskinporten.klienter.${v}`);
      out.push({ path: `maskinporten.klienter.${v}`, value: klient?.clientId ? `clientId ${klient.clientId}` : undefined, source: klient ? "config" : "usatt", required: true, ok: !!klient?.clientId, doc: `Klienten ${path} viser til, med clientId` });
      if (blank(get(data, "maskinporten.miljo"))) out.push({ path: "maskinporten.miljo", source: "usatt", required: true, ok: false, doc: "Miljøet klientene er registrert i" });
      const kp = `maskinporten.hemmeligheter.${v}-nokkel`;
      const r = hasRef(data, kp);
      out.push({ path: kp, value: r.ok ? get(data, kp).kilde : undefined, source: r.ok ? "referanse" : "mangler", required: true, ok: r.ok, doc: r.ok ? "Nøkkelen til klienten" : r.why });
    }
  }
  for (const h of spec.hemmeligheter ?? []) {
    const paths = h.perKlient ? Object.keys(get(data, "maskinporten.klienter") ?? {}).map((n) => h.path.replace("<klient>", n)) : [h.path];
    for (const path of paths) {
      const r = hasRef(data, path);
      // En valgfri referanse kan mangle, men står den, må den være en referanse.
      const absent = get(data, path) === undefined;
      out.push({ path, value: r.ok ? get(data, path).kilde : undefined, source: r.ok ? "referanse" : absent ? "mangler" : "ikke en referanse", required: !h.valgfri, ok: r.ok || (!!h.valgfri && absent), doc: r.ok ? h.doc : `${h.doc}. ${r.why}` });
    }
  }
  return out;
}

export function report(root, { data, plugins = enabled(root) } = {}) {
  const problems = [];
  if (!plugins.length) problems.push(`Ingen plugins fra ${MARKET} er på i .claude/settings.json (enabledPlugins)`);
  const miljoer = environments(data).map((env) => neo(data, root, env));
  for (const n of miljoer) if (n.mcpServer && !n.iRepoet) problems.push(`MCP-serveren ${n.mcpServer} (${n.miljo}) står ikke i .mcp.json. Legg den til med kommandoen Neo viser under API-klienter → Koble til Claude, og logg inn med /mcp`);
  return { miljoer, problems, plugins: plugins.map((p) => ({ plugin: p, rows: rows(data, p) })) };
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  let r;
  try {
    const { root, data } = load();
    r = report(root, { data });
  } catch (e) {
    console.log(`❌ ${e.message}`);
    process.exit(1);
  }
  if (process.argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else {
    for (const n of r.miljoer) console.log(`Neo, ${n.miljo}: ${n.url ?? "—"}, MCP-serveren ${n.mcpServer ?? "—"}${n.iRepoet ? " (står i .mcp.json)" : ""}`);
    console.log("");
    for (const p of r.plugins) {
      console.log(`## ${p.plugin}\n`);
      if (!p.rows.length) {
        console.log("Leser ingenting fra config-fila.\n");
        continue;
      }
      console.log("| Nøkkel | Verdi | Kilde | Hva |\n|---|---|---|---|");
      for (const x of p.rows) console.log(`| ${x.ok ? "" : "❌ "}\`${x.path}\` | ${x.value === undefined ? "—" : JSON.stringify(x.value)} | ${x.source}${x.required ? ", påkrevd" : ""} | ${x.doc} |`);
      console.log("");
    }
    for (const x of r.problems) console.log(`❌ ${x}`);
  }
  process.exit(r.problems.length || r.plugins.some((p) => p.rows.some((x) => !x.ok)) ? 1 : 0);
}
