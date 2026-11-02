import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, createVerify } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnvLocal, MissingSecret, refs, secretValues, value } from "./hemmeligheter.mjs";
import { basic, call, redact, report } from "./http.mjs";
import { assertion, loadKey, token } from "./maskinporten.mjs";

test("en referanse leses fra miljøet, og mangler den, sies navnet og kilden, aldri en verdi", () => {
  process.env.NEO_TEST_HEMMELIG = "s3cr3t-verdi";
  assert.equal(value({ $env: "NEO_TEST_HEMMELIG" }), "s3cr3t-verdi");
  assert.equal(value("vanlig"), "vanlig");
  assert.throws(() => value({ $env: "NEO_TEST_MANGLER", kilde: "azure-keyvault:kv-x/y" }), (e) => e instanceof MissingSecret && /NEO_TEST_MANGLER/.test(e.message) && /kv-x\/y/.test(e.message));
});

test(".env.local lastes uten å overskrive det som er satt", () => {
  const dir = mkdtempSync(join(tmpdir(), "env-"));
  process.env.NEO_TEST_SATT = "fra-miljøet";
  writeFileSync(join(dir, ".env.local"), "# kommentar\nNEO_TEST_SATT=fra-fila\nNEO_TEST_NY=\"ny\"\n");
  assert.equal(loadEnvLocal(dir), true);
  assert.equal(process.env.NEO_TEST_SATT, "fra-miljøet");
  assert.equal(process.env.NEO_TEST_NY, "ny");
});

test("referansene listes med sti og kilde, og verdiene kan sladdes", () => {
  const cfg = { fiks: { byEnv: { test: { passord: { $env: "NEO_TEST_HEMMELIG", kilde: "azure-keyvault:kv/p" }, id: "abc" } } } };
  assert.deepEqual(refs(cfg), [{ path: "fiks.byEnv.test.passord", env: "NEO_TEST_HEMMELIG", kilde: "azure-keyvault:kv/p", fil: false }]);
  const secrets = secretValues(cfg);
  assert.equal(redact("svar med s3cr3t-verdi og Bearer abcdefghijkl", secrets), "svar med [sladdet] og Bearer [sladdet]");
  assert.match(redact(basic("bruker", "passord123")), /Basic \[sladdet\]/);
});

test("kallet gir status, tid og JSON, og rapporten er sladdet", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ ok: "s3cr3t-verdi" }), { status: 200, headers: { "content-type": "application/json" } });
  const r = await call("https://x.test/a", { fetchImpl });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: "s3cr3t-verdi" });
  assert.doesNotMatch(report("GET", "https://x.test/a", r, ["s3cr3t-verdi"]), /s3cr3t/);
});

test("Maskinporten: assertion signert med nøkkelen, og token hentet med issuer fra well-known", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" });
  const { key, kid } = loadKey({ keyPem: pem });
  assert.ok(kid.length > 20);
  const jwt = assertion({ issuer: "https://test.maskinporten.no/", clientId: "c1", scopes: ["ks:fiks"], key, kid, now: 1000 });
  const [h, p, s] = jwt.split(".");
  assert.ok(createVerify("RSA-SHA256").update(`${h}.${p}`).verify(publicKey,Buffer.from(s, "base64url")));
  assert.deepEqual(JSON.parse(Buffer.from(p, "base64url")).scope, "ks:fiks");
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push(url);
    if (url.endsWith("oauth-authorization-server")) return new Response(JSON.stringify({ issuer: "https://test.maskinporten.no/", token_endpoint: "https://test.maskinporten.no/token" }));
    assert.match(init.body.toString(), /grant_type=urn/);
    return new Response(JSON.stringify({ access_token: "tok", expires_in: 120, scope: "ks:fiks" }));
  };
  const t = await token({ miljo: "test", clientId: "c1", scopes: ["ks:fiks"], keyPem: pem, fetchImpl });
  assert.equal(t.accessToken, "tok");
  assert.deepEqual(seen, ["https://test.maskinporten.no/.well-known/oauth-authorization-server", "https://test.maskinporten.no/token"]);
});
