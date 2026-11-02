import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { COMMANDS, maskFnr, run } from "./fiks.mjs";

// Alt her er oppdiktet: id-ene, passordene og fødselsnummeret.
const FNR = "12345612345";
const PASSORD = { FIKS_TEST_INTEGRASJON_PASSORD: "integrasjon-hemmelig-1", FIKS_TEST_SVARINN_PASSORD: "svarinn-hemmelig-2" };
const TOKEN = "eyJ.token-hemmelig-3.sig";

const config = {
  version: 1,
  fiks: {
    environments: ["test", "produksjon"],
    byEnv: {
      test: {
        maskinporten: { klientId: "klient-1", nokkel: { $env: "FIKS_TEST_NOKKEL", kilde: "azure-keyvault:hvelv/nokkel", fil: true } },
        integrasjon: { id: "integrasjon-1", passord: { $env: "FIKS_TEST_INTEGRASJON_PASSORD", kilde: "azure-keyvault:hvelv/integrasjon" } },
        svarut: { kontoId: "konto-1" },
        svarinn: { mottakersystemId: "mottaker-1", passord: { $env: "FIKS_TEST_SVARINN_PASSORD", kilde: "azure-keyvault:hvelv/svarinn" } },
        folkeregister: { rolleId: "rolle-1" },
      },
      produksjon: {},
    },
  },
};

function repo(cfg = config) {
  const root = mkdtempSync(join(tmpdir(), "fiks-"));
  mkdirSync(join(root, ".claude"));
  mkdirSync(join(root, ".keys"));
  writeFileSync(join(root, ".claude", "neo.config.json"), JSON.stringify(cfg));
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  writeFileSync(join(root, ".keys", "fiks.pem"), privateKey.export({ type: "pkcs8", format: "pem" }));
  process.env.NEO_CONFIG = join(root, ".claude", "neo.config.json");
  return root;
}

// Maskinporten og Fiks uten nettverk. Svaret fra Fiks gjentar hemmelighetene og fødselsnummeret, så sladdingen prøves.
function fake({ status = 200, body } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, method: init.method ?? "GET", headers: init.headers ?? {}, body: init.body });
    if (url.endsWith("/.well-known/oauth-authorization-server")) return new Response(JSON.stringify({ issuer: "https://test.maskinporten.no/", token_endpoint: "https://test.maskinporten.no/token" }));
    if (url === "https://test.maskinporten.no/token") return new Response(JSON.stringify({ access_token: TOKEN, expires_in: 120, scope: "ks:fiks" }));
    const echo = body ?? { fnr: FNR, ekko: `${PASSORD.FIKS_TEST_INTEGRASJON_PASSORD} ${PASSORD.FIKS_TEST_SVARINN_PASSORD} ${TOKEN}` };
    return new Response(JSON.stringify(echo), { status, headers: { "content-type": "application/json" } });
  };
  return { calls, fetchImpl, last: () => calls.at(-1) };
}

async function exec(argv, f, root) {
  const lines = [];
  const code = await run(argv, { cwd: root, fetchImpl: f.fetchImpl, out: (s) => lines.push(s), err: (s) => lines.push(s) });
  return { code, text: lines.join("\n") };
}

beforeEach(() => {
  Object.assign(process.env, PASSORD, { FIKS_TEST_NOKKEL: ".keys/fiks.pem" });
});

const NO_LEAK = (text) => {
  for (const s of [...Object.values(PASSORD), TOKEN, FNR]) assert.ok(!text.includes(s), `«${s}» kom ut`);
};

const cases = [
  [["svarut", "forsendelsestyper"], "GET", "https://test.svarut.ks.no/api/v2/forsendelsestyper"],
  [["svarut", "mottakersystem", "999999999", "--forsendelsestype", "Byggesak"], "GET", "https://test.svarut.ks.no/api/v2/mottakersystem?organisasjonsnummer=999999999&forsendelseType=Byggesak"],
  [["svarut", "status", "aaaa-1", "bbbb-2"], "POST", "https://test.svarut.ks.no/api/v3/kontoer/konto-1/forsendelser/status/sok"],
  [["svarut", "hendelser", "aaaa-1"], "GET", "https://test.svarut.ks.no/api/v2/forsendelser/aaaa-1/hendelser"],
  [["folkeregister", "person", FNR, "--part", "navn,bostedsadresse"], "GET", `https://api.fiks.test.ks.no/folkeregister/api/v1/rolle-1/v1/personer/${FNR}?part=navn&part=bostedsadresse`],
  [["folkeregister", "hendelser", "--seq", "42"], "GET", "https://api.fiks.test.ks.no/folkeregister/api/v1/rolle-1/v1/hendelser/feed?seq=42"],
];

for (const [argv, method, url] of cases) {
  test(`${argv.slice(0, 2).join(" ")}: ${method} med token og integrasjonen, og ingenting hemmelig ut`, async () => {
    const root = repo();
    const f = fake();
    const { code, text } = await exec(argv, f, root);
    assert.equal(code, 0, text);
    const c = f.last();
    assert.equal(c.method, method);
    assert.equal(c.url, url);
    assert.equal(c.headers.authorization, `Bearer ${TOKEN}`);
    assert.equal(c.headers.IntegrasjonId, "integrasjon-1");
    assert.equal(c.headers.IntegrasjonPassord, PASSORD.FIKS_TEST_INTEGRASJON_PASSORD);
    assert.equal(f.calls[1].url, "https://test.maskinporten.no/token");
    assert.match(f.calls[1].body.toString(), /grant_type=urn/);
    assert.match(text, /^Miljø: test/);
    NO_LEAK(text);
  });
}

test("svarut status sender id-ene i et søk, ikke noe annet", async () => {
  const f = fake();
  await exec(["svarut", "status", "aaaa-1", "bbbb-2"], f, repo());
  assert.deepEqual(JSON.parse(f.last().body), { id: ["aaaa-1", "bbbb-2"] });
  assert.equal(f.last().headers["content-type"], "application/json");
});

test("svarinn liste: Basic med mottakersystemet, uten Maskinporten og uten integrasjonen", async () => {
  // Uten Maskinporten finnes det ikke noe token å sladde; svaret gjentar passordet og fødselsnummeret.
  const f = fake({ body: [{ id: "f-1", avsender: FNR, ekko: PASSORD.FIKS_TEST_SVARINN_PASSORD }] });
  const { code, text } = await exec(["svarinn", "liste"], f, repo());
  assert.equal(code, 0, text);
  assert.equal(f.calls.length, 1);
  const c = f.last();
  assert.equal(c.url, "https://test.svarut.ks.no/api/svarinn/v2/forsendelser");
  assert.equal(c.method, "GET");
  assert.equal(c.headers.authorization, `Basic ${Buffer.from(`mottaker-1:${PASSORD.FIKS_TEST_SVARINN_PASSORD}`).toString("base64")}`);
  assert.equal(c.headers.IntegrasjonId, undefined);
  NO_LEAK(text);
  assert.ok(!text.includes(c.headers.authorization.slice(6)));
});

test("ingen kommando sender, kvitterer eller endrer: bare GET, og POST bare for status-søket", () => {
  assert.deepEqual(Object.keys(COMMANDS).sort(), ["folkeregister hendelser", "folkeregister person", "svarinn liste", "svarut forsendelsestyper", "svarut hendelser", "svarut mottakersystem", "svarut status"]);
});

test("--miljo produksjon går mot produksjonsvertene, og et ukjent miljø stopper", async () => {
  const cfg = structuredClone(config);
  cfg.fiks.byEnv.produksjon = structuredClone(cfg.fiks.byEnv.test);
  const f = fake();
  const root = repo(cfg);
  const { code, text } = await exec(["--miljo", "produksjon", "svarinn", "liste"], f, root);
  assert.equal(code, 0, text);
  assert.equal(f.last().url, "https://svarut.ks.no/api/svarinn/v2/forsendelser");
  assert.match(text, /^Miljø: produksjon/);
  const bad = await exec(["--miljo", "tt02", "svarinn", "liste"], fake(), root);
  assert.equal(bad.code, 2);
  assert.match(bad.text, /«tt02» er ikke et miljø/);
});

test("et svar som ikke er 2xx gir exit 1 og forklaringen på 401, fortsatt sladdet", async () => {
  const { code, text } = await exec(["svarut", "forsendelsestyper"], fake({ status: 401 }), repo());
  assert.equal(code, 1);
  assert.match(text, /→ 401/);
  assert.match(text, /autoriserte organisasjon/);
  NO_LEAK(text);
  const svarinn = await exec(["svarinn", "liste"], fake({ status: 500, body: { feil: "x" } }), repo());
  assert.equal(svarinn.code, 1);
});

test("en manglende hemmelighet sier navnet og kilden, og intet kall går", async () => {
  const root = repo();
  delete process.env.FIKS_TEST_SVARINN_PASSORD;
  const f = fake();
  const { code, text } = await exec(["svarinn", "liste"], f, root);
  assert.equal(code, 1);
  assert.match(text, /FIKS_TEST_SVARINN_PASSORD/);
  assert.match(text, /azure-keyvault:hvelv\/svarinn/);
  assert.equal(f.calls.length, 0);
});

test("en manglende verdi i config-fila sier stien", async () => {
  const cfg = structuredClone(config);
  delete cfg.fiks.byEnv.test.svarut.kontoId;
  const { code, text } = await exec(["svarut", "status", "aaaa-1"], fake(), repo(cfg));
  assert.equal(code, 2);
  assert.match(text, /fiks\.byEnv\.test\.svarut\.kontoId mangler/);
});

test("feil bruk gir exit 2: ukjent kommando, ugyldig fødselsnummer og orgnr", async () => {
  const root = repo();
  assert.equal((await exec(["svarinn", "kvitter", "x"], fake(), root)).code, 2);
  assert.equal((await exec(["folkeregister", "person", "123"], fake(), root)).code, 2);
  assert.equal((await exec(["svarut", "mottakersystem", "12"], fake(), root)).code, 2);
  assert.equal((await exec(["svarut", "hendelser", "../konto"], fake(), root)).code, 2);
});

test("fødselsnummer maskeres, andre tall står", () => {
  assert.equal(maskFnr(`/personer/${FNR}?x`), "/personer/123456*****?x");
  assert.equal(maskFnr('{"id":"12345612345"}'), '{"id":"123456*****"}');
  assert.equal(maskFnr("999999999 1700000000000"), "999999999 1700000000000");
});
