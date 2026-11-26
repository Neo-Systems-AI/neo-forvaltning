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
// Config: `documaster` i .claude/neo.config.json (apiUrl, tokenUrl, clientId, scope): instansen repoet arbeider mot.
// Hemmeligheten er referansen documaster.hemmeligheter.client-secret i config-fila, hentet fra hvelvet for kallet.
// Exit: 0 svar 2xx · 1 feil eller ikke-2xx · 2 feil bruk.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse, Usage } from "./lib/argumenter.mjs";
import { load, need } from "./lib/config.mjs";
import { ref, secret } from "./lib/hemmeligheter.mjs";
import { call, redact, report } from "./lib/http.mjs";

export const QUERY_PATH = "/rms/api/public/noark5/v1/query";
export const MAX_LIMIT = 50;
const KEYS = [
  ["apiUrl", "adressen til API-et på instansen, for eksempel https://<instans>:8083"],
  ["tokenUrl", "token-adressen til innloggingen"],
  ["clientId", "klient-ID-en kunden har fått av Documaster eller registrert i Entra ID"],
  ["scope", "scopet i token-kallet"],
];

// Innstillingene for instansen. Mangler en, sies stien, aldri en verdi.
export function settings(data) {
  const out = {};
  for (const [k, what] of KEYS) out[k] = String(need(data, `documaster.${k}`, what));
  out.apiUrl = out.apiUrl.replace(/\/+$/, "");
  return out;
}

export async function getToken(s, clientSecret, { fetchImpl = fetch } = {}) {
  const res = await call(s.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: s.clientId, client_secret: clientSecret, scope: s.scope }),
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

export const parseArgs = (argv) => parse(argv, { verdier: ["limit", "saksnummer", "ident", "mappe", "registrering", "type", "query"], flere: ["param"] });

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

// Hele kjøringen, med config, fetch og hvelvet utenfra så den kan testes. Skriver til out/err og gir exit-koden.
export async function run(argv, { config, fetchImpl = fetch, hemmelighet = secret, out = console.log, err = console.error } = {}) {
  let body;
  const secrets = [];
  try {
    body = buildQuery(parseArgs(argv));
    const { data } = config ?? load();
    const s = settings(data);
    const clientSecret = hemmelighet(ref(data, "documaster", "client-secret"));
    secrets.push(clientSecret);
    const t = await getToken(s, clientSecret, { fetchImpl });
    secrets.push(t.accessToken);
    if (!body) {
      out(`Instans: ${s.apiUrl}\nToken hentet fra ${s.tokenUrl}: ${t.tokenType ?? "ukjent type"}, utløper om ${t.expiresIn ?? "?"} s, scope «${t.scope}».`);
      return 0;
    }
    const { url, result, html } = await query(s, body, { accessToken: t.accessToken, fetchImpl });
    out(redact(`Instans: ${s.apiUrl}\nSpørring: ${JSON.stringify(body)}`, secrets));
    out(report("POST", url, result, secrets));
    if (html) {
      err(`Svaret er HTML, ikke JSON. apiUrl (${s.apiUrl}) peker trolig på nettsiden (/v2/), ikke API-et (vanligvis port 8083).`);
      return 1;
    }
    if (result.ok && body.limit && result.body?.hasMore) err(`Flere treff enn ${body.limit}. Øk --limit (høyst ${MAX_LIMIT}) eller snevre inn.`);
    return result.ok ? 0 : 1;
  } catch (e) {
    err(e instanceof Usage ? e.message : redact(`Feil: ${e.message}`, secrets));
    return e instanceof Usage ? 2 : 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exitCode = await run(process.argv.slice(2));
