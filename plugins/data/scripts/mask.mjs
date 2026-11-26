#!/usr/bin/env node
// Maskerer personopplysninger i et svar før det vises: fødsels- og d-nummer (11 sifre med gyldige kontrollsifre),
// norske telefonnumre og e-postadresser. Et tall på 11 sifre uten gyldige kontrollsifre er ikke et fødselsnummer, og
// står (saksnumre og beløp skal ikke forsvinne).
//
//   node mask.mjs < svar.json      eller      node mask.mjs <fil>
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { maskFnr } from "./lib/fnr.mjs";

export function mask(text) {
  return maskFnr(text)
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) => `${m[0]}***@${m.split("@")[1]}`)
    .replace(/(?<![\d*])(?:\+47[ ]?)?[49]\d{2}[ ]?\d{2}[ ]?\d{3}(?!\d)/g, (m) => {
      const [, cc = "", rest] = m.match(/^(\+47[ ]?)?(.*)$/);
      return cc + rest.replace(/\d(?=(?:\D*\d){2})/g, "*");
    });
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.stdout.write(mask(readFileSync(process.argv[2] ?? 0, "utf8")));
