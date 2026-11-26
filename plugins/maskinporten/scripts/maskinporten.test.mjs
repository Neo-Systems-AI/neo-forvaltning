import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { claims, main } from "./maskinporten.mjs";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" });

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const JWT = `${b64({ alg: "RS256" })}.${b64({ iss: "https://test.maskinporten.no/", client_id: "klient-test", consumer: { ID: "0192:999999999" }, scope: "krr:global/kontaktinformasjon.read", exp: 2000 })}.signatur-som-er-hemmelig`;

const data = { version: 2, maskinporten: { miljo: "test", klienter: { krr: { clientId: "klient-test", scopes: ["krr:global/kontaktinformasjon.read"] }, fiks: { clientId: "klient-fiks" } }, hemmeligheter: { "krr-nokkel": { kilde: "azure-keyvault:kv-kunde/mp-krr", fil: true }, "fiks-nokkel": { kilde: "azure-keyvault:kv-kunde/mp-fiks", fil: true } } } };
const config = { data };
const hemmelighet = () => PEM;
const wk = () => new Response(JSON.stringify({ issuer: "https://test.maskinporten.no/", token_endpoint: "https://test.maskinporten.no/token" }), { headers: { "content-type": "application/json" } });
const capture = () => {
  const lines = [];
  return { out: (l) => lines.push(l), err: (l) => lines.push(l), text: () => lines.join("\n") };
};

test("token viser scope og utløp fra Maskinporten, aldri tokenet eller nøkkelen", async () => {
  const c = capture();
  const fetchImpl = async (url) => (url.endsWith("oauth-authorization-server") ? wk() : new Response(JSON.stringify({ access_token: JWT, expires_in: 120, scope: "krr:global/kontaktinformasjon.read" })));
  assert.equal(await main(["token", "krr"], { fetchImpl, config, hemmelighet, ...c, now: () => 0 }), 0);
  const text = c.text();
  assert.match(text, /Miljø: test/);
  assert.match(text, /innvilget: krr:global\/kontaktinformasjon\.read/);
  assert.match(text, /expires_in: 120 s, utløper 1970-01-01T00:02:00\.000Z/);
  assert.match(text, /"consumer":"0192:999999999"/);
  assert.doesNotMatch(text, /signatur-som-er-hemmelig|BEGIN PRIVATE KEY/);
});

test("et scope som ikke ble innvilget, sies; en klient uten scopes trenger --scope", async () => {
  const c = capture();
  const fetchImpl = async (url) => (url.endsWith("oauth-authorization-server") ? wk() : new Response(JSON.stringify({ access_token: "tok-hemmelig-123", expires_in: 120, scope: "" }))); // gitleaks:allow (oppdiktet token i testen)
  await main(["token", "krr", "--scope", "a:b c:d"], { fetchImpl, config, hemmelighet, ...c });
  assert.match(c.text(), /ikke innvilget: a:b c:d/);
  assert.doesNotMatch(c.text(), /tok-hemmelig-123/);
  const c2 = capture();
  assert.equal(await main(["token", "fiks"], { fetchImpl, config, hemmelighet, ...c2 }), 1);
  assert.match(c2.text(), /Ingen scopes for maskinporten.klienter.fiks/);
});

test("avslaget fra Maskinporten kommer fram med error og error_description, og exit 1", async () => {
  const c = capture();
  const fetchImpl = async (url) => (url.endsWith("oauth-authorization-server") ? wk() : new Response(JSON.stringify({ error: "invalid_scope", error_description: "Scope krr:x not allowed for client" }), { status: 400 }));
  assert.equal(await main(["token", "krr", "--scope", "krr:x"], { fetchImpl, config, hemmelighet, ...c }), 1);
  assert.match(c.text(), /400 invalid_scope Scope krr:x not allowed/);
});

test("en nøkkel som ikke står under maskinporten.hemmeligheter, sies med stedet den skal stå", async () => {
  const c = capture();
  const d = structuredClone(data);
  d.maskinporten.klienter.altinn = { clientId: "a", scopes: ["x"] };
  assert.equal(await main(["token", "altinn"], { fetchImpl: async () => wk(), config: { data: d }, hemmelighet, ...c }), 1);
  assert.match(c.text(), /maskinporten.hemmeligheter.altinn-nokkel står ikke i .claude\/neo.config.json/);
});

test("well-known viser issuer og token-endepunkt for miljøet, og en feil gir exit 1", async () => {
  const c = capture();
  assert.equal(await main(["well-known"], { fetchImpl: async () => wk(), config, ...c }), 0);
  assert.match(c.text(), /GET https:\/\/test\.maskinporten\.no\/\.well-known\/oauth-authorization-server → 200/);
  assert.match(c.text(), /token_endpoint: https:\/\/test\.maskinporten\.no\/token/);
  const c2 = capture();
  assert.equal(await main(["well-known", "--miljo", "produksjon"], { fetchImpl: async () => new Response("nede", { status: 503 }), config, ...c2 }), 1);
  assert.match(c2.text(), /maskinporten\.no\/\.well-known.*→ 503/);
});

test("claimene leses uten tokenet, og feil bruk gir bruken og exit 2", async () => {
  assert.equal(claims(JWT).client_id, "klient-test");
  assert.equal(claims("ikke-en-jwt"), null);
  for (const argv of [["send"], ["token"], ["token", "krr", "--miljo", "produksjon"], ["token", "krr", "--ukjent", "x"]]) {
    const c = capture();
    assert.equal(await main(argv, { config, ...c }), 2, argv.join(" "));
  }
});
