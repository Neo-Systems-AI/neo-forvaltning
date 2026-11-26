#!/usr/bin/env node
// Config-fila i kunderepoet, `.claude/neo.config.json`: én fil alle pluginene leser. Den har en felles del for Neo
// (`neo`: miljøene, standardmiljøet og MCP-serveren og adressen per miljø) og én del per plugin med pluginens navn.
// Ingen hemmeligheter: `hvelv` sier hvilket hvelv nøklene ligger i, og navnene er faste (se nokler.mjs).
//
//   {
//     "version": 1,
//     "neo": {
//       "environments": ["sandkasse", "produksjon"],
//       "defaultEnv": "sandkasse",
//       "byEnv": { "sandkasse": { "mcpServer": "neo-sandkasse", "url": "https://…" }, "produksjon": { … } }
//     }
//   }
//
// Hva hver plugin leser, står i `neo-config.keys.json` ved siden av manifestet: `neo: true` når den snakker med Neo,
// og nøklene relativt til pluginens del (`window` er `monitoring.window`), med en standard (`fallback`) der pluginen
// har en.
//
//   node neo-config.mjs                          Neo per miljø: MCP-serveren, adressen og om serveren står i .mcp.json
//   node neo-config.mjs --miljo [<miljø>]        MCP-serveren og adressen for miljøet (standard: neo.defaultEnv), som JSON
//   node neo-config.mjs --get <nøkkel> [--miljo <miljø>]   verdien, eller pluginens standard når den ikke er satt
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const CONFIG = ".claude/neo.config.json";
export const VERSION = 1;

// Den felles delen. `perEnv` står under `neo.byEnv.<miljø>`.
export const SHARED = [
  { path: "neo.environments", doc: "Miljøene i Neo: sandkasse og produksjon" },
  { path: "neo.defaultEnv", fallback: "sandkasse", doc: "Miljøet som brukes når ingen er sagt" },
  { path: "mcpServer", perEnv: true, doc: "Navnet på MCP-serveren for miljøet i .mcp.json" },
  { path: "url", perEnv: true, doc: "Adressen til Neo for miljøet" },
];

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

// Feil i den felles delen.
export function validate(data) {
  const errors = [];
  if (data?.version !== VERSION) errors.push(`version må være ${VERSION}`);
  const neo = data?.neo ?? {};
  for (const k of ["url", "org", "mcpServer"]) if (k in neo) errors.push(`neo.${k} står rett under neo. Miljøene står under neo.byEnv.<miljø> (sandkasse og produksjon)`);
  const envs = neo.environments;
  if (!Array.isArray(envs) || !envs.length) return [...errors, "neo.environments mangler: miljøene i Neo, sandkasse og produksjon"];
  for (const env of Object.keys(neo.byEnv ?? {})) if (!envs.includes(env)) errors.push(`neo.byEnv.${env} er ikke et miljø i neo.environments`);
  if (neo.defaultEnv && !envs.includes(neo.defaultEnv)) errors.push(`neo.defaultEnv «${neo.defaultEnv}» er ikke et miljø i neo.environments`);
  return errors;
}

// Fila, lest og sjekket. Feiler med det som er galt, og hva som retter det.
export function load(cwd = process.cwd()) {
  const root = repoRoot(cwd);
  const path = join(root, CONFIG);
  if (!existsSync(path)) throw new Error(`Fant ikke ${CONFIG} i ${root}. /forvaltning:oppstart lager den`);
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`${CONFIG} er ikke gyldig JSON: ${e.message}`);
  }
  const errors = validate(data);
  if (errors.length) throw new Error(`${CONFIG}: ${errors.join("; ")}. Se /forvaltning:oppstart`);
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

export const environments = (data) => get(data, "neo.environments") ?? [];

// Miljøet i Neo: det som er sagt, ellers neo.defaultEnv. Et miljø som ikke står i neo.environments, er en feil.
export function environment(data, wanted) {
  const env = wanted ?? get(data, "neo.defaultEnv") ?? "sandkasse";
  if (!environments(data).includes(env)) throw new Error(`«${env}» er ikke et miljø i Neo. Miljøene: ${environments(data).join(", ") || "ingen"}`);
  return env;
}

// Neo for ett miljø. Verktøyene heter mcp__<server>__<verktøy>, og svaret sier alltid hvilket miljø det kom fra.
export function neo(data, root, wanted) {
  const miljo = environment(data, wanted);
  const mcpServer = get(data, `neo.byEnv.${miljo}.mcpServer`) ?? null;
  const url = get(data, `neo.byEnv.${miljo}.url`) ?? null;
  let iRepoet = false;
  try {
    iRepoet = !!mcpServer && !!JSON.parse(readFileSync(join(root, ".mcp.json"), "utf8"))?.mcpServers?.[mcpServer];
  } catch {}
  return { miljo, mcpServer, url, verktoy: mcpServer ? `mcp__${mcpServer}__<verktøy>` : null, iRepoet };
}

// Nøkkelfila til pluginen som kjører: ../../neo-config.keys.json fra scripts/lib/.
export function pluginKeys(file = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "neo-config.keys.json")) {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { keys: [] };
}

// Verdien og hvor den kom fra: «config», «plugin-standard» eller «usatt». En nøkkel i den felles delen slås opp som
// den står (mcpServer og url for miljøet); en nøkkel i pluginen slås opp under pluginens navn.
export function resolve(data, path, { keys = pluginKeys(), env } = {}) {
  const shared = SHARED.find((k) => k.path === path);
  const own = keys?.keys?.find((k) => k.path === path);
  const key = shared ?? own;
  if (!key) throw new Error(`Ukjent nøkkel ${path}. Nøklene: ${[...SHARED, ...(keys?.keys ?? [])].map((k) => k.path).join(", ")}`);
  const full = shared ? (key.perEnv ? `neo.byEnv.${environment(data, env)}.${path}` : path) : `${keys.plugin}.${path}`;
  const value = get(data, full);
  if (!blank(value)) return { path: full, value, source: "config" };
  if (key.fallback !== undefined) return { path: full, value: key.fallback, source: "plugin-standard" };
  return { path: full, value: undefined, source: "usatt" };
}

// Stiene løses opp, så skriptet kjører også gjennom en symlenke (som mktemp -d på macOS).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  const arg = (n) => (args.includes(n) && args[args.indexOf(n) + 1] && !args[args.indexOf(n) + 1].startsWith("--") ? args[args.indexOf(n) + 1] : undefined);
  try {
    const { root, data } = load();
    if (args.includes("--get")) {
      const key = arg("--get");
      if (!key) throw new Error("Bruk: neo-config.mjs --get <nøkkel> [--miljo <miljø>]");
      const r = resolve(data, key, { env: arg("--miljo") });
      if (r.source === "usatt") throw new Error(`${r.path} er ikke satt i ${CONFIG}, og pluginen har ingen standard`);
      console.log(typeof r.value === "string" ? r.value : JSON.stringify(r.value));
    } else if (args.includes("--miljo")) {
      const n = neo(data, root, arg("--miljo"));
      console.log(JSON.stringify({ miljo: n.miljo, mcpServer: n.mcpServer, url: n.url }));
    } else {
      for (const env of environments(data)) {
        const n = neo(data, root, env);
        console.log(`${env}${env === environment(data) ? " (standard)" : ""}: ${n.url ?? "ingen adresse"}, MCP-serveren ${n.mcpServer ?? "mangler"}${n.mcpServer ? (n.iRepoet ? "" : " (står ikke i .mcp.json)") : ""}`);
      }
      console.log("\nVerktøyene heter mcp__<server>__<verktøy>. Si alltid hvilket miljø svaret kom fra.");
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
