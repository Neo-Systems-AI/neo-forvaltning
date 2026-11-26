#!/usr/bin/env node
// Kontakt- og reservasjonsregisteret (KRR) slik registeret selv svarer, for én eller flere personer. Tokenet hentes fra
// Maskinporten med klienten `krr.klient` (en klient i `maskinporten.klienter`) og brukes direkte. Bare lesing.
//
//   node krr.mjs person <fødselsnummer> [<fødselsnummer> …] [--v2]
//
// Personnummeret maskeres i alt som skrives ut: de seks første sifrene og *****.
//
// v1 er standard: den gir én rad per nummer, også IKKE_REGISTRERT. v2 utelater personer som ikke finnes, så et tomt
// v2-svar kan ikke skilles fra «ikke funnet». v1 sjekker heller ikke kontrollsifrene; et nummer med feil
// kontrollsiffer gir IKKE_REGISTRERT, som en person som ikke finnes. Derfor sier skriptet fra om kontrollsifrene selv.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse, Usage } from "./lib/argumenter.mjs";
import { load, miljo, need } from "./lib/neo-config.mjs";
import { gyldigFnr, maskFnr } from "./lib/fnr.mjs";
import { secret } from "./lib/hemmeligheter.mjs";
import { call, redact, report } from "./lib/http.mjs";
import { tokenFor } from "./lib/maskinporten.mjs";

export const HOSTS = { test: "https://test.kontaktregisteret.no", produksjon: "https://kontaktregisteret.no" };
export const SCOPE = "krr:global/kontaktinformasjon.read";
export const MAX_PER_CALL = 1000;

const BRUK = "Bruk: krr.mjs person <fødselsnummer> [<fødselsnummer> …] [--v2]";

// Én linje per person: status, reservasjon, varslingsstatus, e-post og mobil.
export function oppsummer(personer) {
  return personer.map((p) => {
    const c = p.kontaktinformasjon ?? {};
    return [p.personidentifikator ?? "(uten id)", p.status ?? "-", `reservasjon=${p.reservasjon ?? "-"}`, p.varslingsstatus ?? "-", c.epostadresse ?? "-", c.mobiltelefonnummer ?? "-"].join("  ");
  });
}

export async function main(argv, { fetchImpl = fetch, config, hemmelighet = secret, out = console.log, err = console.error } = {}) {
  const secrets = [];
  let ids = [];
  const say = (fn, text) => fn(maskFnr(redact(text, secrets), ids));
  try {
    const args = parse(argv, { brytere: ["v2"] });
    const [cmd, ...rest] = args._;
    ids = rest;
    if (cmd !== "person" || !ids.length) throw new Usage(BRUK);
    const ugyldige = ids.filter((id) => !/^\d{11}$/.test(id));
    if (ugyldige.length) throw new Usage(`Et fødselsnummer er 11 sifre: ${ugyldige.join(", ")}`);
    if (ids.length > MAX_PER_CALL) throw new Usage(`KRR tar høyst ${MAX_PER_CALL} personer per kall`);

    const { data } = config ?? load();
    const env = miljo(data, "krr", undefined, HOSTS);
    const navn = need(data, "krr.klient", "navnet på Maskinporten-klienten under maskinporten.klienter");
    say(out, `Miljø: ${env} (${HOSTS[env]}), klient: ${navn}`);
    for (const id of ids.filter((id) => !gyldigFnr(id))) say(err, `MERK: ${id} har ugyldige kontrollsifre (sendes likevel; v1 svarer IKKE_REGISTRERT, v2 svarer 400)`);

    const t = await tokenFor({ data, navn, miljo: env, scopes: undefined, fetchImpl, hemmelighet, secrets }).catch((e) => {
      if (/Ingen scopes/.test(e.message)) throw new Error(`${e.message}. KRR trenger ${SCOPE}`);
      throw e;
    });
    const url = `${HOSTS[env]}/rest/${args.v2 ? "v2" : "v1"}/personer`;
    const res = await call(url, { method: "POST", headers: { authorization: `Bearer ${t.accessToken}`, accept: "application/json", "content-type": "application/json" }, body: { personidentifikatorer: ids }, fetchImpl });
    say(out, report("POST", url, res, secrets));
    if (!res.ok) return 1;
    const personer = res.body?.personer;
    if (!Array.isArray(personer)) throw new Error("KRR svarte uten «personer»-liste");
    say(out, `\n${oppsummer(personer).join("\n")}`);
    const fikk = new Set(personer.map((p) => p.personidentifikator));
    const mangler = ids.filter((id) => !fikk.has(id));
    if (mangler.length && args.v2) say(out, `Ikke i v2-svaret (v2 utelater personer som ikke er registrert): ${mangler.join(", ")}`);
    else if (mangler.length) throw new Error(`KRR svarte uten rad for ${mangler.join(", ")}. v1 skal gi én rad per nummer`);
    return 0;
  } catch (e) {
    say(err, e instanceof Usage ? e.message : `Feil: ${e.message}`);
    return e instanceof Usage ? 2 : 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exitCode = await main(process.argv.slice(2));
