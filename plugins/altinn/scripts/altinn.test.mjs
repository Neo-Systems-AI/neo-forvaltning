import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { EXCHANGE_PATH, hidePersons, parseInstance, run, settings } from "./altinn.mjs";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" });
const GUID = "0b4e6f1a-2c3d-4e5f-8a9b-0c1d2e3f4a5b";
const FNR = "01017012345";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const ALTINN_TOKEN = `${b64({ alg: "RS256" })}.${b64({ iss: "https://platform.tt02.altinn.no/authentication/api/v1/openid/", "urn:altinn:org": "ttd", scope: "altinn:serviceowner/instances.read", exp: 2000000000 })}.signatur`;

const data = {
  version: 2,
  altinn: { miljo: "tt02", klient: "altinn", org: "ttd", apps: ["ttd/skjema"] },
  maskinporten: { miljo: "test", klienter: { altinn: { clientId: "klient-tt02", scopes: ["altinn:serviceowner/instances.read", "altinn:serviceowner/events"] } } },
};
const config = { data };
const hemmelighet = (d, navn) => (navn.startsWith("maskinporten--") ? PEM : null);

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

test("innstillingene: miljøet og klienten må være sagt, og et ukjent miljø er en feil", () => {
  assert.deepEqual(settings(data).hosts.maskinporten, "test");
  assert.throws(() => settings({ altinn: { klient: "altinn" } }), /Miljøet for altinn er ikke sagt: sett altinn.miljo/);
  assert.throws(() => settings({ altinn: { miljo: "at22", klient: "altinn" } }), /har ikke miljøet «at22»/);
  assert.throws(() => settings({ altinn: { miljo: "tt02" } }), /altinn.klient mangler/);
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
    assert.equal(await run(argv, { config, fetchImpl, hemmelighet, ...c }), 2, argv.join(" "));
  }
  assert.equal(seen.length, 0);
});

test("token: Maskinporten, så vekslingen med GET, og claims uten tokenet", async () => {
  const { seen, fetchImpl } = fake(() => assert.fail("ingen API-kall"));
  const c = capture();
  assert.equal(await run(["token"], { config, fetchImpl, hemmelighet, ...c }), 0);
  const ex = seen.find((x) => x.url.endsWith(EXCHANGE_PATH));
  assert.equal(ex.url, `https://platform.tt02.altinn.no${EXCHANGE_PATH}`);
  assert.equal(ex.init.method, "GET");
  assert.equal(ex.init.headers.authorization, "Bearer mp-token-abcdefgh");
  assert.match(c.text(), /"urn:altinn:org": "ttd"/);
  assert.doesNotMatch(c.text(), /mp-token-abcdefgh|signatur/);
});

test("instans: Storage med part-formen, fødselsnummeret skjult, og ikke-2xx gir exit 1", async () => {
  const { seen, fetchImpl } = fake((url) => (url.includes(GUID) ? json({ id: `51234/${GUID}`, appId: "ttd/skjema", instanceOwner: { partyId: "51234", personNumber: FNR } }) : json({ title: "Not found" }, 404)));
  let c = capture();
  assert.equal(await run(["instans", `51234/${GUID}`], { config, fetchImpl, hemmelighet, ...c }), 0);
  assert.equal(seen.at(-1).url, `https://platform.tt02.altinn.no/storage/api/v1/instances/51234/${GUID}`);
  assert.equal(seen.at(-1).init.headers.authorization, `Bearer ${ALTINN_TOKEN}`);
  assert.doesNotMatch(c.text(), new RegExp(FNR));
  assert.doesNotMatch(c.text(), /signatur/);
  c = capture();
  assert.equal(await run(["instans", `51234/${GUID}`, "--vis-person"], { config, fetchImpl, hemmelighet, ...c }), 0);
  assert.match(c.text(), new RegExp(FNR));
  c = capture();
  assert.equal(await run(["instans", `51234/${"1".repeat(8)}-1111-1111-1111-111111111111`], { config, fetchImpl, hemmelighet, ...c }), 1);
  assert.match(c.text(), /→ 404/);
});

test("instanser: appId fra config, og --ko er arkivert og ikke kvittert", async () => {
  const { seen, fetchImpl } = fake(() => json({ count: 1, instances: [{ id: `51234/${GUID}`, appId: "ttd/skjema", process: { currentTask: { elementId: "Task_1" } } }] }));
  const c = capture();
  assert.equal(await run(["instanser", "--ko"], { config, fetchImpl, hemmelighet, ...c }), 0);
  const u = new URL(seen.at(-1).url);
  assert.equal(u.pathname, "/storage/api/v1/instances");
  assert.equal(u.searchParams.get("appId"), "ttd/skjema");
  assert.equal(u.searchParams.get("status.isArchived"), "true");
  assert.equal(u.searchParams.get("confirmed"), "false");
  assert.match(c.text(), /Antall: 1/);
});

test("prosess: appen fra instansen når --app mangler, mot app-verten", async () => {
  const d = structuredClone(data);
  d.altinn.apps = [];
  const { seen, fetchImpl } = fake((url) => (url.includes("/storage/") ? json({ appId: "ttd/annen" }) : json({ currentTask: { elementId: "Task_1" } })));
  const c = capture();
  assert.equal(await run(["prosess", `51234/${GUID}`, "--historikk"], { config: { data: d }, fetchImpl, hemmelighet, ...c }), 0);
  assert.equal(seen.at(-1).url, `https://ttd.apps.tt02.altinn.no/ttd/annen/instances/51234/${GUID}/process/history`);
});

test("data: bare metadata uten --innhold; med --innhold hentes elementet", async () => {
  const el = "1a2b3c4d-1111-2222-3333-444455556666";
  const { seen, fetchImpl } = fake((url) => (url.endsWith(`/data/${el}`) ? new Response("<skjema/>", { headers: { "content-type": "application/xml" } }) : json({ data: [{ id: el, dataType: "model", contentType: "application/xml", size: 9 }] })));
  let c = capture();
  assert.equal(await run(["data", `51234/${GUID}`], { config, fetchImpl, hemmelighet, ...c }), 0);
  assert.ok(!seen.some((x) => x.url.includes("/data/")));
  assert.match(c.text(), /bare metadata/);
  c = capture();
  assert.equal(await run(["data", `51234/${GUID}`, el, "--innhold"], { config, fetchImpl, hemmelighet, ...c }), 0);
  assert.equal(seen.at(-1).init.headers.accept, "*/*");
  assert.match(c.text(), /<skjema\/>/);
});

test("hendelser: resource og after er med, --alle leser til en tom side", async () => {
  const pages = { 0: [{ id: "a", time: "2026-11-01T10:00:00Z", type: "app.instance.created", alternativesubject: `/person/${FNR}` }], a: [{ id: "b", time: "2026-11-01T10:01:00Z", type: "app.instance.process.completed" }], b: [] };
  const { seen, fetchImpl } = fake((url) => json(pages[new URL(url).searchParams.get("after")]));
  const c = capture();
  assert.equal(await run(["hendelser", "--alle"], { config, fetchImpl, hemmelighet, ...c }), 0);
  const u = new URL(seen.find((x) => x.url.includes("/events/")).url);
  assert.equal(u.searchParams.get("resource"), "urn:altinn:resource:app_ttd_skjema");
  assert.equal(u.searchParams.get("after"), "0");
  assert.match(c.text(), /Paginert til enden: 2/);
  assert.doesNotMatch(c.text(), new RegExp(FNR));
});

test("en avslått veksling gir exit 1 uten Maskinporten-tokenet", async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith("oauth-authorization-server")) return json({ issuer: "https://test.maskinporten.no/", token_endpoint: "https://test.maskinporten.no/token" });
    if (url.endsWith("/token")) return json({ access_token: "mp-token-abcdefgh" });
    return json({ echo: "Bearer mp-token-abcdefgh", raw: "mp-token-abcdefgh" }, 401);
  };
  const c = capture();
  assert.equal(await run(["token"], { config, fetchImpl, hemmelighet, ...c }), 1);
  assert.match(c.text(), /Vekslingen hos Altinn feilet: 401/);
  assert.doesNotMatch(c.text(), /mp-token-abcdefgh/);
});

test("tokenet går mot Maskinporten i miljøet Altinn hører til, og klientene i et annet miljø er en feil", async () => {
  const { seen, fetchImpl } = fake(() => assert.fail("ingen API-kall"));
  const c = capture();
  const d = structuredClone(data);
  d.altinn.miljo = "produksjon";
  assert.equal(await run(["token"], { config: { data: d }, fetchImpl, hemmelighet, ...c }), 1);
  assert.match(c.text(), /Klientene i maskinporten.klienter er for test, men kallet går mot produksjon/);
  assert.equal(seen.length, 0);
});

test("en subscription key brukes når nøkkelen altinn--subscription-key står i hvelvet, og sladdes", async () => {
  const d = structuredClone(data);
  const { seen, fetchImpl } = fake(() => json({ ekko: "sub-key-hemmelig" }));
  const c = capture();
  assert.equal(await run(["instans", `51234/${GUID}`], { config: { data: d }, fetchImpl, hemmelighet: (_, navn) => (navn === "altinn--subscription-key" ? "sub-key-hemmelig" : PEM), ...c }), 0);
  assert.equal(seen.at(-1).init.headers["ocp-apim-subscription-key"], "sub-key-hemmelig");
  assert.doesNotMatch(c.text(), /sub-key-hemmelig/);
});
