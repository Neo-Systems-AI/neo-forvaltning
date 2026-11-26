import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { gyldigFnr } from "./lib/fnr.mjs";
import { main } from "./krr.mjs";

// Oppdiktede numre: det første får gyldige kontrollsifre regnet ut her, det andre har feil kontrollsifre.
const lagGyldig = (start) => {
  for (let i = 0; i < 1000; i++) for (let k = 0; k < 100; k++) {
    const full = `${start}${String(i).padStart(3, "0")}${String(k).padStart(2, "0")}`;
    if (gyldigFnr(full)) return full;
  }
};
const OPPDIKTET = lagGyldig("010100");
const UGYLDIG = "12345678901";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" });
const data = { version: 2, hvelv: "kv-kunde", krr: { miljo: "test", klient: "krr" }, maskinporten: { miljo: "test", klienter: { krr: { clientId: "klient-test", scopes: ["krr:global/kontaktinformasjon.read"] } } } };
const config = { data };
const hemmelighet = () => PEM;

const TOKEN = "tok-som-er-hemmelig-12345"; // gitleaks:allow (oppdiktet token i testen)
const fake = (svar, status = 200) => {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push({ url, init });
    if (url.endsWith("oauth-authorization-server")) return new Response(JSON.stringify({ issuer: "https://test.maskinporten.no/", token_endpoint: "https://test.maskinporten.no/token" }));
    if (url.endsWith("/token")) return new Response(JSON.stringify({ access_token: TOKEN, expires_in: 120, scope: "krr:global/kontaktinformasjon.read" }));
    return new Response(typeof svar === "string" ? svar : JSON.stringify(svar), { status, headers: { "content-type": "application/json" } });
  };
  return { fetchImpl, seen };
};
const capture = () => {
  const lines = [];
  return { out: (l) => lines.push(l), err: (l) => lines.push(l), text: () => lines.join("\n") };
};

test("oppslaget sender numrene til v1 med tokenet, og skriver ut svaret maskert og uten tokenet eller nøkkelen", async () => {
  const { fetchImpl, seen } = fake({
    personer: [
      { personidentifikator: OPPDIKTET, status: "AKTIV", reservasjon: "NEI", varslingsstatus: "KAN_VARSLES", kontaktinformasjon: { epostadresse: "ola@example.com", mobiltelefonnummer: "+4799999999" } },
      { personidentifikator: UGYLDIG, status: "IKKE_REGISTRERT" },
    ],
  });
  const c = capture();
  assert.equal(await main(["person", OPPDIKTET, UGYLDIG], { fetchImpl, config, hemmelighet, ...c }), 0);
  const krr = seen.at(-1);
  assert.equal(krr.url, "https://test.kontaktregisteret.no/rest/v1/personer");
  assert.equal(krr.init.headers.authorization, `Bearer ${TOKEN}`);
  assert.deepEqual(JSON.parse(krr.init.body), { personidentifikatorer: [OPPDIKTET, UGYLDIG] });
  const text = c.text();
  assert.match(text, /Miljø: test .*klient: krr/);
  assert.match(text, /POST https:\/\/test\.kontaktregisteret\.no\/rest\/v1\/personer → 200/);
  assert.match(text, /AKTIV {2}reservasjon=NEI {2}KAN_VARSLES {2}ola@example\.com/);
  assert.match(text, /MERK: 123456\*\*\*\*\* har ugyldige kontrollsifre/);
  assert.ok(!text.includes(OPPDIKTET) && !text.includes(UGYLDIG), "personnummeret skal ikke ut, heller ikke med feil kontrollsifre");
  assert.ok(!text.includes(TOKEN) && !text.includes("BEGIN PRIVATE KEY"));
});

test("v2 og et nummer som mangler i svaret", async () => {
  const c = capture();
  assert.equal(await main(["person", OPPDIKTET, "--v2"], { fetchImpl: fake({ personer: [] }).fetchImpl, config, hemmelighet, ...c }), 0);
  assert.match(c.text(), /rest\/v2\/personer/);
  assert.match(c.text(), /Ikke i v2-svaret.*010100\*\*\*\*\*/);
  const c1 = capture();
  assert.equal(await main(["person", OPPDIKTET], { fetchImpl: fake({ personer: [] }).fetchImpl, config, hemmelighet, ...c1 }), 1);
  assert.match(c1.text(), /svarte uten rad for 010100\*\*\*\*\*/);
});

test("et svar som ikke er 2xx, gir exit 1 og svaret maskert", async () => {
  const c = capture();
  assert.equal(await main(["person", OPPDIKTET, "--v2"], { fetchImpl: fake({ feil: `ugyldig personidentifikator ${OPPDIKTET}` }, 400).fetchImpl, config, hemmelighet, ...c }), 1);
  assert.match(c.text(), /→ 400/);
  assert.ok(!c.text().includes(OPPDIKTET));
});

test("feil før kallet: ikke 11 sifre, ingen klient, klienten i et annet miljø, og ingen numre", async () => {
  const c = capture();
  assert.equal(await main(["person", "123"], { config, ...c }), 2);
  assert.match(c.text(), /11 sifre/);
  const c2 = capture();
  assert.equal(await main(["person", OPPDIKTET], { config: { data: { ...data, krr: { miljo: "test" } } }, ...c2 }), 1);
  assert.match(c2.text(), /krr.klient mangler/);
  const c3 = capture();
  assert.equal(await main(["person", OPPDIKTET], { config: { data: { ...data, krr: { miljo: "produksjon", klient: "krr" } } }, hemmelighet, fetchImpl: fake({}).fetchImpl, ...c3 }), 1);
  assert.match(c3.text(), /er for test, men kallet går mot produksjon/);
  const c4 = capture();
  assert.equal(await main(["person"], { config, ...c4 }), 2);
});
