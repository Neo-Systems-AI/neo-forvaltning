#!/usr/bin/env node
// Kontakt- og reservasjonsregisteret (KRR) slik registeret selv svarer, for én eller flere personer. Tokenet hentes fra
// Maskinporten med klienten i `maskinporten`-delen av config-fila og brukes direkte. Bare lesing.
//
//   node krr.mjs person <fødselsnummer> [<fødselsnummer> …] [--v2] [--klient <navn>] [--miljo <miljø>]
//
// Personnummeret maskeres i alt som skrives ut: de seks første sifrene og *****.
//
// v1 er standard: den gir én rad per nummer, også IKKE_REGISTRERT. v2 utelater personer som ikke finnes, så et tomt
// v2-svar kan ikke skilles fra «ikke funnet». v1 sjekker heller ikke kontrollsifrene; et nummer med feil
// kontrollsiffer gir IKKE_REGISTRERT, som en person som ikke finnes. Derfor sier skriptet fra om kontrollsifrene selv.
import { isAbsolute, join } from "node:path";
import { load } from "./lib/neo-config.mjs";
import { loadEnvLocal, MissingSecret, isRef, secretValues, value } from "./lib/hemmeligheter.mjs";
import { call, redact, report } from "./lib/http.mjs";
import { token } from "./lib/maskinporten.mjs";

export const PLUGIN = "krr";
export const HOSTS = { test: "https://test.kontaktregisteret.no", produksjon: "https://kontaktregisteret.no" };
export const SCOPE = "krr:global/kontaktinformasjon.read";
export const MAX_PER_CALL = 1000;

const BRUK = "Bruk: krr.mjs person <fødselsnummer> [<fødselsnummer> …] [--v2] [--klient <navn>] [--miljo <miljø>]";

// De seks første sifrene og *****, i all tekst: også i svaret og i feilmeldinger.
export const maskFnr = (text) => String(text).replace(/(?<!\d)(\d{6})\d{5}(?!\d)/g, "$1*****");

// Mod 11 for fødsels- og d-nummer: to kontrollsifre med faste vekter.
export function gyldigeKontrollsifre(id) {
  if (!/^\d{11}$/.test(id)) return false;
  const d = [...id].map(Number);
  const k = (w) => {
    const r = 11 - (w.reduce((s, x, i) => s + x * d[i], 0) % 11);
    return r === 11 ? 0 : r;
  };
  const k1 = k([3, 7, 6, 1, 8, 9, 4, 5, 2]);
  const k2 = k([5, 4, 3, 2, 7, 6, 5, 4, 3, 2]);
  return k1 !== 10 && k2 !== 10 && k1 === d[9] && k2 === d[10];
}

export function velgMiljo(data, wanted) {
  const section = data?.[PLUGIN] ?? {};
  const envs = section.environments ?? [];
  const env = wanted ?? section.defaultEnv ?? envs[0];
  if (!env) throw new Error(`Ingen miljøer i ${PLUGIN}.environments i .claude/neo.config.json`);
  if (envs.length && !envs.includes(env)) throw new Error(`«${env}» er ikke et miljø i ${PLUGIN}.environments (${envs.join(", ")})`);
  if (!HOSTS[env]) throw new Error(`KRR har ikke miljøet «${env}». Miljøene: ${Object.keys(HOSTS).join(", ")}`);
  return env;
}

// Klienten fra maskinporten-delen, slik maskinporten-pluginen leser den: en navngitt klient arver det den ikke har
// fra standardklienten for miljøet. Uten scopes i klienten brukes KRR-scopet.
export function klient(data, env, navn) {
  const byEnv = data?.maskinporten?.byEnv?.[env] ?? {};
  const { klienter = {}, ...standard } = byEnv;
  const sted = `maskinporten.byEnv.${env}.klienter.${navn}`;
  if (!klienter[navn]) throw new Error(`Klienten «${navn}» står ikke under maskinporten.byEnv.${env}.klienter. KRR henter klienten derfra (se /krr:env og /maskinporten:env)`);
  const k = { ...standard, ...klienter[navn] };
  if (!k.clientId) throw new Error(`clientId mangler for ${sted}`);
  if (!k.nokkel) throw new Error(`nokkel mangler for ${sted}`);
  return { navn, sted, clientId: value(k.clientId), kid: k.kid ? value(k.kid) : undefined, nokkel: k.nokkel, scopes: k.scopes?.length ? k.scopes : [SCOPE] };
}

function nokkel(ref, root) {
  const v = value(ref);
  if (isRef(ref) && ref.fil) return { keyFile: isAbsolute(v) ? v : join(root ?? process.cwd(), v) };
  return { keyPem: v };
}

// Selve oppslaget. Svaret tolkes ikke her.
export async function oppslag({ data, env, ids, versjon = "v1", klientNavn, root, fetchImpl = fetch }) {
  const k = klient(data, env, klientNavn);
  const t = await token({ miljo: env, clientId: k.clientId, scopes: k.scopes, kid: k.kid, ...nokkel(k.nokkel, root), fetchImpl });
  const url = `${HOSTS[env]}/rest/${versjon}/personer`;
  const res = await call(url, {
    method: "POST",
    headers: { authorization: `Bearer ${t.accessToken}`, accept: "application/json", "content-type": "application/json" },
    body: { personidentifikatorer: ids },
    fetchImpl,
  });
  return { url, res, klient: k, accessToken: t.accessToken };
}

// Én linje per person: status, reservasjon, varslingsstatus, e-post og mobil, med nummeret maskert.
export function oppsummer(personer) {
  return personer.map((p) => {
    const c = p.kontaktinformasjon ?? {};
    return maskFnr([p.personidentifikator ?? "(uten id)", p.status ?? "-", `reservasjon=${p.reservasjon ?? "-"}`, p.varslingsstatus ?? "-", c.epostadresse ?? "-", c.mobiltelefonnummer ?? "-"].join("  "));
  });
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
  const say = (fn, text) => fn(maskFnr(redact(text, secrets)));
  try {
    const wantedEnv = flag(args, "--miljo");
    const klientArg = flag(args, "--klient");
    const v2 = args.includes("--v2");
    const [cmd, ...ids] = args.filter((a) => a !== "--v2");
    if (cmd !== "person" || !ids.length) {
      err(BRUK);
      return 2;
    }
    const ugyldige = ids.filter((id) => !/^\d{11}$/.test(id));
    if (ugyldige.length) throw new Error(`Et fødselsnummer er 11 sifre: ${ugyldige.join(", ")}`);
    if (ids.length > MAX_PER_CALL) throw new Error(`KRR tar høyst ${MAX_PER_CALL} personer per kall`);

    let data = config?.data;
    let root = config?.root;
    if (!config) {
      const loaded = load();
      if (!loaded.data) throw new Error(loaded.errors.join("\n"));
      data = loaded.data;
      root = loaded.found.root;
      loadEnvLocal(root);
    }
    const env = velgMiljo(data, wantedEnv);
    const klientNavn = klientArg ?? data?.[PLUGIN]?.klient ?? "krr";
    secrets = [...secretValues(data?.[PLUGIN]), ...secretValues(data?.maskinporten?.byEnv?.[env])];
    say(out, `Miljø: ${env} (${HOSTS[env]}), klient: ${klientNavn}`);
    for (const id of ids.filter((id) => !gyldigeKontrollsifre(id))) say(err, `MERK: ${id} har ugyldige kontrollsifre (sendes likevel; v1 svarer IKKE_REGISTRERT, v2 svarer 400)`);

    const versjon = v2 ? "v2" : "v1";
    const { url, res, accessToken } = await oppslag({ data, env, ids, versjon, klientNavn, root, fetchImpl });
    secrets.push(accessToken);
    say(out, report("POST", url, res, secrets));
    if (!res.ok) return 1;

    const personer = res.body?.personer;
    if (!Array.isArray(personer)) throw new Error("KRR svarte uten «personer»-liste");
    say(out, `\n${oppsummer(personer).join("\n")}`);
    const fikk = new Set(personer.map((p) => p.personidentifikator));
    const mangler = ids.filter((id) => !fikk.has(id));
    if (mangler.length && versjon === "v2") say(out, `Ikke i v2-svaret (v2 utelater personer som ikke er registrert): ${mangler.join(", ")}`);
    else if (mangler.length) throw new Error(`KRR svarte uten rad for ${mangler.join(", ")}. v1 skal gi én rad per nummer`);
    return 0;
  } catch (e) {
    say(err, e instanceof MissingSecret ? e.message : `Feil: ${e.message}`);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(await main(process.argv.slice(2)));
