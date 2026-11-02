import { test } from "node:test";
import assert from "node:assert/strict";
import { isFnr, mask } from "./mask.mjs";

// Et oppdiktet nummer med gyldige kontrollsifre, regnet ut her, så testen ikke har et ekte fødselsnummer.
const fake = (nine) => {
  const d = [...nine].map(Number);
  const c = (w, xs) => {
    const r = 11 - (w.reduce((s, x, i) => s + x * xs[i], 0) % 11);
    return r === 11 ? 0 : r;
  };
  for (let i = 0; i < 1000; i++) {
    const base = [...d.slice(0, 6), ...String(100 + i).slice(-3)].map(Number);
    const k1 = c([3, 7, 6, 1, 8, 9, 4, 5, 2], base);
    const k2 = c([5, 4, 3, 2, 7, 6, 5, 4, 3, 2], [...base, k1]);
    if (k1 < 10 && k2 < 10) return [...base, k1, k2].join("");
  }
};

test("fødselsnummer med gyldige kontrollsifre maskeres; andre 11 sifre står", () => {
  const fnr = fake("010199000");
  assert.ok(isFnr(fnr));
  assert.equal(mask(`Søker ${fnr}, sak 12345678901`), `Søker ${fnr.slice(0, 6)}*****, sak 12345678901`);
});

test("e-post og telefon maskeres", () => {
  assert.equal(mask("kari.nordmann@example.no"), "k***@example.no");
  assert.equal(mask("tlf 912 34 567"), "tlf *** ** *67");
  assert.equal(mask("+47 41234567"), "+47 ******67");
});
