import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EXCHANGE_PATH, hidePersons, keySource, parseInstance, pickEnv, run, settings } from "./altinn.mjs";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" });
const GUID = "0b4e6f1a-2c3d-4e5f-8a9b-0c1d2e3f4a5b";
const FNR = "01017012345";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const ALTINN_TOKEN = `${b64({ alg: "RS256" })}.${b64({ iss: "https://platform.tt02.altinn.no/authentication/api/v1/openid/", "urn:altinn:org": "ttd", scope: "altinn:serviceowner/instances.read", exp: 2000000000 })}.signatur`;

const data = {
  version: 1,
  altinn: {
    org: "ttd",
    apps: ["ttd/skjema"],
    environments: ["tt02", "produksjon"],
    byEnv: {
      tt02: { maskinporten: { clientId: "klient-tt02", nokkel: { $env: "NEO_TEST_ALTINN_NOKKEL", kilde: "azure-keyvault:<hvelv>/altinn", fil: true } } },
    },
  },
};

const json = (body, status = 200) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// Maskinporten, vekslingen og så API-et. Alt som ikke er token-kjeden, går til `api`.
const fake = (api) => {
  const seen = [];
  const fetchImpl = async (url, init = {}) => {
    seen.push({ url, init });
    if (url.endsWith("/.well-known/oauth-authorization-server")) return json({ issuer: "https://test.maskinporten.no/", token_endpoint: "https://test.maskinporten.no/token" });
    if (url === "https://test.maskinporten.no/token") return json({ access_token: "mp-token-abcdefgh", expires_in: 120, scope: "altinn:serviceowner/instances.read" });
    if (url.endsWith(EXCHANGE_PATH)) return json(JSON.stringify(ALTINN_TOKEN));
    return api(url, init);
  };
  return { seen, fetchImpl };
};
const capture = () => {
  const lines = { out: [], err: [] };
  return { lines, out: (s) => lines.out.push(s), err: (s) => lines.err.push(s), text: () => [...lines.out, ...lines.err].join("\n") };
};

test("miljøet: altinn.miljo (tt02) som standard, og bare tt02 og produksjon", () => {
  assert.equal(pickEnv(data), "tt02");
  assert.equal(pickEnv(data, "produksjon"), "produksjon");
  assert.throws(() => pickEnv(data, "at22"), /ikke et miljø/);
  assert.throws(() => pickEnv({ altinn: { environments: ["test"] } }, "test"), /ikke et Altinn-miljø/);
  assert.throws(() => pickEnv({ altinn: {} }), /environments mangler/);
});

test("innstillingene: scopes fra pluginen, manglende klient sies med sti, nøkkel med verdi avvises", () => {
  const s = settings(data, "tt02");
  assert.deepEqual(s.scopes, ["altinn:serviceowner/instances.read", "altinn:serviceowner/events", "altinn:events.subscribe"]);
  assert.throws(() => settings(data, "produksjon"), /altinn\.byEnv\.produksjon\.maskinporten\.clientId er ikke satt/);
  const bad = structuredClone(data);
  bad.altinn.byEnv.tt02.maskinporten.nokkel = "-----BEGIN PRIVATE KEY-----";
  assert.throws(() => settings(bad, "tt02"), /skal være en referanse/);
});

test("nøkkelen: en sti relativ til repoet, eller en PEM i miljøet", () => {
  process.env.NEO_TEST_K = ".keys/altinn.pem";
  assert.deepEqual(keySource({ $env: "NEO_TEST_K" }, "/repo"), { keyFile: "/repo/.keys/altinn.pem" });
  process.env.NEO_TEST_K = PEM;
  assert.ok(keySource({ $env: "NEO_TEST_K" }).keyPem.includes("BEGIN"));
});

test("instans-id og fødselsnumre", () => {
  assert.deepEqual(parseInstance(`51234/${GUID}`), { part: "51234", guid: GUID });
  assert.throws(() => parseInstance(`../${GUID}`), /<part>\/<guid>/);
  assert.deepEqual(hidePersons({ instanceOwner: { partyId: "1", personNumber: FNR }, alternativesubject: `/person/${FNR}`, liste: [{ ssn: FNR }] }), {
    instanceOwner: { partyId: "1", personNumber: "[skjult]" },
    alternativesubject: "/person/[skjult]",
    liste: [{ ssn: "[skjult]" }],
  });
});

test("feil bruk gir exit 2 uten kall", async () => {
  const { seen, fetchImpl } = fake(() => assert.fail("ingen kall"));
  for (const argv of [[], ["opprett"], ["instans", "1/2"], ["prosess"], ["instanser", "--app", "ttd/skjema", "--org", "ttd"], ["appmeta", "--app", "../x"], ["data", `1/${GUID}`, "--innhold"], ["instanser", "--antall", "-1"]]) {
    const c = capture();
    assert.equal(await run(argv, { data, fetchImpl, ...c }), 2, argv.join(" "));
  }
  assert.equal(seen.length, 0);
});

test("token: Maskinporten, så vekslingen med GET, og claims uten tokenet", async () => {
  process.env.NEO_TEST_ALTINN_NOKKEL = PEM;
  const { seen, fetchImpl } = fake(() => assert.fail("ingen API-kall"));
  const c = capture();
  assert.equal(await run(["token"], { data, fetchImpl, ...c }), 0);
  const ex = seen.find((x) => x.url.endsWith(EXCHANGE_PATH));
  assert.equal(ex.url, `https://platform.tt02.altinn.no${EXCHANGE_PATH}`);
  assert.equal(ex.init.method, "GET");
  assert.equal(ex.init.headers.authorization, "Bearer mp-token-abcdefgh");
  assert.match(c.text(), /"urn:altinn:org": "ttd"/);
  assert.doesNotMatch(c.text(), /mp-token-abcdefgh|signatur/);
});

test("instans: Storage med part-formen, fødselsnummeret skjult, og ikke-2xx gir exit 1", async () => {
  process.env.NEO_TEST_ALTINN_NOKKEL = PEM;
  const { seen, fetchImpl } = fake((url) => (url.includes(GUID) ? json({ id: `51234/${GUID}`, appId: "ttd/skjema", instanceOwner: { partyId: "51234", personNumber: FNR } }) : json({ title: "Not found" }, 404)));
  let c = capture();
  assert.equal(await run(["instans", `51234/${GUID}`], { data, fetchImpl, ...c }), 0);
  assert.equal(seen.at(-1).url, `https://platform.tt02.altinn.no/storage/api/v1/instances/51234/${GUID}`);
  assert.equal(seen.at(-1).init.headers.authorization, `Bearer ${ALTINN_TOKEN}`);
  assert.doesNotMatch(c.text(), new RegExp(FNR));
  assert.doesNotMatch(c.text(), /signatur/);
  c = capture();
  assert.equal(await run(["instans", `51234/${GUID}`, "--vis-person"], { data, fetchImpl, ...c }), 0);
  assert.match(c.text(), new RegExp(FNR));
  c = capture();
  assert.equal(await run(["instans", `51234/${"1".repeat(8)}-1111-1111-1111-111111111111`], { data, fetchImpl, ...c }), 1);
  assert.match(c.text(), /→ 404/);
});

test("instanser: appId fra config, og --ko er arkivert og ikke kvittert", async () => {
  process.env.NEO_TEST_ALTINN_NOKKEL = PEM;
  const { seen, fetchImpl } = fake(() => json({ count: 1, instances: [{ id: `51234/${GUID}`, appId: "ttd/skjema", process: { currentTask: { elementId: "Task_1" } } }] }));
  const c = capture();
  assert.equal(await run(["instanser", "--ko"], { data, fetchImpl, ...c }), 0);
  const u = new URL(seen.at(-1).url);
  assert.equal(u.pathname, "/storage/api/v1/instances");
  assert.equal(u.searchParams.get("appId"), "ttd/skjema");
  assert.equal(u.searchParams.get("status.isArchived"), "true");
  assert.equal(u.searchParams.get("confirmed"), "false");
  assert.match(c.text(), /Antall: 1/);
});

test("prosess: appen fra instansen når --app mangler, mot app-verten", async () => {
  process.env.NEO_TEST_ALTINN_NOKKEL = PEM;
  const d = structuredClone(data);
  d.altinn.apps = [];
  const { seen, fetchImpl } = fake((url) => (url.includes("/storage/") ? json({ appId: "ttd/annen" }) : json({ currentTask: { elementId: "Task_1" } })));
  const c = capture();
  assert.equal(await run(["prosess", `51234/${GUID}`, "--historikk"], { data: d, fetchImpl, ...c }), 0);
  assert.equal(seen.at(-1).url, `https://ttd.apps.tt02.altinn.no/ttd/annen/instances/51234/${GUID}/process/history`);
});

test("data: bare metadata uten --innhold; med --innhold hentes elementet", async () => {
  process.env.NEO_TEST_ALTINN_NOKKEL = PEM;
  const el = "1a2b3c4d-1111-2222-3333-444455556666";
  const { seen, fetchImpl } = fake((url) => (url.endsWith(`/data/${el}`) ? new Response("<skjema/>", { headers: { "content-type": "application/xml" } }) : json({ data: [{ id: el, dataType: "model", contentType: "application/xml", size: 9 }] })));
  let c = capture();
  assert.equal(await run(["data", `51234/${GUID}`], { data, fetchImpl, ...c }), 0);
  assert.ok(!seen.some((x) => x.url.includes("/data/")));
  assert.match(c.text(), /bare metadata/);
  c = capture();
  assert.equal(await run(["data", `51234/${GUID}`, el, "--innhold"], { data, fetchImpl, ...c }), 0);
  assert.equal(seen.at(-1).init.headers.accept, "*/*");
  assert.match(c.text(), /<skjema\/>/);
});

test("hendelser: resource og after er med, --alle leser til en tom side", async () => {
  process.env.NEO_TEST_ALTINN_NOKKEL = PEM;
  const pages = { 0: [{ id: "a", time: "2026-11-01T10:00:00Z", type: "app.instance.created", alternativesubject: `/person/${FNR}` }], a: [{ id: "b", time: "2026-11-01T10:01:00Z", type: "app.instance.process.completed" }], b: [] };
  const { seen, fetchImpl } = fake((url) => json(pages[new URL(url).searchParams.get("after")]));
  const c = capture();
  assert.equal(await run(["hendelser", "--alle"], { data, fetchImpl, ...c }), 0);
  const u = new URL(seen.find((x) => x.url.includes("/events/")).url);
  assert.equal(u.searchParams.get("resource"), "urn:altinn:resource:app_ttd_skjema");
  assert.equal(u.searchParams.get("after"), "0");
  assert.match(c.text(), /Paginert til enden: 2/);
  assert.doesNotMatch(c.text(), new RegExp(FNR));
});

test("en avslått veksling gir exit 1 uten Maskinporten-tokenet", async () => {
  process.env.NEO_TEST_ALTINN_NOKKEL = PEM;
  const fetchImpl = async (url) => {
    if (url.endsWith("oauth-authorization-server")) return json({ issuer: "https://test.maskinporten.no/", token_endpoint: "https://test.maskinporten.no/token" });
    if (url.endsWith("/token")) return json({ access_token: "mp-token-abcdefgh" });
    return json({ echo: "Bearer mp-token-abcdefgh", raw: "mp-token-abcdefgh" }, 401);
  };
  const c = capture();
  assert.equal(await run(["token"], { data, fetchImpl, ...c }), 1);
  assert.match(c.text(), /Vekslingen hos Altinn feilet: 401/);
  assert.doesNotMatch(c.text(), /mp-token-abcdefgh/);
});

test("nøkkelfila leses fra en sti under repoet", async () => {
  const root = mkdtempSync(join(tmpdir(), "altinn-"));
  writeFileSync(join(root, "nokkel.pem"), PEM);
  process.env.NEO_TEST_ALTINN_NOKKEL = "nokkel.pem";
  const { fetchImpl } = fake(() => assert.fail("ingen API-kall"));
  const c = capture();
  assert.equal(await run(["token"], { data, root, fetchImpl, ...c }), 0);
});
