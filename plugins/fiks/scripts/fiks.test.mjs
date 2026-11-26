import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gyldigFnr } from "./lib/fnr.mjs";
import { COMMANDS, main } from "./fiks.mjs";

// Alt her er oppdiktet: id-ene, passordene og fødselsnummeret (med gyldige kontrollsifre, regnet ut her).
const FNR = (() => {
  for (let i = 0; i < 100000; i++) if (gyldigFnr(`12345${String(i).padStart(6, "0")}`)) return `12345${String(i).padStart(6, "0")}`;
})();
const PASSORD = { "integrasjon-passord": "integrasjon-hemmelig-1", "svarinn-passord": "svarinn-hemmelig-2" };
const TOKEN = "eyJ.token-hemmelig-3.sig";
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" });

const data = {
  version: 2,
  fiks: { miljo: "test", klient: "fiks", integrasjon: "integrasjon-1", svarutKonto: "konto-1", svarinnMottakersystem: "mottaker-1", folkeregisterRolle: "rolle-1" },
  maskinporten: { miljo: "test", klienter: { fiks: { clientId: "klient-1" } } },
};
const root = mkdtempSync(join(tmpdir(), "fiks-"));
for (const [d, t] of [["fiks", "integrasjon-passord: { kilde: azure-keyvault:hvelv/integrasjon }\nsvarinn-passord: { kilde: azure-keyvault:hvelv/svarinn }\n"], ["maskinporten", "fiks-nokkel: { kilde: azure-keyvault:hvelv/nokkel, fil: true }\n"]]) {
  mkdirSync(join(root, "integrasjoner", d), { recursive: true });
  writeFileSync(join(root, "integrasjoner", d, "hemmeligheter.yaml"), t);
}
const hemmelighet = (r) => ({ "azure-keyvault:hvelv/integrasjon": PASSORD["integrasjon-passord"], "azure-keyvault:hvelv/svarinn": PASSORD["svarinn-passord"], "azure-keyvault:hvelv/nokkel": PEM })[r.kilde];

// Maskinporten og Fiks uten nettverk. Svaret fra Fiks gjentar hemmelighetene kallet brukte, og fødselsnummeret, så
// sladdingen prøves. Bare det kallet hentet fra hvelvet, kjenner skriptet, og bare det kan sladdes.
function fake({ status = 200, body } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, method: init.method ?? "GET", headers: init.headers ?? {}, body: init.body });
    if (url.endsWith("/.well-known/oauth-authorization-server")) return new Response(JSON.stringify({ issuer: "https://test.maskinporten.no/", token_endpoint: "https://test.maskinporten.no/token" }));
    if (url === "https://test.maskinporten.no/token") return new Response(JSON.stringify({ access_token: TOKEN, expires_in: 120, scope: "ks:fiks" }));
    const echo = body ?? { fnr: FNR, ekko: `${PASSORD["integrasjon-passord"]} ${TOKEN}` };
    return new Response(JSON.stringify(echo), { status, headers: { "content-type": "application/json" } });
  };
  return { calls, fetchImpl, last: () => calls.at(-1) };
}

async function exec(argv, f, cfg = data, h = hemmelighet) {
  const lines = [];
  const code = await main(argv, { config: { data: cfg, root }, fetchImpl: f.fetchImpl, hemmelighet: h, out: (s) => lines.push(s), err: (s) => lines.push(s) });
  return { code, text: lines.join("\n") };
}

const NO_LEAK = (text) => {
  for (const s of [...Object.values(PASSORD), TOKEN, FNR, "BEGIN PRIVATE KEY", "MII"]) assert.ok(!text.includes(s), `«${s}» kom ut`);
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
    const f = fake();
    const { code, text } = await exec(argv, f);
    assert.equal(code, 0, text);
    const c = f.last();
    assert.equal(c.method, method);
    assert.equal(c.url, url);
    assert.equal(c.headers.authorization, `Bearer ${TOKEN}`);
    assert.equal(c.headers.IntegrasjonId, "integrasjon-1");
    assert.equal(c.headers.IntegrasjonPassord, PASSORD["integrasjon-passord"]);
    assert.match(f.calls[1].body.toString(), /grant_type=urn/);
    assert.match(text, /^Miljø: test/);
    NO_LEAK(text);
  });
}

test("svarut status sender id-ene i et søk, ikke noe annet", async () => {
  const f = fake();
  await exec(["svarut", "status", "aaaa-1", "bbbb-2"], f);
  assert.deepEqual(JSON.parse(f.last().body), { id: ["aaaa-1", "bbbb-2"] });
  assert.equal(f.last().headers["content-type"], "application/json");
});

test("svarinn liste: Basic med mottakersystemet, uten Maskinporten og uten integrasjonen", async () => {
  const f = fake({ body: [{ id: "f-1", avsender: FNR, ekko: PASSORD["svarinn-passord"] }] });
  const { code, text } = await exec(["svarinn", "liste"], f);
  assert.equal(code, 0, text);
  assert.equal(f.calls.length, 1);
  const c = f.last();
  assert.equal(c.url, "https://test.svarut.ks.no/api/svarinn/v2/forsendelser");
  assert.equal(c.headers.authorization, `Basic ${Buffer.from(`mottaker-1:${PASSORD["svarinn-passord"]}`).toString("base64")}`);
  assert.equal(c.headers.IntegrasjonId, undefined);
  NO_LEAK(text);
});

test("ingen kommando sender, kvitterer eller endrer: bare GET, og POST bare for status-søket", () => {
  assert.deepEqual(Object.keys(COMMANDS).sort(), ["folkeregister hendelser", "folkeregister person", "svarinn liste", "svarut forsendelsestyper", "svarut hendelser", "svarut mottakersystem", "svarut status"]);
});

test("et svar som ikke er 2xx gir exit 1 og forklaringen på 401, fortsatt sladdet", async () => {
  const { code, text } = await exec(["svarut", "forsendelsestyper"], fake({ status: 401 }));
  assert.equal(code, 1);
  assert.match(text, /→ 401/);
  assert.match(text, /autoriserte organisasjon/);
  NO_LEAK(text);
});

test("en hemmelighet som ikke kan hentes, sier referansen, og intet kall går", async () => {
  const f = fake();
  const nei = (r) => {
    throw new Error(`Fikk ikke hentet ${r.sted} fra hvelvet (${r.kilde}): ERROR: Please run 'az login'`);
  };
  const { code, text } = await exec(["svarinn", "liste"], f, data, nei);
  assert.equal(code, 1);
  assert.match(text, /integrasjoner\/fiks\/hemmeligheter.yaml#svarinn-passord fra hvelvet \(azure-keyvault:hvelv\/svarinn\)/);
  assert.equal(f.calls.length, 0);
});

test("en verdi som mangler i config-fila, sier stien", async () => {
  const cfg = structuredClone(data);
  delete cfg.fiks.svarutKonto;
  const { code, text } = await exec(["svarut", "status", "aaaa-1"], fake(), cfg);
  assert.equal(code, 1);
  assert.match(text, /fiks\.svarutKonto mangler i \.claude\/neo\.config\.json/);
});

test("feil bruk gir exit 2 uten kall: ukjent kommando, ugyldig fødselsnummer og orgnr, og --miljo", async () => {
  for (const argv of [["svarinn", "kvitter", "x"], ["folkeregister", "person", "123"], ["svarut", "mottakersystem", "12"], ["svarut", "hendelser", "../konto"], ["--miljo", "produksjon", "svarinn", "liste"]]) {
    const f = fake();
    assert.equal((await exec(argv, f)).code, 2, argv.join(" "));
    assert.equal(f.calls.length, 0);
  }
});
