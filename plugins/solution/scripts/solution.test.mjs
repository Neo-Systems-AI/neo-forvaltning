import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { enabled, report, rows } from "./check-setup.mjs";
import { table } from "./vis-hemmeligheter.mjs";

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
    ".claude/settings.json": { enabledPlugins: { "solution@neo-forvaltning": true, "krr@neo-forvaltning": true, "annen@et-annet-sted": true } },
    ".claude/settings.local.json": { enabledPlugins: { "krr@neo-forvaltning": false, "data@neo-forvaltning": true } },
  });
  assert.deepEqual(enabled(root), ["data", "solution"]);
});

test("hver nøkkel med kilden, klienten en plugin viser til, og referansene i hvelvet; det påkrevde som mangler, er rødt", () => {
  const root = repo({ ".mcp.json": { mcpServers: { "neo-development": {} } } });
  const data = { version: 2, neo: { url: "https://neo.test", org: "o", mcpServer: "neo-development" }, krr: { miljo: "test", klient: "krr" }, maskinporten: { miljo: "test", klienter: { krr: { clientId: "c" }, fiks: { clientId: "f" } }, hemmeligheter: { "krr-nokkel": { kilde: "azure-keyvault:kv/krr", fil: true } } } };
  const bad = (plugin, d = data) => rows(d, plugin).filter((x) => !x.ok).map((x) => x.path);
  assert.deepEqual(bad("krr"), []);
  assert.equal(rows(data, "krr").find((x) => x.path === "maskinporten.hemmeligheter.krr-nokkel").value, "azure-keyvault:kv/krr");
  assert.deepEqual(bad("maskinporten"), ["maskinporten.hemmeligheter.fiks-nokkel"]);
  assert.deepEqual(bad("krr", { ...data, krr: { miljo: "test", klient: "borte" } }), ["maskinporten.klienter.borte", "maskinporten.hemmeligheter.borte-nokkel"]);
  assert.deepEqual(bad("documaster"), ["documaster.apiUrl", "documaster.tokenUrl", "documaster.clientId", "documaster.scope", "documaster.hemmeligheter.client-secret"]);
  assert.deepEqual(bad("altinn"), [], "en kunde som bare publiserer skjemaer, trenger ingen klient");
  assert.deepEqual(bad("altinn", { ...data, altinn: { hemmeligheter: { "subscription-key": "verdi" } } }), ["altinn.hemmeligheter.subscription-key"], "en valgfri referanse kan mangle, men står den, er den en referanse");
  assert.deepEqual(bad("finnes-ikke"), ["finnes-ikke"]);
  assert.equal(rows(data, "monitoring").find((x) => x.path === "monitoring.window").source, "standard");
  const r = report(root, { data, plugins: ["solution"] });
  assert.deepEqual(r.problems, []);
  assert.deepEqual(report(root, { data: { neo: { mcpServer: "annen" } }, plugins: [] }).problems.length, 2);
});

test("hemmelighetene vises med hvor de står og om personen når dem, aldri med verdien", () => {
  const root = repo({ "test/personaer/sara.yaml": "navn: Sara\nrolle: s\nhemmeligheter:\n  passord: { kilde: azure-keyvault:kv/sara }\n" });
  const data = { version: 2, fiks: { hemmeligheter: { passord: { kilde: "azure-keyvault:kv/p" }, feil: "verdi-som-ikke-skal-ut" } } };
  const calls = [];
  const exec = (cmd, args) => {
    calls.push(args.join(" "));
    if (args.includes("sara")) throw Object.assign(new Error("x"), { stderr: "ERROR: (Forbidden) Caller is not authorized" });
    return "true\n";
  };
  const { rows: rs, problems } = table(root, data, { exec });
  assert.deepEqual(rs.map((r) => [r.sted, r.nar.ok]), [["fiks.hemmeligheter.passord", true], ["test/personaer/sara.yaml#passord", false]]);
  assert.match(rs[1].nar.why, /Forbidden/);
  assert.ok(calls.every((c) => c.includes("--query attributes.enabled")), "bare om den finnes og er slått på");
  assert.equal(problems.length, 1);
  assert.doesNotMatch(JSON.stringify({ rs, problems }), /verdi-som-ikke-skal-ut/);
});
