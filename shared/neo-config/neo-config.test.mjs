import { test } from "node:test";
import assert from "node:assert/strict";
import { check, resolve, validate } from "./neo-config.mjs";

const data = {
  version: 1,
  neo: { environments: ["sandkasse", "produksjon"], defaultEnv: "sandkasse", byEnv: { sandkasse: { mcpServer: "neo-sandkasse" }, produksjon: {} } },
  helse: { window: "7d" },
  enFramtidigPlugin: { x: 1 },
};
const helse = { plugin: "helse", neo: true, keys: [{ path: "window", fallback: "24h", doc: "vinduet" }, { path: "kanal", required: true, doc: "kanalen" }] };
const altinn = { plugin: "altinn", keys: [{ path: "org", doc: "tjenesteeieren" }] };

test("en gyldig fil har ingen feil, også med en del for en plugin som ikke finnes ennå", () => assert.deepEqual(validate(data), []));

test("et miljø som ikke er listet, er en feil", () => {
  assert.deepEqual(validate({ ...data, neo: { ...data.neo, byEnv: { test: {} } } }), ["neo.byEnv.test er ikke et miljø i neo.environments"]);
});

test("verdien sier hvor den kom fra, og pluginens nøkler står under pluginens navn", () => {
  assert.deepEqual(resolve(data, "window", { keys: helse }), { path: "helse.window", value: "7d", source: "config" });
  assert.deepEqual(resolve(data, "mcpServer", { keys: helse }), { path: "neo.byEnv.sandkasse.mcpServer", value: "neo-sandkasse", source: "config" });
  assert.equal(resolve(data, "neo.defaultEnv", { keys: helse }).source, "config");
  assert.deepEqual(resolve({ version: 1 }, "window", { keys: helse }), { path: "helse.window", value: "24h", source: "plugin-standard" });
});

test("et eksternt system har egne miljøer, og nøkkelen slås opp per miljø", () => {
  const sys = { plugin: "altinn", environments: true, keys: [{ path: "org", perEnv: true, required: true, doc: "tjenesteeieren" }] };
  const cfg = { version: 1, altinn: { environments: ["tt02", "produksjon"], byEnv: { tt02: { org: "ttd" } } } };
  assert.deepEqual(resolve(cfg, "org", { keys: sys }), { path: "altinn.byEnv.tt02.org", value: "ttd", source: "config" });
  assert.deepEqual(check(cfg, sys).filter((r) => !r.ok).map((r) => r.path), ["altinn.byEnv.produksjon.org"]);
  assert.deepEqual(check({ version: 1 }, sys).filter((r) => !r.ok).map((r) => r.path), ["altinn.environments"]);
  const optional = { ...sys, keys: [{ ...sys.keys[0], required: false }] };
  assert.deepEqual(check({ version: 1 }, optional).filter((r) => !r.ok), []);
});

test("--check krever den felles delen bare for en plugin som snakker med Neo", () => {
  const missing = check(data, helse).filter((r) => !r.ok).map((r) => r.path);
  assert.deepEqual(missing, ["neo.byEnv.produksjon.mcpServer", "helse.kanal"]);
  assert.deepEqual(check({ version: 1 }, altinn).filter((r) => !r.ok), []);
});
