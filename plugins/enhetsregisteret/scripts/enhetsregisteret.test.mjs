import { test } from "node:test";
import assert from "node:assert/strict";
import { adresse, gyldigOrgnr, main, velgMiljo } from "./enhetsregisteret.mjs";

// Oppdiktede numre: 999999999 har gyldig kontrollsiffer, 123456789 har det ikke.
const ORGNR = "999999999";
const data = { version: 1, enhetsregisteret: { environments: ["produksjon"], orgnr: ORGNR } };

const fake = (body, status = 200) => {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push({ url, init });
    return new Response(body === undefined ? "" : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
  return { fetchImpl, seen };
};
const capture = () => {
  const lines = [];
  return { out: (l) => lines.push(l), err: (l) => lines.push(l), text: () => lines.join("\n") };
};

test("kontrollsifferet, miljøet og adressene", () => {
  assert.equal(gyldigOrgnr(ORGNR), true);
  assert.equal(gyldigOrgnr("123456789"), false);
  assert.equal(gyldigOrgnr("12345"), false);
  assert.equal(velgMiljo(null), "produksjon");
  assert.equal(velgMiljo(data), "produksjon");
  assert.throws(() => velgMiljo(data, "test"), /ikke et miljø/);
  assert.equal(velgMiljo({ enhetsregisteret: { environments: ["produksjon", "test"] } }, "test"), "test");
  assert.equal(adresse("produksjon", "enhet", ORGNR), "https://data.brreg.no/enhetsregisteret/api/enheter/999999999");
  assert.equal(adresse("produksjon", "underenhet", ORGNR), "https://data.brreg.no/enhetsregisteret/api/underenheter/999999999");
  assert.equal(adresse("test", "underenheter", ORGNR, { side: "1", antall: "50" }), "https://data.ppe.brreg.no/enhetsregisteret/api/underenheter?overordnetEnhet=999999999&page=1&size=50");
});

test("enhet: svaret som det er, og én linje med det viktigste", async () => {
  const { fetchImpl, seen } = fake({ organisasjonsnummer: ORGNR, navn: "OPPDIKTET KOMMUNE", organisasjonsform: { kode: "KOMM" }, forretningsadresse: { kommunenummer: "9999", kommune: "OPPDIKTET" } });
  const c = capture();
  assert.equal(await main(["enhet", ORGNR], { fetchImpl, config: { data }, ...c }), 0);
  assert.equal(seen[0].init.headers.accept, "application/json");
  assert.equal(seen[0].init.method, "GET");
  assert.match(c.text(), /Miljø: produksjon \(https:\/\/data\.brreg\.no\)/);
  assert.match(c.text(), /GET https:\/\/data\.brreg\.no\/enhetsregisteret\/api\/enheter\/999999999 → 200/);
  assert.match(c.text(), /999999999 {2}OPPDIKTET KOMMUNE {2}KOMM {2}9999 OPPDIKTET/);
});

test("uten orgnr brukes enhetsregisteret.orgnr, og underenhetene listes med sidetall", async () => {
  const { fetchImpl, seen } = fake({
    _embedded: { underenheter: [{ organisasjonsnummer: "888888888", navn: "OPPDIKTET SKOLE", organisasjonsform: { kode: "ORGL" }, overordnetEnhet: ORGNR, slettedato: "2025-01-01" }] },
    page: { number: 0, size: 20, totalElements: 1, totalPages: 1 },
  });
  const c = capture();
  assert.equal(await main(["underenheter"], { fetchImpl, config: { data }, ...c }), 0);
  assert.match(seen[0].url, /underenheter\?overordnetEnhet=999999999$/);
  assert.match(c.text(), /orgnr fra enhetsregisteret\.orgnr/);
  assert.match(c.text(), /OPPDIKTET SKOLE {2}ORGL {2}- {2}under 999999999 {2}slettet 2025-01-01/);
  assert.match(c.text(), /side 1 av 1, 1 i alt/);
});

test("404 og 400 gir exit 1 med svaret fra registeret", async () => {
  const c = capture();
  assert.equal(await main(["enhet", "123456789"], { fetchImpl: fake(undefined, 404).fetchImpl, config: { data }, ...c }), 1);
  assert.match(c.text(), /→ 404/);
  assert.match(c.text(), /MERK: 123456789 har ugyldig kontrollsiffer/);
  assert.match(c.text(), /finnes ikke som enhet \(prøv underenhet\)/);
  const c2 = capture();
  assert.equal(await main(["underenhet", ORGNR], { fetchImpl: fake({ status: 400, feilmelding: "Feilaktig forespørsel" }, 400).fetchImpl, config: { data }, ...c2 }), 1);
  assert.match(c2.text(), /→ 400[\s\S]*Feilaktig forespørsel/);
});

test("feil før kallet: ikke 9 sifre, intet orgnr, ugyldig side og ukjent kommando", async () => {
  const c = capture();
  assert.equal(await main(["enhet", "12345"], { config: { data }, ...c }), 1);
  assert.match(c.text(), /9 sifre/);
  const c2 = capture();
  assert.equal(await main(["underenhet"], { config: { data }, ...c2 }), 1);
  assert.match(c2.text(), /Mangler organisasjonsnummer/);
  const c3 = capture();
  assert.equal(await main(["underenheter", "--side", "x"], { config: { data }, ...c3 }), 1);
  const c4 = capture();
  assert.equal(await main(["slett", ORGNR], { config: { data }, ...c4 }), 2);
});
