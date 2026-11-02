import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { claims, klient, main, velgMiljo } from "./maskinporten.mjs";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const root = mkdtempSync(join(tmpdir(), "mp-"));
writeFileSync(join(root, "nokkel.pem"), privateKey.export({ type: "pkcs8", format: "pem" }));

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const JWT = `${b64({ alg: "RS256" })}.${b64({ iss: "https://test.maskinporten.no/", client_id: "klient-test", consumer: { ID: "0192:999999999" }, scope: "krr:global/kontaktinformasjon.read", exp: 2000 })}.signatur-som-er-hemmelig`;

const data = {
  version: 1,
  maskinporten: {
    environments: ["test", "produksjon"],
    defaultEnv: "test",
    byEnv: {
      test: {
        clientId: "klient-test",
        nokkel: { $env: "NEO_TEST_MP_KEY_FILE", kilde: "azure-keyvault:kv-kunde/mp", fil: true },
        scopes: ["ks:fiks"],
        klienter: { krr: { scopes: ["krr:global/kontaktinformasjon.read"] }, fiks: { clientId: "klient-fiks" } },
      },
    },
  },
};
process.env.NEO_TEST_MP_KEY_FILE = "nokkel.pem";

const wk = () => new Response(JSON.stringify({ issuer: "https://test.maskinporten.no/", token_endpoint: "https://test.maskinporten.no/token" }), { headers: { "content-type": "application/json" } });
const capture = () => {
  const lines = [];
  return { lines, out: (l) => lines.push(l), err: (l) => lines.push(l), text: () => lines.join("\n") };
};

test("miljøet: det som er sagt, ellers defaultEnv, og et ukjent miljø er en feil", () => {
  assert.equal(velgMiljo(data), "test");
  assert.equal(velgMiljo(data, "produksjon"), "produksjon");
  assert.throws(() => velgMiljo(data, "prod"), /ikke et miljø/);
  assert.throws(() => velgMiljo({}), /Ingen miljøer/);
});

test("en navngitt klient arver det den ikke har fra standardklienten", () => {
  assert.deepEqual(klient(data, "test", "krr").scopes, ["krr:global/kontaktinformasjon.read"]);
  assert.equal(klient(data, "test", "krr").clientId, "klient-test");
  assert.equal(klient(data, "test", "fiks").clientId, "klient-fiks");
  assert.deepEqual(klient(data, "test").scopes, ["ks:fiks"]);
  assert.throws(() => klient(data, "test", "altinn"), /står ikke.*krr, fiks/);
  assert.throws(() => klient(data, "produksjon"), /clientId mangler/);
});

test("token viser scope og utløp fra Maskinporten, aldri tokenet", async () => {
  const c = capture();
  const fetchImpl = async (url) => (url.endsWith("oauth-authorization-server") ? wk() : new Response(JSON.stringify({ access_token: JWT, expires_in: 120, scope: "krr:global/kontaktinformasjon.read" })));
  const code = await main(["token", "krr"], { fetchImpl, config: { data, root }, ...c, now: () => 0 });
  assert.equal(code, 0);
  const text = c.text();
  assert.match(text, /Miljø: test/);
  assert.match(text, /innvilget: krr:global\/kontaktinformasjon\.read/);
  assert.match(text, /expires_in: 120 s, utløper 1970-01-01T00:02:00\.000Z/);
  assert.match(text, /"consumer":"0192:999999999"/);
  assert.doesNotMatch(text, /signatur-som-er-hemmelig/);
  assert.ok(!text.includes(JWT));
});

test("et scope som ikke ble innvilget, sies", async () => {
  const c = capture();
  const fetchImpl = async (url) => (url.endsWith("oauth-authorization-server") ? wk() : new Response(JSON.stringify({ access_token: "tok-hemmelig-123", expires_in: 120, scope: "" }))); // gitleaks:allow (oppdiktet token i testen)
  await main(["token", "--scope", "a:b c:d"], { fetchImpl, config: { data, root }, ...c });
  assert.match(c.text(), /ikke innvilget: a:b c:d/);
  assert.doesNotMatch(c.text(), /tok-hemmelig-123/);
});

test("avslaget fra Maskinporten kommer fram med error og error_description, og exit 1", async () => {
  const c = capture();
  const fetchImpl = async (url) => (url.endsWith("oauth-authorization-server") ? wk() : new Response(JSON.stringify({ error: "invalid_scope", error_description: "Scope krr:x not allowed for client" }), { status: 400 }));
  const code = await main(["token", "krr", "--scope", "krr:x"], { fetchImpl, config: { data, root }, ...c });
  assert.equal(code, 1);
  assert.match(c.text(), /400 invalid_scope Scope krr:x not allowed/);
});

test("en hemmelighet som mangler, sies med navnet og kilden", async () => {
  const c = capture();
  const d = structuredClone(data);
  d.maskinporten.byEnv.test.nokkel = { $env: "NEO_TEST_MP_MANGLER", kilde: "azure-keyvault:kv-kunde/mp", fil: true };
  const code = await main(["token"], { fetchImpl: async () => wk(), config: { data: d, root }, ...c });
  assert.equal(code, 1);
  assert.match(c.text(), /NEO_TEST_MP_MANGLER er ikke satt.*kv-kunde\/mp/);
});

test("well-known viser issuer og token-endepunkt, og en feil gir exit 1", async () => {
  const c = capture();
  assert.equal(await main(["well-known"], { fetchImpl: async () => wk(), config: { data, root }, ...c }), 0);
  assert.match(c.text(), /GET https:\/\/test\.maskinporten\.no\/\.well-known\/oauth-authorization-server → 200/);
  assert.match(c.text(), /token_endpoint: https:\/\/test\.maskinporten\.no\/token/);
  const c2 = capture();
  assert.equal(await main(["well-known", "--miljo", "produksjon"], { fetchImpl: async () => new Response("nede", { status: 503 }), config: { data, root }, ...c2 }), 1);
  assert.match(c2.text(), /maskinporten\.no\/\.well-known.*→ 503/);
});

test("claimene leses uten tokenet, og en ugyldig kommando gir bruken", async () => {
  assert.equal(claims(JWT).client_id, "klient-test");
  assert.equal(claims("ikke-en-jwt"), null);
  const c = capture();
  assert.equal(await main(["send"], { config: { data, root }, ...c }), 2);
  assert.match(c.text(), /Bruk:/);
});
