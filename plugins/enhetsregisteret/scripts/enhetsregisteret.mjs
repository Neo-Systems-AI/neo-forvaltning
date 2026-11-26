#!/usr/bin/env node
// Enhetsregisteret slik Brønnøysundregistrene selv svarer: en enhet, en underenhet, eller underenhetene til en enhet.
// Det åpne API-et (data.brreg.no), uten innlogging og uten hemmeligheter. Bare lesing.
//
//   node enhetsregisteret.mjs enhet [<orgnr>] [--miljo produksjon|test]
//   node enhetsregisteret.mjs underenhet <orgnr> [--miljo produksjon|test]
//   node enhetsregisteret.mjs underenheter [<orgnr>] [--side <n>] [--antall <n>] [--miljo produksjon|test]
//
// Miljøet er --miljo, ellers `enhetsregisteret.miljo` i config-fila; uten noen av dem stopper skriptet og sier det.
// Uten orgnr brukes `enhetsregisteret.orgnr`. `test` er Brønnøysundregistrenes testmiljø med oppdiktede data.
import { fileURLToPath } from "node:url";
import { parse, Usage } from "./lib/argumenter.mjs";
import { get, load, miljo } from "./lib/config.mjs";
import { gyldigOrgnr } from "./lib/fnr.mjs";
import { call, report } from "./lib/http.mjs";

export const HOSTS = { produksjon: "https://data.brreg.no", test: "https://data.ppe.brreg.no" };
const API = "/enhetsregisteret/api";
const BRUK = `Bruk:
  enhetsregisteret.mjs enhet [<orgnr>] [--miljo produksjon|test]
  enhetsregisteret.mjs underenhet <orgnr> [--miljo produksjon|test]
  enhetsregisteret.mjs underenheter [<orgnr>] [--side <n>] [--antall <n>] [--miljo produksjon|test]`;

export function adresse(env, cmd, orgnr, { side, antall } = {}) {
  const base = `${HOSTS[env]}${API}`;
  if (cmd === "enhet") return `${base}/enheter/${orgnr}`;
  if (cmd === "underenhet") return `${base}/underenheter/${orgnr}`;
  const q = new URLSearchParams({ overordnetEnhet: orgnr, ...(side !== undefined ? { page: side } : {}), ...(antall !== undefined ? { size: antall } : {}) });
  return `${base}/underenheter?${q}`;
}

// Det viktigste i svaret, på én linje per enhet: nummer, navn, form, kommune og om den er slettet eller konkurs.
export function oppsummer(enhet) {
  const adr = enhet.forretningsadresse ?? enhet.beliggenhetsadresse ?? {};
  const merker = [enhet.slettedato && `slettet ${enhet.slettedato}`, enhet.konkurs && "konkurs", enhet.underAvvikling && "under avvikling", enhet.underTvangsavviklingEllerTvangsopplosning && "under tvangsavvikling"].filter(Boolean);
  return [enhet.organisasjonsnummer, enhet.navn, enhet.organisasjonsform?.kode ?? "-", [adr.kommunenummer, adr.kommune].filter(Boolean).join(" ") || "-", enhet.overordnetEnhet ? `under ${enhet.overordnetEnhet}` : null, ...merker].filter(Boolean).join("  ");
}

export async function main(argv, { fetchImpl = fetch, config, out = console.log, err = console.error } = {}) {
  try {
    const args = parse(argv, { verdier: ["miljo", "side", "antall"] });
    const [cmd, orgArg] = args._;
    if (!["enhet", "underenhet", "underenheter"].includes(cmd)) throw new Usage(BRUK);
    for (const n of ["side", "antall"]) if (args[n] !== undefined && !/^\d+$/.test(args[n])) throw new Usage(`--${n} er et tall, fikk «${args[n]}»`);
    // Uten --miljo og uten orgnr trengs config-fila; med begge går oppslaget uten.
    const data = config?.data ?? (args.miljo && orgArg ? null : load().data);
    const env = miljo(data, "enhetsregisteret", args.miljo, HOSTS);
    const orgnr = orgArg ?? (cmd !== "underenhet" ? get(data, "enhetsregisteret.orgnr") : undefined);
    if (!orgnr) throw new Usage(`Mangler organisasjonsnummer${cmd !== "underenhet" ? ", og enhetsregisteret.orgnr er ikke satt" : ""}`);
    if (!/^\d{9}$/.test(orgnr)) throw new Usage(`Et organisasjonsnummer er 9 sifre, fikk «${orgnr}»`);

    out(`Miljø: ${env} (${HOSTS[env]})${orgArg ? "" : ", orgnr fra enhetsregisteret.orgnr"}`);
    if (!gyldigOrgnr(orgnr)) err(`MERK: ${orgnr} har ugyldig kontrollsiffer (sendes likevel)`);
    const url = adresse(env, cmd, orgnr, { side: args.side, antall: args.antall });
    const res = await call(url, { headers: { accept: "application/json" }, fetchImpl });
    out(report("GET", url, res));
    if (!res.ok) {
      if (res.status === 404) out(`\n${orgnr} finnes ikke som ${cmd === "enhet" ? "enhet (prøv underenhet)" : "underenhet (prøv enhet)"} i ${env}`);
      return 1;
    }
    if (cmd === "underenheter") {
      const liste = res.body?._embedded?.underenheter ?? [];
      const p = res.body?.page;
      out(`\n${liste.map(oppsummer).join("\n") || "Ingen underenheter."}`);
      if (p) out(`side ${p.number + 1} av ${Math.max(p.totalPages, 1)}, ${p.totalElements} i alt`);
    } else out(`\n${oppsummer(res.body ?? {})}`);
    return 0;
  } catch (e) {
    err(e instanceof Usage ? e.message : `Feil: ${e.message}`);
    return e instanceof Usage ? 2 : 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
