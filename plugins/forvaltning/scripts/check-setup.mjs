#!/usr/bin/env node
// Oppsettet i repoet for hver plugin fra neo-forvaltning som er på: hva pluginen leser fra `.claude/neo.config.json`,
// hva som er satt, hvor verdien kom fra, og hva som mangler, også Neo per miljø (MCP-serveren for pluginene som går
// gjennom MCP, maskinklienten i sandkassen for dem som kaller Neo med skript), Maskinporten-klientene pluginene viser
// til, og nøklene de trenger i hvelvet (bare navnene; om de står der, sier nokler.mjs). Hva hver plugin trenger, står i
// `nokler.json` ved siden av (samlet fra nøkkelfilene til alle pluginene). Bare lesing. Exit 1 når noe påkrevd mangler.
//
//   node check-setup.mjs [--json]
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { environments, get, load, neo } from "./lib/neo-config.mjs";

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

// Navnet på en nøkkel slik pluginen sier det, med <klient> (hver klient i maskinporten.klienter) og <miljø>
// (standardmiljøet) fylt ut.
export function expand(data, navn) {
  if (navn.includes("<klient>")) return Object.keys(get(data, "maskinporten.klienter") ?? {}).map((k) => navn.replace("<klient>", k));
  return [navn.replace("<miljø>", get(data, "neo.defaultEnv") ?? "sandkasse")];
}

// En rad for en nøkkel i hvelvet. Om den står der, sier /forvaltning:nokler; her er den bare satt når hvelvet er det.
const keyRow = (data, n, doc, { valgfri = false, fil = false } = {}) => {
  const hv = typeof data?.hvelv === "string" && /^[A-Za-z0-9-]{3,24}$/.test(data.hvelv);
  return { path: `nøkkel ${n}`, nokkel: n, value: hv ? `${data.hvelv}/${n}` : undefined, source: hv ? "hvelvet" : "usatt", required: !valgfri, valgfri, fil, ok: hv || valgfri, doc: hv ? doc : `${doc}. hvelv er ikke satt i config-fila` };
};

// Neo per miljø, for en plugin som snakker med Neo. Gjennom MCP er MCP-serveren påkrevd. Med skript (`neoApi`) er
// adressen og maskinklienten i standardmiljøet (sandkassen) påkrevd: plan og apply virker bare der.
export function neoRows(data, { api = false } = {}) {
  if (!environments(data).length) return [{ path: "neo.environments", source: "usatt", required: true, ok: false, doc: "Miljøene i Neo: sandkasse og produksjon" }];
  const unset = (v) => blank(v) || (typeof v === "string" && v.includes("<"));
  const out = [];
  const standard = get(data, "neo.defaultEnv") ?? "sandkasse";
  for (const env of environments(data)) {
    const row = (k, required, doc) => {
      const path = `neo.byEnv.${env}.${k}`;
      const v = get(data, path);
      out.push({ path, value: v, source: unset(v) ? "usatt" : "config", required, ok: !required || !unset(v), doc });
    };
    if (!api) row("mcpServer", true, `MCP-serveren for ${env} i .mcp.json`);
    row("url", api && env === standard, `Adressen til Neo for ${env}`);
    if (api && env === standard) {
      const base = `neo.byEnv.${env}.apiClient`;
      const id = get(data, `${base}.clientId`);
      out.push({ path: `${base}.clientId`, value: id, source: unset(id) ? "usatt" : "config", required: true, ok: !unset(id), doc: `Maskinklienten skriptene kaller ${env} med (API-klienter → Ny API-klient, slaget «Maskin»)` });
    }
  }
  return out;
}

// Radene for én plugin: Neo når den snakker med Neo, hver nøkkel i config-fila, klientene den viser til, og nøklene i
// hvelvet den trenger. Nøklene
// står relativt til pluginens del av config-fila (`window` er `monitoring.window`).
export function rows(data, plugin, keys = KEYS) {
  const spec = keys[plugin];
  if (!spec) return [{ path: plugin, ok: false, doc: `${plugin} er ikke en plugin i ${MARKET}` }];
  const out = spec.neo ? neoRows(data, { api: !!spec.neoApi }) : [];
  for (const k of spec.keys ?? []) {
    const path = `${plugin}.${k.path}`;
    const v = get(data, path);
    const set = !blank(v);
    out.push({ path, value: set ? v : k.fallback, source: set ? "config" : k.fallback !== undefined ? "plugin-standard" : "usatt", required: !!k.required, ok: set || !k.required || k.fallback !== undefined, doc: k.doc });
    if (k.klient && set) {
      const klient = get(data, `maskinporten.klienter.${v}`);
      out.push({ path: `maskinporten.klienter.${v}`, value: klient?.clientId ? `clientId ${klient.clientId}` : undefined, source: klient ? "config" : "usatt", required: true, ok: !!klient?.clientId, doc: `Klienten ${path} viser til, med clientId` });
      if (blank(get(data, "maskinporten.miljo"))) out.push({ path: "maskinporten.miljo", source: "usatt", required: true, ok: false, doc: "Miljøet klientene er registrert i" });
      out.push(keyRow(data, `maskinporten--${v}-nokkel`, `Den private nøkkelen (PEM) til klienten ${v}`, { fil: true }));
    }
  }
  for (const n of spec.nokler ?? []) for (const navn of expand(data, n.navn)) out.push(keyRow(data, navn, n.doc, n));
  return out;
}

// Nøklene pluginene som er på, trenger i hvelvet, hver én gang.
export function needed(data, plugins, keys = KEYS) {
  const seen = new Map();
  for (const p of plugins) for (const r of rows(data, p, keys)) if (r.nokkel && !seen.has(r.nokkel)) seen.set(r.nokkel, { navn: r.nokkel, doc: r.doc, valgfri: r.valgfri, fil: r.fil, plugin: p });
  return [...seen.values()];
}

export function report(root, { data, plugins = enabled(root) } = {}) {
  const problems = [];
  if (!plugins.length) problems.push(`Ingen plugins fra ${MARKET} er på i .claude/settings.json (enabledPlugins)`);
  const miljoer = environments(data).map((env) => neo(data, root, env));
  // MCP-serveren trengs bare når en plugin som er på, går gjennom MCP (monitoring, data); forvaltning og solution kaller
  // Neo med maskinklienten.
  const mcp = plugins.some((p) => KEYS[p]?.neo && !KEYS[p]?.neoApi);
  for (const n of miljoer) if (mcp && n.mcpServer && !n.iRepoet) problems.push(`MCP-serveren ${n.mcpServer} (${n.miljo}) står ikke i .mcp.json. Legg den til med kommandoen Neo viser under API-klienter → Koble til Claude, og logg inn med /mcp`);
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
