#!/usr/bin/env node
// Enhetsregisteret slik Brønnøysundregistrene selv svarer: en enhet, en underenhet, eller underenhetene til en enhet.
// Det åpne API-et (data.brreg.no), uten innlogging og uten hemmeligheter. Bare lesing.
//
//   node enhetsregisteret.mjs enhet [<orgnr>] [--miljo <miljø>]
//   node enhetsregisteret.mjs underenhet <orgnr> [--miljo <miljø>]
//   node enhetsregisteret.mjs underenheter [<orgnr>] [--side <n>] [--antall <n>] [--miljo <miljø>]
//
// Uten orgnr brukes `enhetsregisteret.orgnr` fra config-fila. Uten config-fil brukes produksjon, det eneste
// miljøet de fleste trenger. `test` er Brønnøysundregistrenes testmiljø med oppdiktede data (data.ppe.brreg.no).
import { load } from "./lib/neo-config.mjs";
import { loadEnvLocal, secretValues } from "./lib/hemmeligheter.mjs";
import { call, redact, report } from "./lib/http.mjs";

export const PLUGIN = "enhetsregisteret";
export const HOSTS = { produksjon: "https://data.brreg.no", test: "https://data.ppe.brreg.no" };
const API = "/enhetsregisteret/api";

const BRUK = `Bruk:
  enhetsregisteret.mjs enhet [<orgnr>] [--miljo <miljø>]
  enhetsregisteret.mjs underenhet <orgnr> [--miljo <miljø>]
  enhetsregisteret.mjs underenheter [<orgnr>] [--side <n>] [--antall <n>] [--miljo <miljø>]`;

// Mod 11 med vektene 3 2 7 6 5 4 3 2. Rest 1 gir ikke et gyldig nummer.
export function gyldigOrgnr(orgnr) {
  if (!/^\d{9}$/.test(orgnr)) return false;
  const d = [...orgnr].map(Number);
  const r = 11 - ([3, 2, 7, 6, 5, 4, 3, 2].reduce((s, w, i) => s + w * d[i], 0) % 11);
  const k = r === 11 ? 0 : r;
  return k !== 10 && k === d[8];
}

export function velgMiljo(data, wanted) {
  const section = data?.[PLUGIN] ?? {};
  const envs = section.environments ?? [];
  const env = wanted ?? section.defaultEnv ?? envs[0] ?? "produksjon";
  if (envs.length && !envs.includes(env)) throw new Error(`«${env}» er ikke et miljø i ${PLUGIN}.environments (${envs.join(", ")})`);
  if (!HOSTS[env]) throw new Error(`Enhetsregisteret har ikke miljøet «${env}». Miljøene: ${Object.keys(HOSTS).join(", ")}`);
  return env;
}

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

const flag = (args, name) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  if (v === undefined || v.startsWith("--")) throw new Error(`${name} trenger en verdi`);
  args.splice(i, 2);
  return v;
};

export async function main(argv, { fetchImpl = fetch, config, out = console.log, err = console.error } = {}) {
  const args = [...argv];
  let secrets = [];
  try {
    const wantedEnv = flag(args, "--miljo");
    const side = flag(args, "--side");
    const antall = flag(args, "--antall");
    const [cmd, orgArg] = args;
    if (!["enhet", "underenhet", "underenheter"].includes(cmd)) {
      err(BRUK);
      return 2;
    }
    for (const [n, v] of [["--side", side], ["--antall", antall]]) if (v !== undefined && !/^\d+$/.test(v)) throw new Error(`${n} er et tall, fikk «${v}»`);

    let data = config?.data ?? null;
    if (!config) {
      const loaded = load();
      if (loaded.found && !loaded.data) throw new Error(loaded.errors.join("\n"));
      data = loaded.data;
      if (loaded.found?.root) loadEnvLocal(loaded.found.root);
    }
    secrets = secretValues(data?.[PLUGIN]);
    const env = velgMiljo(data, wantedEnv);
    const orgnr = orgArg ?? (cmd !== "underenhet" ? data?.[PLUGIN]?.orgnr : undefined);
    if (!orgnr) throw new Error(`Mangler organisasjonsnummer${cmd !== "underenhet" ? `, og ${PLUGIN}.orgnr er ikke satt` : ""}`);
    if (!/^\d{9}$/.test(orgnr)) throw new Error(`Et organisasjonsnummer er 9 sifre, fikk «${orgnr}»`);

    out(`Miljø: ${env} (${HOSTS[env]})${data ? "" : ", ingen config-fil"}${orgArg ? "" : `, orgnr fra ${PLUGIN}.orgnr`}`);
    if (!gyldigOrgnr(orgnr)) err(`MERK: ${orgnr} har ugyldig kontrollsiffer (sendes likevel)`);

    const url = adresse(env, cmd, orgnr, { side, antall });
    const res = await call(url, { headers: { accept: "application/json" }, fetchImpl });
    out(report("GET", url, res, secrets));
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
    err(redact(`Feil: ${e.message}`, secrets));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(await main(process.argv.slice(2)));
