import { test } from "node:test";
import assert from "node:assert/strict";
import { gyldigFnr } from "./lib/fnr.mjs";
import { mask } from "./mask.mjs";

// Et oppdiktet nummer med gyldige kontrollsifre, regnet ut her, så testen ikke har et ekte fødselsnummer.
const fnr = (() => {
  for (let i = 0; i < 100000; i++) if (gyldigFnr(`010199${String(i).padStart(5, "0")}`)) return `010199${String(i).padStart(5, "0")}`;
})();

test("fødselsnummer med gyldige kontrollsifre maskeres; andre 11 sifre står", () => {
  assert.equal(mask(`Søker ${fnr}, sak 12345678901`), `Søker ${fnr.slice(0, 6)}*****, sak 12345678901`);
});

test("e-post og telefon maskeres", () => {
  assert.equal(mask("kari.nordmann@example.no"), "k***@example.no");
  assert.equal(mask("tlf 912 34 567"), "tlf *** ** *67");
  assert.equal(mask("+47 41234567"), "+47 ******67");
});
