#!/usr/bin/env node
// Config-fila i kunderepoet, `.claude/neo.config.json`: én fil alle pluginene leser. Den har ett miljø i Neo (`neo.url`,
// `neo.org`, `neo.mcpServer`) og én del per plugin med pluginens navn. Ingen hemmeligheter: under
// `<system>.hemmeligheter` står bare referansene til hvelvet (se hemmeligheter.mjs). Hva hver plugin leser, står i
// `neo-config.keys.json` ved siden av manifestet, med en standard der pluginen har en.
//
//   node config.mjs                 Neo for repoet: adressen, org-en, MCP-serveren og om den står i .mcp.json
//   node config.mjs <nøkkel>        verdien, for eksempel monitoring.window (pluginens standard når den ikke er satt)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const CONFIG = ".claude/neo.config.json";
export const VERSION = 2;

export const get = (o, path) => path.split(".").reduce((x, k) => (x && typeof x === "object" ? x[k] : undefined), o);
const blank = (v) => v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);

// Roten av repoet: der git sier. Utenfor et git-repo er det ingen config-fil å finne.
export function repoRoot(cwd = process.cwd()) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    throw new Error(`${cwd} er ikke i et git-repo, så ${CONFIG} kan ikke finnes. Kjør fra kunderepoet`);
  }
}

// Fila, lest og sjekket. Feiler med det som er galt, og hva som retter det.
export function load(cwd = process.cwd()) {
  const root = repoRoot(cwd);
  const path = join(root, CONFIG);
  if (!existsSync(path)) throw new Error(`Fant ikke ${CONFIG} i ${root}. /solution:set-up-repo lager den`);
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`${CONFIG} er ikke gyldig JSON: ${e.message}`);
  }
  if (data?.version !== VERSION) throw new Error(`${CONFIG} har version ${data?.version ?? "ingen"}; pluginene leser version ${VERSION}: ett miljø, med neo.url, neo.org og neo.mcpServer. Se /solution:set-up-repo`);
  return { root, path, data };
}

// En verdi som må være satt. Feilen sier stien, og hva den er til.
export function need(data, path, what = "") {
  const v = get(data, path);
  if (blank(v)) throw new Error(`${path} mangler i ${CONFIG}${what ? `: ${what}` : ""}`);
  return v;
}

// Miljøet hos et eksternt system: --miljo, ellers <system>.miljo i config-fila. Ingen stille standard.
export function miljo(data, system, wanted, hosts) {
  const env = wanted ?? get(data, `${system}.miljo`);
  if (blank(env)) throw new Error(`Miljøet for ${system} er ikke sagt: sett ${system}.miljo i ${CONFIG} (${Object.keys(hosts).join(" eller ")}), eller bruk --miljo`);
  if (!hosts[env]) throw new Error(`${system} har ikke miljøet «${env}». Miljøene: ${Object.keys(hosts).join(", ")}`);
  return env;
}

// Neo for repoet. Verktøyene heter mcp__<server>__<verktøy>, og svaret sier alltid hvilken org det kom fra.
export function neo(data, root) {
  const out = { url: get(data, "neo.url") ?? null, org: get(data, "neo.org") ?? null, mcpServer: get(data, "neo.mcpServer") ?? null };
  let iRepoet = false;
  try {
    iRepoet = !!JSON.parse(readFileSync(join(root, ".mcp.json"), "utf8"))?.mcpServers?.[out.mcpServer];
  } catch {}
  return { ...out, verktoy: out.mcpServer ? `mcp__${out.mcpServer}__<verktøy>` : null, iRepoet };
}

// Nøkkelfila til pluginen som kjører: ../../neo-config.keys.json fra scripts/lib/.
export function pluginKeys(file = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "neo-config.keys.json")) {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { keys: [] };
}

// Verdien, eller pluginens standard når den ikke er satt, og hvor den kom fra.
export function resolve(data, path, keys = pluginKeys()) {
  const v = get(data, path);
  if (!blank(v)) return { path, value: v, source: "config" };
  const key = keys.keys?.find((k) => k.path === path);
  if (key && key.standard !== undefined) return { path, value: key.standard, source: "standard" };
  return { path, value: undefined, source: "usatt" };
}

// Stiene løses opp, så skriptet kjører også gjennom en symlenke (som mktemp -d på macOS).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const { root, data } = load();
    const [path] = process.argv.slice(2);
    if (path) {
      const r = resolve(data, path);
      if (r.source === "usatt") throw new Error(`${path} er ikke satt i ${CONFIG}, og pluginen har ingen standard`);
      console.log(typeof r.value === "string" ? r.value : JSON.stringify(r.value));
      if (r.source === "standard") console.error(`(${path} er ikke satt; dette er standarden til pluginen)`);
    } else {
      const n = neo(data, root);
      for (const k of ["url", "org", "mcpServer"]) need(data, `neo.${k}`);
      console.log(`Neo: ${n.url}, org ${n.org}`);
      console.log(`MCP-server: ${n.mcpServer}. Verktøyene heter ${n.verktoy}. Si hvilken org svaret kom fra.`);
      if (!n.iRepoet) console.log(`\nMerk: ${n.mcpServer} står ikke i .mcp.json. Legg den til med kommandoen Neo viser under API-klienter → Koble til Claude, og logg inn med /mcp.`);
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
