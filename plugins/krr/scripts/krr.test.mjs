import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { gyldigeKontrollsifre, klient, main, maskFnr } from "./krr.mjs";

// Oppdiktede numre: det første får gyldige kontrollsifre regnet ut her, det andre har feil kontrollsifre.
const lagGyldig = (start) => {
  for (let i = 0; i < 1000; i++) {
    const id = `${start}${String(i).padStart(3, "0")}`;
    for (let k = 0; k < 100; k++) {
      const full = `${id}${String(k).padStart(2, "0")}`;
      if (gyldigeKontrollsifre(full)) return full;
    }
  }
  throw new Error("fant ikke");
};
const OPPDIKTET = lagGyldig("010100");
const UGYLDIG = "12345678901";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
process.env.NEO_TEST_KRR_PEM = privateKey.export({ type: "pkcs8", format: "pem" });

const data = {
  version: 1,
  krr: { environments: ["test", "produksjon"], defaultEnv: "test" },
  maskinporten: {
    environments: ["test", "produksjon"],
    byEnv: {
      test: {
        clientId: "klient-test",
        nokkel: { $env: "NEO_TEST_KRR_PEM", kilde: "azure-keyvault:kv-kunde/krr" },
        klienter: { krr: {}, annen: { scopes: ["annet:scope"] } },
      },
    },
  },
};

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

test("kontrollsifrene og maskeringen", () => {
  assert.equal(gyldigeKontrollsifre(OPPDIKTET), true);
  assert.equal(gyldigeKontrollsifre(UGYLDIG), false);
  assert.equal(maskFnr(`nr ${UGYLDIG} og ${OPPDIKTET}`), `nr 123456***** og ${OPPDIKTET.slice(0, 6)}*****`);
  assert.equal(maskFnr("12 ms, 1730000000000, 99999999"), "12 ms, 1730000000000, 99999999");
});

test("klienten hentes fra maskinporten-delen, med KRR-scopet når klienten ikke har egne", () => {
  assert.deepEqual(klient(data, "test", "krr").scopes, ["krr:global/kontaktinformasjon.read"]);
  assert.deepEqual(klient(data, "test", "annen").scopes, ["annet:scope"]);
  assert.throws(() => klient(data, "produksjon", "krr"), /står ikke under maskinporten\.byEnv\.produksjon\.klienter/);
});

test("oppslaget sender numrene til v1 med tokenet, og skriver ut svaret maskert og uten tokenet", async () => {
  const { fetchImpl, seen } = fake({
    personer: [
      { personidentifikator: OPPDIKTET, status: "AKTIV", reservasjon: "NEI", varslingsstatus: "KAN_VARSLES", kontaktinformasjon: { epostadresse: "ola@example.com", mobiltelefonnummer: "+4799999999" } },
      { personidentifikator: UGYLDIG, status: "IKKE_REGISTRERT" },
    ],
  });
  const c = capture();
  const code = await main(["person", OPPDIKTET, UGYLDIG], { fetchImpl, config: { data, root: "/" }, ...c });
  assert.equal(code, 0);
  const krr = seen.at(-1);
  assert.equal(krr.url, "https://test.kontaktregisteret.no/rest/v1/personer");
  assert.equal(krr.init.headers.authorization, `Bearer ${TOKEN}`);
  assert.deepEqual(JSON.parse(krr.init.body), { personidentifikatorer: [OPPDIKTET, UGYLDIG] });
  const text = c.text();
  assert.match(text, /Miljø: test/);
  assert.match(text, /POST https:\/\/test\.kontaktregisteret\.no\/rest\/v1\/personer → 200/);
  assert.match(text, /AKTIV {2}reservasjon=NEI {2}KAN_VARSLES {2}ola@example\.com/);
  assert.match(text, /MERK: 123456\*\*\*\*\* har ugyldige kontrollsifre/);
  assert.ok(!text.includes(OPPDIKTET) && !text.includes(UGYLDIG), "personnummeret skal ikke ut");
  assert.ok(!text.includes(TOKEN), "tokenet skal ikke ut");
  assert.ok(!text.includes("BEGIN PRIVATE KEY"));
});

test("v2 og et nummer som mangler i svaret", async () => {
  const c = capture();
  assert.equal(await main(["person", OPPDIKTET, "--v2"], { fetchImpl: fake({ personer: [] }).fetchImpl, config: { data, root: "/" }, ...c }), 0);
  assert.match(c.text(), /rest\/v2\/personer/);
  assert.match(c.text(), /Ikke i v2-svaret.*010100\*\*\*\*\*/);
  const c1 = capture();
  assert.equal(await main(["person", OPPDIKTET], { fetchImpl: fake({ personer: [] }).fetchImpl, config: { data, root: "/" }, ...c1 }), 1);
  assert.match(c1.text(), /svarte uten rad for 010100\*\*\*\*\*/);
});

test("et svar som ikke er 2xx, gir exit 1 og svaret maskert", async () => {
  const c = capture();
  const code = await main(["person", OPPDIKTET, "--v2"], { fetchImpl: fake({ feil: `ugyldig personidentifikator ${OPPDIKTET}` }, 400).fetchImpl, config: { data, root: "/" }, ...c });
  assert.equal(code, 1);
  assert.match(c.text(), /→ 400/);
  assert.ok(!c.text().includes(OPPDIKTET));
});

test("feil før kallet: ikke 11 sifre, ukjent miljø, manglende nøkkel og ingen numre", async () => {
  const c = capture();
  assert.equal(await main(["person", "123"], { config: { data, root: "/" }, ...c }), 1);
  assert.match(c.text(), /11 sifre/);
  const c2 = capture();
  assert.equal(await main(["person", OPPDIKTET, "--miljo", "prod"], { config: { data, root: "/" }, ...c2 }), 1);
  assert.match(c2.text(), /ikke et miljø/);
  const c3 = capture();
  const d = structuredClone(data);
  d.maskinporten.byEnv.test.nokkel = { $env: "NEO_TEST_KRR_MANGLER", kilde: "azure-keyvault:kv-kunde/krr" };
  assert.equal(await main(["person", OPPDIKTET], { fetchImpl: fake({}).fetchImpl, config: { data: d, root: "/" }, ...c3 }), 1);
  assert.match(c3.text(), /NEO_TEST_KRR_MANGLER er ikke satt/);
  const c4 = capture();
  assert.equal(await main(["person"], { config: { data, root: "/" }, ...c4 }), 2);
});
