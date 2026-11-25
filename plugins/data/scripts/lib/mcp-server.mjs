#!/usr/bin/env node
// MCP-serveren som gir Neo for et miljø, slått opp ett sted for alle skillene: navnet fra `.claude/neo.config.json`,
// adressen og org-en, og om serveren er lagt til i repoet (`.mcp.json`). Verktøyene heter
// `mcp__<server>__<verktøy>`, og svaret sier alltid hvilket miljø det kom fra.
//
//   node mcp-server.mjs [<miljø>] [--json]
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { environment, load, resolve } from "./neo-config.mjs";

export function lookup(data, wanted, { root } = {}) {
  const env = environment(data, wanted);
  const envs = data?.neo?.environments ?? [];
  if (!envs.includes(env)) return { error: `«${env}» er ikke et miljø i neo.environments. Miljøene: ${envs.join(", ") || "ingen"}` };
  const at = (path) => resolve(data, path, { keys: null, env }).value ?? null;
  const server = at("mcpServer");
  if (!server) return { error: `neo.byEnv.${env}.mcpServer mangler i .claude/neo.config.json` };
  const mcpFile = root ? join(root, ".mcp.json") : null;
  let added = null;
  if (mcpFile && existsSync(mcpFile)) {
    try {
      added = !!JSON.parse(readFileSync(mcpFile, "utf8"))?.mcpServers?.[server];
    } catch {
      added = false;
    }
  }
  return { miljo: env, mcpServer: server, verktoy: `mcp__${server}__<verktøy>`, url: at("url"), organisasjon: at("organisasjon"), iRepoet: added };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const { found, data, errors } = load();
  if (!data) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  const root = found.root ?? dirname(dirname(found.path));
  const r = lookup(data, args.find((a) => !a.startsWith("--")), { root });
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (args.includes("--json")) console.log(JSON.stringify(r));
  else {
    console.log(`Miljø: ${r.miljo}${r.url ? ` (${r.url})` : ""}${r.organisasjon ? `, org: ${r.organisasjon}` : ""}`);
    console.log(`MCP-server: ${r.mcpServer}. Verktøyene heter ${r.verktoy}.`);
    console.log("Si hvilket miljø svaret kom fra.");
  }
  if (r.iRepoet === false || r.iRepoet === null) {
    console.log(`\nMerk: ${r.mcpServer} står ikke i .mcp.json i repoet. Er den ikke lagt til et annet sted, legg den til med claude mcp add (se /config:set-up-repo), og logg inn med /mcp.`);
  }
}
