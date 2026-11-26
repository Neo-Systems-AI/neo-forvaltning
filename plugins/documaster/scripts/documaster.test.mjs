import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQuery, parseArgs, run, settings, QUERY_PATH } from "./documaster.mjs";

const SECRET = "dm-hemmelig-verdi";
const data = { version: 2, documaster: { apiUrl: "https://arkiv.test.example:8083/", tokenUrl: "https://idp.test.example/token", clientId: "klient-test", scope: "openid", hemmeligheter: { "client-secret": { $env: "DOCUMASTER_CLIENT_SECRET", kilde: "azure-keyvault:kv-kunde/documaster-client-secret" } } } };
const config = { data };
const hemmelighet = () => SECRET;

const fake = (answer) => {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push({ url, init });
    if (url.endsWith("/token")) return new Response(JSON.stringify({ access_token: "tok-abcdefghijkl", token_type: "Bearer", expires_in: 300 }), { headers: { "content-type": "application/json" } });
    return answer(url, init);
  };
  return { seen, fetchImpl };
};

const capture = () => {
  const lines = { out: [], err: [] };
  return { lines, out: (s) => lines.out.push(s), err: (s) => lines.err.push(s) };
};

test("innstillingene: en manglende nøkkel sies med sti, og hemmeligheten står ikke i config-fila", () => {
  assert.equal(settings(data).apiUrl, "https://arkiv.test.example:8083");
  assert.throws(() => settings({ documaster: { ...data.documaster, apiUrl: undefined } }), /documaster\.apiUrl mangler i \.claude\/neo\.config\.json/);
});

test("spørringene har formen produktet bruker", () => {
  assert.deepEqual(buildQuery(parseArgs(["journalpost", "123"])), { type: "Journalpost", limit: 1, query: "id = @id", parameters: { "@id": "123" } });
  assert.deepEqual(buildQuery(parseArgs(["mappe", "--saksnummer", "2026/12"])), { type: "AbstraktMappe", limit: 10, query: "mappeIdent = @saksnummer", parameters: { "@saksnummer": "2026/12" } });
  assert.deepEqual(buildQuery(parseArgs(["registreringer", "--mappe", "9", "--limit", "5"])).query, "refMappe.id = @mappeId");
  assert.equal(buildQuery(parseArgs(["dokumenter", "--registrering", "7"])).type, "Dokumentversjon");
  assert.deepEqual(buildQuery(parseArgs(["sok", "--type", "EksternId", "--query", "eksternID = @e", "--param", "@e=neo-1"])), { type: "EksternId", limit: 10, query: "eksternID = @e", parameters: { "@e": "neo-1" } });
  assert.equal(buildQuery(parseArgs(["token"])), null);
});

test("feil bruk gir exit 2 uten kall", async () => {
  const { seen, fetchImpl } = fake(() => assert.fail("ingen kall"));
  for (const argv of [[], ["slett", "1"], ["mappe"], ["arkivdeler", "--limit", "500"], ["sok", "--type", "x; drop"], ["sok", "--type", "Journalpost", "--param", "uten-krøllalfa"]]) {
    const c = capture();
    assert.equal(await run(argv, { config, fetchImpl, hemmelighet, ...c }), 2, argv.join(" "));
  }
  assert.equal(seen.length, 0);
});

test("token og spørring: client_credentials, POST mot query, og ingen hemmelighet i utskriften", async () => {
  const { seen, fetchImpl } = fake(() => new Response(JSON.stringify({ hasMore: false, results: [{ type: "Journalpost", id: "123", fields: { tittel: "Søknad", ekko: SECRET } }] }), { headers: { "content-type": "application/json" } }));
  const c = capture();
  assert.equal(await run(["journalpost", "123"], { config, fetchImpl, hemmelighet, ...c }), 0);
  assert.equal(seen[0].url, "https://idp.test.example/token");
  const form = new URLSearchParams(seen[0].init.body.toString());
  assert.equal(form.get("grant_type"), "client_credentials");
  assert.equal(form.get("client_secret"), SECRET);
  assert.equal(seen[1].url, `https://arkiv.test.example:8083${QUERY_PATH}`);
  assert.equal(seen[1].init.method, "POST");
  assert.equal(seen[1].init.headers.authorization, "Bearer tok-abcdefghijkl");
  const all = [...c.lines.out, ...c.lines.err].join("\n");
  assert.match(all, /→ 200/);
  assert.doesNotMatch(all, new RegExp(SECRET));
  assert.doesNotMatch(all, /tok-abcdefghijkl/);
});

test("ikke-2xx gir exit 1, og en hemmelighet som ikke kan hentes, sies med referansen", async () => {
  const { fetchImpl } = fake(() => new Response(JSON.stringify({ message: "No service was found" }), { status: 404, headers: { "content-type": "application/json" } }));
  let c = capture();
  assert.equal(await run(["mappe", "1"], { config, fetchImpl, hemmelighet, ...c }), 1);
  assert.match(c.lines.out.join("\n"), /→ 404/);
  c = capture();
  const nei = (r) => {
    throw new Error(`Fikk ikke hentet ${r.sted} fra hvelvet (${r.kilde}): ERROR: Please run 'az login'`);
  };
  assert.equal(await run(["token"], { config, fetchImpl, hemmelighet: nei, ...c }), 1);
  assert.match(c.lines.err.join("\n"), /client-secret fra hvelvet \(azure-keyvault:kv-kunde\/documaster-client-secret\)/);
});

test("et HTML-svar med 200 er en feil: apiUrl peker på nettsiden", async () => {
  const { fetchImpl } = fake(() => new Response("<!doctype html><html></html>", { headers: { "content-type": "text/html" } }));
  const c = capture();
  assert.equal(await run(["arkivdeler"], { config, fetchImpl, hemmelighet, ...c }), 1);
  assert.match(c.lines.err.join("\n"), /HTML/);
});

test("et avslått token gir exit 1 uten hemmeligheten", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ error: "invalid_client", error_description: `bad ${SECRET}` }), { status: 401, headers: { "content-type": "application/json" } });
  const c = capture();
  assert.equal(await run(["token"], { config, fetchImpl, hemmelighet, ...c }), 1);
  assert.match(c.lines.err.join("\n"), /401 invalid_client/);
  assert.doesNotMatch(c.lines.err.join("\n"), new RegExp(SECRET));
});
