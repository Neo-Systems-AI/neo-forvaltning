import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { enabled, report, rows } from "./check-setup.mjs";

const repo = (files) => {
  const root = mkdtempSync(join(tmpdir(), "oppsett-"));
  for (const [p, t] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), typeof t === "string" ? t : JSON.stringify(t));
  }
  return root;
};

test("pluginene som er på, er de fra markedsplassen i settings.json og settings.local.json", () => {
  const root = repo({
    ".claude/settings.json": { enabledPlugins: { "forvaltning@neo-forvaltning": true, "krr@neo-forvaltning": true, "annen@et-annet-sted": true } },
    ".claude/settings.local.json": { enabledPlugins: { "krr@neo-forvaltning": false, "data@neo-forvaltning": true } },
  });
  assert.deepEqual(enabled(root), ["data", "forvaltning"]);
});

test("hver nøkkel med kilden, MCP-serveren eller maskinklienten, klienten en plugin viser til, og referansene i hvelvet; det påkrevde som mangler, er rødt", () => {
  const root = repo({ ".mcp.json": { mcpServers: { "neo-sandkasse": {}, "neo-produksjon": {} } } });
  const neo = { environments: ["sandkasse", "produksjon"], defaultEnv: "sandkasse", byEnv: { sandkasse: { mcpServer: "neo-sandkasse", url: "https://neo.test" }, produksjon: { mcpServer: "neo-produksjon", url: "https://<neo-adresse>" } } };
  const data = { version: 1, neo, krr: { miljo: "test", klient: "krr" }, maskinporten: { miljo: "test", klienter: { krr: { clientId: "c" }, fiks: { clientId: "f" } }, hemmeligheter: { "krr-nokkel": { $env: "KRR", kilde: "azure-keyvault:kv/krr", fil: true } } } };
  const bad = (plugin, d = data) => rows(d, plugin).filter((x) => !x.ok).map((x) => x.path);
  assert.deepEqual(bad("krr"), []);
  assert.equal(rows(data, "krr").find((x) => x.path === "maskinporten.hemmeligheter.krr-nokkel").value, "azure-keyvault:kv/krr");
  assert.deepEqual(bad("maskinporten"), ["maskinporten.hemmeligheter.fiks-nokkel"]);
  assert.deepEqual(bad("krr", { ...data, krr: { miljo: "test", klient: "borte" } }), ["maskinporten.klienter.borte", "maskinporten.hemmeligheter.borte-nokkel"]);
  assert.deepEqual(bad("documaster"), ["documaster.apiUrl", "documaster.tokenUrl", "documaster.clientId", "documaster.scope", "documaster.hemmeligheter.client-secret"]);
  assert.deepEqual(bad("altinn"), [], "en kunde som bare publiserer skjemaer, trenger ingen klient");
  assert.deepEqual(bad("altinn", { ...data, altinn: { hemmeligheter: { "subscription-key": "verdi" } } }), ["altinn.hemmeligheter.subscription-key"], "en valgfri referanse kan mangle, men står den, er den en referanse");
  assert.deepEqual(bad("finnes-ikke"), ["finnes-ikke"]);
  assert.equal(rows(data, "monitoring").find((x) => x.path === "monitoring.window").source, "plugin-standard");
  assert.deepEqual(rows(data, "forvaltning").filter((x) => x.path.startsWith("forvaltning.")).map((x) => [x.path, x.value]), [["forvaltning.oppsettDir", "oppsett"], ["forvaltning.snapshotDir", "snapshots"], ["forvaltning.reportsDir", "reports"]]);
  assert.deepEqual(bad("monitoring", { ...data, neo: { ...neo, byEnv: { sandkasse: { mcpServer: "neo-sandkasse" }, produksjon: { url: "https://neo.test" } } } }), ["neo.byEnv.produksjon.mcpServer"], "monitoring går gjennom MCP");
  assert.deepEqual(bad("solution"), ["neo.byEnv.sandkasse.apiClient.clientId", "neo.byEnv.sandkasse.apiClient.clientSecret"], "solution kaller Neo med maskinklienten i sandkassen, ikke MCP");
  const medKlient = { ...data, neo: { ...neo, byEnv: { ...neo.byEnv, sandkasse: { url: "https://neo.test", apiClient: { clientId: "k", clientSecret: { $env: "NEO_K", kilde: "azure-keyvault:kv/neo" } } } } } };
  assert.deepEqual(bad("forvaltning", medKlient), []);
  assert.equal(rows(medKlient, "forvaltning").find((x) => x.path.endsWith("clientSecret")).value, "azure-keyvault:kv/neo");
  assert.deepEqual(bad("forvaltning", { ...medKlient, neo: { ...neo, byEnv: { sandkasse: { url: "https://neo.test", apiClient: { clientId: "k", clientSecret: "verdi" } } } } }), ["neo.byEnv.sandkasse.apiClient.clientSecret"], "en verdi er ikke en referanse");
  assert.equal(rows(data, "solution").find((x) => x.path === "neo.byEnv.produksjon.url").source, "usatt", "en plassholder er ikke en adresse");
  const r = report(root, { data, plugins: ["solution"] });
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.miljoer.map((m) => [m.miljo, m.mcpServer, m.iRepoet]), [["sandkasse", "neo-sandkasse", true], ["produksjon", "neo-produksjon", true]]);
  assert.equal(report(root, { data: { version: 1, neo: { environments: ["sandkasse"], byEnv: { sandkasse: { mcpServer: "annen" } } } }, plugins: [] }).problems.length, 2);
});
