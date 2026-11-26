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

test("hver nøkkel med kilden, MCP-serveren eller maskinklienten, klienten en plugin viser til, og nøklene i hvelvet med de faste navnene; det påkrevde som mangler, er rødt", () => {
  const root = repo({ ".mcp.json": { mcpServers: { "neo-sandkasse": {}, "neo-produksjon": {} } } });
  const neo = { environments: ["sandkasse", "produksjon"], defaultEnv: "sandkasse", byEnv: { sandkasse: { mcpServer: "neo-sandkasse", url: "https://neo.test" }, produksjon: { mcpServer: "neo-produksjon", url: "https://<neo-adresse>" } } };
  const data = { version: 1, hvelv: "kv-kunde", neo, krr: { miljo: "test", klient: "krr" }, maskinporten: { miljo: "test", klienter: { krr: { clientId: "c" }, fiks: { clientId: "f" } } } };
  const bad = (plugin, d = data) => rows(d, plugin).filter((x) => !x.ok).map((x) => x.path);
  assert.deepEqual(bad("krr"), []);
  assert.equal(rows(data, "krr").find((x) => x.nokkel === "maskinporten--krr-nokkel").value, "kv-kunde/maskinporten--krr-nokkel");
  assert.deepEqual(rows(data, "maskinporten").filter((x) => x.nokkel).map((x) => x.nokkel), ["maskinporten--krr-nokkel", "maskinporten--fiks-nokkel"]);
  assert.deepEqual(bad("krr", { ...data, krr: { miljo: "test", klient: "borte" } }), ["maskinporten.klienter.borte"]);
  assert.deepEqual(bad("documaster"), ["documaster.apiUrl", "documaster.tokenUrl", "documaster.clientId", "documaster.scope"]);
  assert.deepEqual(bad("documaster", { ...data, hvelv: undefined }).at(-1), "nøkkel documaster--client-secret", "uten hvelv kan nøkkelen ikke finnes");
  assert.deepEqual(bad("altinn", { ...data, hvelv: undefined }), [], "en valgfri nøkkel kan mangle");
  assert.deepEqual(bad("finnes-ikke"), ["finnes-ikke"]);
  assert.equal(rows(data, "monitoring").find((x) => x.path === "monitoring.window").source, "plugin-standard");
  assert.deepEqual(rows(data, "forvaltning").filter((x) => x.path.startsWith("forvaltning.")).map((x) => [x.path, x.value]), [["forvaltning.oppsettDir", "oppsett"], ["forvaltning.snapshotDir", "snapshots"], ["forvaltning.reportsDir", "reports"]]);
  assert.deepEqual(bad("monitoring", { ...data, neo: { ...neo, byEnv: { sandkasse: { mcpServer: "neo-sandkasse" }, produksjon: { url: "https://neo.test" } } } }), ["neo.byEnv.produksjon.mcpServer"], "monitoring går gjennom MCP");
  assert.deepEqual(bad("solution"), ["neo.byEnv.sandkasse.apiClient.clientId"], "solution kaller Neo med maskinklienten i sandkassen, ikke MCP");
  const medKlient = { ...data, neo: { ...neo, byEnv: { ...neo.byEnv, sandkasse: { url: "https://neo.test", apiClient: { clientId: "k" } } } } };
  assert.deepEqual(bad("forvaltning", medKlient), []);
  assert.equal(rows(medKlient, "forvaltning").find((x) => x.nokkel).value, "kv-kunde/neo--sandkasse-klient");
  assert.equal(rows(data, "solution").find((x) => x.path === "neo.byEnv.produksjon.url").source, "usatt", "en plassholder er ikke en adresse");
  const r = report(root, { data, plugins: ["solution"] });
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.miljoer.map((m) => [m.miljo, m.mcpServer, m.iRepoet]), [["sandkasse", "neo-sandkasse", true], ["produksjon", "neo-produksjon", true]]);
  const annen = { version: 1, neo: { environments: ["sandkasse"], byEnv: { sandkasse: { mcpServer: "annen" } } } };
  assert.equal(report(root, { data: annen, plugins: [] }).problems.length, 1, "ingen plugins er på");
  assert.deepEqual(report(root, { data: annen, plugins: ["forvaltning", "solution"] }).problems, [], "forvaltning og solution trenger ikke MCP-serveren");
  assert.match(report(root, { data: annen, plugins: ["monitoring"] }).problems[0], /MCP-serveren annen \(sandkasse\) står ikke i .mcp.json/);
});
