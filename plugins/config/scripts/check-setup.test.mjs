import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { enabled, keysFor, report } from "./check-setup.mjs";

const write = (p, data) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data));
};

test("pluginene som er på, er de fra markedsplassen i settings.json og settings.local.json", () => {
  const root = mkdtempSync(join(tmpdir(), "oppsett-"));
  write(join(root, ".claude/settings.json"), { enabledPlugins: { "config@neo-forvaltning": true, "solution@neo-forvaltning": true, "annen@et-annet-sted": true } });
  write(join(root, ".claude/settings.local.json"), { enabledPlugins: { "solution@neo-forvaltning": false, "data@neo-forvaltning": true } });
  assert.deepEqual(enabled(root), ["config", "data"]);
});

test("nøkkelfila hentes der pluginen er installert, ellers ved siden av, og det som mangler, sies", () => {
  const home = mkdtempSync(join(tmpdir(), "hjem-"));
  const install = join(home, "cache/neo-forvaltning/monitoring/0.3.0");
  write(join(install, "neo-config.keys.json"), { plugin: "monitoring", neo: true, keys: [{ path: "window", fallback: "24h", doc: "vinduet" }] });
  const installed = join(home, "installed_plugins.json");
  write(installed, { version: 2, plugins: { "monitoring@neo-forvaltning": [{ scope: "project", projectPath: "/annet", installPath: install, version: "0.3.0" }] } });
  const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  assert.equal(keysFor("monitoring", { installed, pluginRoot }).version, "0.3.0");
  assert.equal(keysFor("solution", { installed, pluginRoot }).keys.plugin, "solution");
  assert.equal(keysFor("finnes-ikke", { installed, pluginRoot }), null);

  const data = { version: 1, neo: { environments: ["development"], defaultEnv: "development", byEnv: { development: {} } } };
  const r = report(data, "/repo", ["monitoring", "finnes-ikke"], { installed, pluginRoot });
  assert.equal(r[1].missing, true);
  assert.deepEqual(r[0].rows.filter((x) => !x.ok).map((x) => x.path), ["neo.byEnv.development.mcpServer"]);
  assert.ok(r[0].rows.some((x) => x.path === "monitoring.window" && x.source === "plugin-standard"));
});
