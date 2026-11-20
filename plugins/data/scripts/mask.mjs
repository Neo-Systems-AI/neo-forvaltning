#!/usr/bin/env node
// Maskerer personopplysninger i et svar før det vises: fødselsnummer og d-nummer (11 sifre med gyldige
// kontrollsifre), norske telefonnumre og e-postadresser. Et tall på 11 sifre uten gyldige kontrollsifre er ikke et
// fødselsnummer, og står (saksnumre og beløp skal ikke forsvinne).
//
//   node mask.mjs < svar.json      eller      node mask.mjs <fil>
import { readFileSync } from "node:fs";

const W1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
const W2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
const control = (digits, w) => {
  const r = 11 - (w.reduce((s, x, i) => s + x * digits[i], 0) % 11);
  return r === 11 ? 0 : r;
};

export function isFnr(s) {
  if (!/^\d{11}$/.test(s)) return false;
  const d = [...s].map(Number);
  const k1 = control(d, W1);
  const k2 = control(d, W2);
  return k1 !== 10 && k2 !== 10 && k1 === d[9] && k2 === d[10];
}

export function mask(text) {
  return String(text)
    .replace(/(?<!\d)\d{11}(?!\d)/g, (m) => (isFnr(m) ? `${m.slice(0, 6)}*****` : m))
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) => `${m[0]}***@${m.split("@")[1]}`)
    .replace(/(?<![\d*])(?:\+47[ ]?)?[49]\d{2}[ ]?\d{2}[ ]?\d{3}(?!\d)/g, (m) => {
      const [, cc = "", rest] = m.match(/^(\+47[ ]?)?(.*)$/);
      return cc + rest.replace(/\d(?=(?:\D*\d){2})/g, "*");
    });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = readFileSync(process.argv[2] ?? 0, "utf8");
  process.stdout.write(mask(input));
}
