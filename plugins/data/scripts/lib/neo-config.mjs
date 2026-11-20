#!/usr/bin/env node
// Config-fila for Neo sine plugins: ÉN fil i kundens repo, `.claude/neo.config.json`, som alle pluginene leser, så
// pluginene og repoet kan leve sammen. Fila har en felles del (`neo`: miljøene og MCP-serveren per miljø) og én del
// per plugin, med pluginens navn. Hver plugin deklarerer sine egne nøkler i `neo-config.keys.json` ved siden av
// manifestet, så en ny plugin trenger ingen endring her.
//
// Modulen er kopiert inn i hver plugin (`scripts/lib/neo-config.mjs`), og `check` i repoet stopper en kopi som har
// glidd fra `shared/neo-config/`. Ingen hemmeligheter i fila: innloggingen mot Neo er personens egen, gjennom
// MCP-serveren for miljøet.
//
//   node neo-config.mjs --check                 hva pluginen trenger, hva som er satt, og hva som mangler
//   node neo-config.mjs --get <nøkkel> [--miljo <miljø>]
//   node neo-config.mjs --miljo [<miljø>]       MCP-serveren og adressen for miljøet (standard: neo.defaultEnv)
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

export const CONFIG_NAME = "neo.config.json";
export const VERSION = 1;

// Den felles delen, som alle pluginene som snakker med Neo, leser.
export const SHARED = [
  { path: "neo.environments", doc: "Miljøene i Neo, for eksempel sandkasse og produksjon" },
  { path: "neo.defaultEnv", fallback: "sandkasse", doc: "Miljøet som brukes når ingen er sagt" },
  { path: "mcpServer", perEnv: true, doc: "Navnet på MCP-serveren for miljøet i .mcp.json" },
  { path: "url", perEnv: true, doc: "Adressen til Neo for miljøet (bare til visning)" },
];

// Nøkkelfila til pluginen som kjører: ../../neo-config.keys.json fra scripts/lib/.
// { "plugin": "helse", "neo": true, "keys": [{ "path": "window", "fallback": "24h", "required": false, "doc": "…" }] }
// «neo»: pluginen snakker med Neo, så den felles delen er påkrevd.
// «environments»: pluginen snakker med et eksternt system som har egne miljøer (Altinn har tt02 og produksjon,
// Documaster en testinstans). Da står miljøene i `<plugin>.environments`, og en nøkkel med «perEnv» står under
// `<plugin>.byEnv.<miljø>`. Bare det pluginen trenger for å lese systemet: koblingen selv er satt opp i Neo.
export function pluginKeys(file = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "neo-config.keys.json")) {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

const gitRoot = (cwd) => {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};

// NEO_CONFIG overstyrer. Peker den på en fil som ikke finnes, er det en feil, ikke «ingen config».
export function findConfig(cwd = process.cwd()) {
  const forced = process.env.NEO_CONFIG?.trim();
  if (forced) return existsSync(forced) ? { path: forced } : { path: forced, missing: true };
  for (const base of [gitRoot(cwd), cwd].filter(Boolean)) {
    const p = join(base, ".claude", CONFIG_NAME);
    if (existsSync(p)) return { path: p, root: base };
  }
  return null;
}

const get = (o, path) => path.split(".").reduce((x, k) => (x && typeof x === "object" ? x[k] : undefined), o);
const blank = (v) => v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);

export function load(cwd = process.cwd()) {
  const found = findConfig(cwd);
  if (!found) return { found: null, data: null, errors: [`Fant ikke .claude/${CONFIG_NAME}. Kjør /forvaltning:oppstart, eller se neo-forvaltning-mal`] };
  if (found.missing) return { found, data: null, errors: [`NEO_CONFIG peker på ${found.path}, som ikke finnes`] };
  try {
    const data = JSON.parse(readFileSync(found.path, "utf8"));
    return { found, data, errors: validate(data) };
  } catch (e) {
    return { found, data: null, errors: [`${found.path} er ikke gyldig JSON: ${e.message}`] };
  }
}

// Feil i den felles delen. En del for en plugin som ikke er installert, er ikke en feil: den kan komme.
export function validate(data) {
  const errors = [];
  if (data?.version !== VERSION) errors.push(`version må være ${VERSION}`);
  const envs = get(data, "neo.environments");
  if (data?.neo === undefined) return errors;
  if (!Array.isArray(envs) || !envs.length) return [...errors, "neo.environments mangler"];
  for (const env of Object.keys(get(data, "neo.byEnv") ?? {})) if (!envs.includes(env)) errors.push(`neo.byEnv.${env} er ikke et miljø i neo.environments`);
  const def = get(data, "neo.defaultEnv");
  if (def && !envs.includes(def)) errors.push(`neo.defaultEnv «${def}» er ikke et miljø i neo.environments`);
  return errors;
}

export const environment = (data, wanted) => wanted ?? get(data, "neo.defaultEnv") ?? "sandkasse";

// Miljøene en nøkkel varierer over: Neo sine, eller pluginens egne for et eksternt system.
const envsFor = (data, keys, shared) => (shared || !keys?.environments ? get(data, "neo.environments") : get(data, `${keys.plugin}.environments`)) ?? [];
const pluginEnv = (data, keys, env) => env ?? get(data, `${keys.plugin}.defaultEnv`) ?? envsFor(data, keys, false)[0];

// Verdien og hvor den kom fra: «config» eller «plugin-standard». En verdi ingen har valgt, skal ikke se valgt ut.
// En nøkkel i den felles delen slås opp som den står; en nøkkel i pluginen slås opp under pluginens navn.
export function resolve(data, path, { keys = pluginKeys(), env } = {}) {
  const shared = SHARED.find((k) => k.path === path);
  const own = keys?.keys?.find((k) => k.path === path);
  const key = shared ?? own;
  if (!key) throw new Error(`Ukjent nøkkel ${path}. Nøklene: ${[...SHARED, ...(keys?.keys ?? [])].map((k) => k.path).join(", ")}`);
  const full = shared
    ? key.perEnv ? `neo.byEnv.${environment(data, env)}.${path}` : path
    : key.perEnv ? `${keys.plugin}.byEnv.${keys.environments ? pluginEnv(data, keys, env) : environment(data, env)}.${path}` : `${keys.plugin}.${path}`;
  const value = get(data, full);
  if (!blank(value)) return { path: full, value, source: "config" };
  if (key.fallback !== undefined) return { path: full, value: key.fallback, source: "plugin-standard" };
  return { path: full, value: undefined, source: "usatt" };
}

export function check(data, keys = pluginKeys()) {
  const rows = [];
  if (keys?.neo) {
    for (const k of SHARED) {
      for (const env of k.perEnv ? get(data, "neo.environments") ?? [] : [undefined]) {
        const r = resolve(data, k.path, { keys, env });
        const required = k.path !== "url" && k.fallback === undefined;
        rows.push({ ...r, required, ok: !required || r.source !== "usatt", doc: k.doc });
      }
    }
  }
  // Miljøene til systemet er påkrevd bare når pluginen har en påkrevd nøkkel: en kunde som bare publiserer skjemaer,
  // trenger ingen klient.
  if (keys?.environments && keys.keys?.some((k) => k.required) && !envsFor(data, keys, false).length) rows.push({ path: `${keys.plugin}.environments`, value: undefined, source: "usatt", required: true, ok: false, doc: "Miljøene til systemet, for eksempel test og produksjon" });
  for (const k of keys?.keys ?? []) {
    for (const env of k.perEnv ? envsFor(data, keys, false) : [undefined]) {
      const r = resolve(data, k.path, { keys, env });
      rows.push({ ...r, required: !!k.required, ok: !k.required || r.source !== "usatt", doc: k.doc });
    }
  }
  return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const keys = pluginKeys();
  const { found, data, errors } = load();
  if (!data) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  if (args.includes("--check")) {
    const rows = check(data, keys);
    console.log(`Config: ${found.path}\nPlugin: ${keys?.plugin ?? "(ingen nøkkelfil)"}\n\n| Nøkkel | Verdi | Kilde | Hva |\n|---|---|---|---|`);
    for (const r of rows) console.log(`| ${r.ok ? "" : "❌ "}\`${r.path}\` | ${r.value === undefined ? "—" : JSON.stringify(r.value)} | ${r.source}${r.required ? ", påkrevd" : ""} | ${r.doc} |`);
    for (const e of errors) console.log(`\n❌ ${e}`);
    process.exit(errors.length || rows.some((r) => !r.ok) ? 1 : 0);
  } else if (args.includes("--get")) {
    const r = resolve(data, arg("--get"), { keys, env: arg("--miljo") });
    if (r.source === "usatt") process.exit(1);
    console.log(typeof r.value === "string" ? r.value : JSON.stringify(r.value));
  } else if (args.includes("--miljo")) {
    const env = environment(data, arg("--miljo"));
    const envs = get(data, "neo.environments") ?? [];
    if (!envs.includes(env)) {
      console.error(`«${env}» er ikke et miljø. Miljøene: ${envs.join(", ") || "ingen"}`);
      process.exit(1);
    }
    console.log(JSON.stringify({ miljo: env, mcpServer: resolve(data, "mcpServer", { keys, env }).value ?? null, url: resolve(data, "url", { keys, env }).value ?? null }));
  } else {
    console.error("Bruk: neo-config.mjs --check | --get <nøkkel> [--miljo <miljø>] | --miljo [<miljø>]");
    process.exit(2);
  }
}
