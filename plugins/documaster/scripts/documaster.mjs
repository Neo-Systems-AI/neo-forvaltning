#!/usr/bin/env node
// Rå lese-kall mot kundens Documaster-arkiv, til feilsøk: hva arkivet selv sier, så det kan settes opp mot det Neo
// gjorde. Token med client_credentials mot kundens klient, så Noark 5-spørringen (POST …/noark5/v1/query), som er
// et lese-kall selv om den er en POST. Ingenting her oppretter, endrer eller sletter.
//
//   node documaster.mjs token                                 virker klienten? (utløp og scope, aldri tokenet)
//   node documaster.mjs arkivdeler [--limit n]
//   node documaster.mjs mappe <id> | --saksnummer <mappeIdent>
//   node documaster.mjs registrering <id> | --ident <registreringsIdent>
//   node documaster.mjs journalpost <id>
//   node documaster.mjs registreringer --mappe <id> | --saksnummer <mappeIdent> [--limit n]
//   node documaster.mjs dokumenter --registrering <id> [--limit n]
//   node documaster.mjs sok --type <Noark-type> [--query "felt = @p"] [--param @p=verdi …] [--limit n]
//
//   --miljo <miljø>   et miljø i documaster.environments (standard: documaster.defaultEnv, ellers det første)
//
// Config: `documaster` i .claude/neo.config.json. Hemmeligheten leses fra miljøet eller .env.local, aldri fra fila.
// Exit: 0 svar 2xx · 1 feil eller ikke-2xx · 2 feil bruk.
import { load, resolve, pluginKeys } from "./lib/neo-config.mjs";
import { loadEnvLocal, secretValues, value } from "./lib/hemmeligheter.mjs";
import { call, redact, report } from "./lib/http.mjs";

export const QUERY_PATH = "/rms/api/public/noark5/v1/query";
export const MAX_LIMIT = 50;
const KEYS = ["apiUrl", "tokenUrl", "clientId", "clientSecret", "scope"];

export class Usage extends Error {}

// Miljøet: det som er bedt om, ellers documaster.defaultEnv, ellers det første. Et ukjent miljø er en feil.
export function pickEnv(data, wanted) {
  const envs = data?.documaster?.environments ?? [];
  if (!envs.length) throw new Error("documaster.environments mangler i .claude/neo.config.json. Se /documaster:env");
  const env = wanted ?? data.documaster.defaultEnv ?? envs[0];
  if (!envs.includes(env)) throw new Error(`«${env}» er ikke et miljø i documaster.environments (${envs.join(", ")})`);
  return env;
}

// Innstillingene for miljøet, med hemmeligheten som referanse. Mangler en, sies stien, aldri en verdi.
export function settings(data, miljo, keys = pluginKeys()) {
  const out = { miljo };
  for (const k of KEYS) {
    const r = resolve(data, k, { keys, env: miljo });
    if (r.source === "usatt") throw new Error(`${r.path} er ikke satt i .claude/neo.config.json. Se /documaster:env`);
    out[k] = r.value;
  }
  if (typeof out.clientSecret !== "object") throw new Error(`documaster.byEnv.${miljo}.clientSecret skal være en referanse ({ "$env": …, "kilde": … }), ikke en verdi. Fjern verdien fra fila`);
  out.apiUrl = String(out.apiUrl).replace(/\/+$/, "");
  return out;
}

export async function getToken(s, { fetchImpl = fetch } = {}) {
  const res = await call(s.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: s.clientId, client_secret: value(s.clientSecret), scope: s.scope }),
    fetchImpl,
  });
  if (!res.ok || !res.body?.access_token) {
    const why = typeof res.body === "object" ? `${res.body.error ?? ""} ${res.body.error_description ?? ""}`.trim() : String(res.body).slice(0, 300);
    throw new Error(`Token-kallet til ${s.tokenUrl} avslo: ${res.status} ${why}`);
  }
  return { accessToken: res.body.access_token, tokenType: res.body.token_type, expiresIn: res.body.expires_in, scope: res.body.scope ?? s.scope };
}

// Spørringene. Bare formen `felt = @param`, den produktet bruker; om spørrespråket tar && og || er ikke prøvd her.
const limitOf = (n, fallback = 10) => {
  const v = n === undefined ? fallback : Number(n);
  if (!Number.isInteger(v) || v < 1 || v > MAX_LIMIT) throw new Usage(`--limit må være et heltall fra 1 til ${MAX_LIMIT}`);
  return v;
};
const one = (type, field, param, v, limit = 1) => ({ type, limit, query: `${field} = @${param}`, parameters: { [`@${param}`]: v } });

export const QUERIES = {
  arkivdeler: (limit) => ({ type: "Arkivdel", limit }),
  mappe: (id) => one("AbstraktMappe", "id", "id", id),
  mappeMedSaksnummer: (s, limit) => one("AbstraktMappe", "mappeIdent", "saksnummer", s, limit),
  registrering: (id) => one("AbstraktRegistrering", "id", "id", id),
  registreringMedIdent: (ident, limit) => one("AbstraktRegistrering", "registreringsIdent", "registreringsIdent", ident, limit),
  journalpost: (id) => one("Journalpost", "id", "id", id),
  registreringerIMappe: (id, limit) => one("AbstraktRegistrering", "refMappe.id", "mappeId", id, limit),
  registreringerMedSaksnummer: (s, limit) => one("AbstraktRegistrering", "refMappe.mappeIdent", "saksnummer", s, limit),
  dokumentversjoner: (id, limit) => one("Dokumentversjon", "refDokument.refRegistrering.id", "registreringsId", id, limit),
};

export function parseArgs(argv) {
  const out = { _: [], param: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const name = a.slice(2);
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) throw new Usage(`--${name} trenger en verdi`);
    if (name === "param") out.param.push(v);
    else out[name] = v;
    i++;
  }
  return out;
}

// Kommandoen til en spørring, eller null for `token`. Feil bruk er Usage.
export function buildQuery(args) {
  const [cmd, arg] = args._;
  const limit = limitOf(args.limit);
  switch (cmd) {
    case "token":
      return null;
    case "arkivdeler":
      return QUERIES.arkivdeler(limit);
    case "mappe":
      if (args.saksnummer) return QUERIES.mappeMedSaksnummer(args.saksnummer, limit);
      if (arg) return QUERIES.mappe(arg);
      throw new Usage("mappe trenger en id eller --saksnummer <mappeIdent>");
    case "registrering":
      if (args.ident) return QUERIES.registreringMedIdent(args.ident, limit);
      if (arg) return QUERIES.registrering(arg);
      throw new Usage("registrering trenger en id eller --ident <registreringsIdent>");
    case "journalpost":
      if (arg) return QUERIES.journalpost(arg);
      throw new Usage("journalpost trenger en id");
    case "registreringer":
      if (args.mappe) return QUERIES.registreringerIMappe(args.mappe, limit);
      if (args.saksnummer) return QUERIES.registreringerMedSaksnummer(args.saksnummer, limit);
      throw new Usage("registreringer trenger --mappe <id> eller --saksnummer <mappeIdent>");
    case "dokumenter":
      if (args.registrering) return QUERIES.dokumentversjoner(args.registrering, limit);
      throw new Usage("dokumenter trenger --registrering <id>");
    case "sok": {
      if (!args.type || !/^[A-Za-z]+$/.test(args.type)) throw new Usage("sok trenger --type <Noark-type>, for eksempel Journalpost, Saksmappe, EksternId");
      const body = { type: args.type, limit };
      if (args.query) body.query = args.query;
      if (args.param.length) {
        body.parameters = {};
        for (const p of args.param) {
          const m = p.match(/^(@\w+)=(.*)$/s);
          if (!m) throw new Usage(`--param skal være @navn=verdi, fikk «${p}»`);
          body.parameters[m[1]] = m[2];
        }
      }
      return body;
    }
    default:
      throw new Usage(`Ukjent kommando «${cmd ?? ""}». Kommandoene: token, arkivdeler, mappe, registrering, journalpost, registreringer, dokumenter, sok`);
  }
}

export async function query(s, body, { accessToken, fetchImpl = fetch }) {
  const url = `${s.apiUrl}${QUERY_PATH}`;
  const result = await call(url, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json", accept: "application/json", "x-documaster-error-response-type": "application/json" },
    body,
    fetchImpl,
  });
  // Nettsiden svarer 200 med forsiden på alle stier, så en feil apiUrl ser ut som et vellykket kall.
  const html = (result.headers["content-type"] ?? "").includes("text/html") || (typeof result.body === "string" && /^\s*<(!doctype|html)/i.test(result.body));
  return { url, result, html };
}

// Hele kjøringen, med config og fetch utenfra så den kan testes. Skriver til out/err og returnerer exit-koden.
export async function run(argv, { data, fetchImpl = fetch, out = console.log, err = console.error } = {}) {
  let args, body;
  try {
    args = parseArgs(argv);
    body = buildQuery(args);
  } catch (e) {
    if (!(e instanceof Usage)) throw e;
    err(e.message);
    return 2;
  }
  const secrets = secretValues(data?.documaster);
  try {
    const s = settings(data, pickEnv(data, args.miljo));
    const t = await getToken(s, { fetchImpl });
    secrets.push(t.accessToken);
    if (!body) {
      out(`Miljø: ${s.miljo}\nToken hentet fra ${s.tokenUrl}: ${t.tokenType ?? "ukjent type"}, utløper om ${t.expiresIn ?? "?"} s, scope «${t.scope}».`);
      return 0;
    }
    const { url, result, html } = await query(s, body, { accessToken: t.accessToken, fetchImpl });
    out(redact(`Miljø: ${s.miljo}\nSpørring: ${JSON.stringify(body)}`, secrets));
    out(report("POST", url, result, secrets));
    if (html) {
      err(`Svaret er HTML, ikke JSON. apiUrl (${s.apiUrl}) peker trolig på nettsiden (/v2/), ikke API-et (vanligvis port 8083).`);
      return 1;
    }
    if (result.ok && body.limit && result.body?.hasMore) err(`Flere treff enn ${body.limit}. Øk --limit (høyst ${MAX_LIMIT}) eller snevre inn.`);
    return result.ok ? 0 : 1;
  } catch (e) {
    err(redact(e.message, secrets));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { found, data, errors } = load();
  if (!data) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  loadEnvLocal(found.root);
  process.exit(await run(process.argv.slice(2), { data }));
}
