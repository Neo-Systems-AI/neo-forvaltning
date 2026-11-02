#!/usr/bin/env node
// Maskinporten slik systemet selv svarer: well-known for miljøet, og et token for en klient med scopet og utløpet
// Maskinporten faktisk innvilget. Tokenet skrives aldri ut. Bare lesing: et token endrer ingenting hos noen.
//
//   node maskinporten.mjs well-known [--miljo <miljø>]
//   node maskinporten.mjs token [<klient>] [--miljo <miljø>] [--scope <scope …>] [--consumer-org <orgnr>]
//
// Klientene står i `.claude/neo.config.json` under `maskinporten.byEnv.<miljø>`: standardklienten direkte
// (clientId, kid, nokkel, scopes), og navngitte klienter under `klienter.<navn>`, som arver det de ikke har selv.
import { isAbsolute, join } from "node:path";
import { load } from "./lib/neo-config.mjs";
import { loadEnvLocal, MissingSecret, isRef, secretValues, value } from "./lib/hemmeligheter.mjs";
import { call, redact, report } from "./lib/http.mjs";
import { HOSTS, token } from "./lib/maskinporten.mjs";

export const PLUGIN = "maskinporten";

const BRUK = `Bruk:
  maskinporten.mjs well-known [--miljo <miljø>]
  maskinporten.mjs token [<klient>] [--miljo <miljø>] [--scope <scope …>] [--consumer-org <orgnr>]`;

// Miljøet: det som er sagt, ellers maskinporten.defaultEnv, ellers det første i maskinporten.environments.
export function velgMiljo(data, wanted) {
  const section = data?.[PLUGIN] ?? {};
  const envs = section.environments ?? [];
  const env = wanted ?? section.defaultEnv ?? envs[0];
  if (!env) throw new Error(`Ingen miljøer i ${PLUGIN}.environments i .claude/neo.config.json`);
  if (envs.length && !envs.includes(env)) throw new Error(`«${env}» er ikke et miljø i ${PLUGIN}.environments (${envs.join(", ")})`);
  if (!HOSTS[env]) throw new Error(`Maskinporten har ikke miljøet «${env}». Miljøene: ${Object.keys(HOSTS).join(", ")}`);
  return env;
}

// Klienten for miljøet: standardklienten, eller en navngitt klient som arver det den ikke har selv.
export function klient(data, env, navn) {
  const byEnv = data?.[PLUGIN]?.byEnv?.[env] ?? {};
  const { klienter = {}, ...standard } = byEnv;
  if (navn && !klienter[navn]) {
    const finnes = Object.keys(klienter);
    throw new Error(`Klienten «${navn}» står ikke under ${PLUGIN}.byEnv.${env}.klienter${finnes.length ? ` (der står: ${finnes.join(", ")})` : ""}`);
  }
  const k = { ...standard, ...(navn ? klienter[navn] : {}) };
  const sted = navn ? `${PLUGIN}.byEnv.${env}.klienter.${navn}` : `${PLUGIN}.byEnv.${env}`;
  if (!k.clientId) throw new Error(`clientId mangler for ${sted}`);
  if (!k.nokkel) throw new Error(`nokkel mangler for ${sted}. Den står som en referanse: { "$env": "…", "kilde": "azure-keyvault:<hvelv>/<navn>", "fil": true }`);
  return { navn: navn ?? "standard", sted, clientId: value(k.clientId), kid: k.kid ? value(k.kid) : undefined, nokkel: k.nokkel, scopes: k.scopes ?? [] };
}

// Nøkkelen fra referansen: med «fil» er verdien en sti (relativ til repoet), ellers selve PEM-en.
export function nokkel(ref, root) {
  const v = value(ref);
  if (isRef(ref) && ref.fil) return { keyFile: isAbsolute(v) ? v : join(root ?? process.cwd(), v) };
  return { keyPem: v };
}

// Claimene i tokenet, uten tokenet. Det er dem feilsøket trenger: hvem, hvilket scope, på vegne av hvem, og utløpet.
export function claims(jwt) {
  try {
    const c = JSON.parse(Buffer.from(String(jwt).split(".")[1], "base64url").toString("utf8"));
    return { iss: c.iss, client_id: c.client_id, consumer: c.consumer?.ID, supplier: c.supplier?.ID, scope: c.scope, exp: c.exp };
  } catch {
    return null;
  }
}

export async function wellKnown({ env, fetchImpl = fetch }) {
  const url = `${HOSTS[env]}/.well-known/oauth-authorization-server`;
  const res = await call(url, { fetchImpl });
  return { url, res };
}

export async function hentToken({ data, env, navn, root, scopes, consumerOrg, fetchImpl = fetch }) {
  const k = klient(data, env, navn);
  const wanted = scopes?.length ? scopes : k.scopes;
  if (!wanted.length) throw new Error(`Ingen scopes for ${k.sted}. Sett scopes der, eller bruk --scope`);
  const t = await token({ miljo: env, clientId: k.clientId, scopes: wanted, kid: k.kid, consumerOrg, ...nokkel(k.nokkel, root), fetchImpl });
  return { klient: k, ba: wanted, ...t };
}

const flag = (args, name) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  if (v === undefined || v.startsWith("--")) throw new Error(`${name} trenger en verdi`);
  args.splice(i, 2);
  return v;
};

// Kjører kommandoen og gir exit-koden. `config` ({ data, root }) og `fetchImpl` sendes inn i testene.
export async function main(argv, { fetchImpl = fetch, config, out = console.log, err = console.error, now = Date.now } = {}) {
  const args = [...argv];
  let secrets = [];
  try {
    const wantedEnv = flag(args, "--miljo");
    const scopeArg = flag(args, "--scope");
    const consumerOrg = flag(args, "--consumer-org");
    const [cmd, navn] = args;
    if (!cmd || !["well-known", "token"].includes(cmd)) {
      err(BRUK);
      return 2;
    }
    let data = config?.data;
    let root = config?.root;
    if (!config) {
      // well-known trenger ingen klient, så den går uten config-fil når miljøet er sagt.
      const loaded = load();
      if (!loaded.data && !(cmd === "well-known" && !loaded.found && wantedEnv)) throw new Error(loaded.errors.join("\n"));
      data = loaded.data;
      root = loaded.found?.root;
      if (root) loadEnvLocal(root);
    }
    secrets = secretValues(data?.[PLUGIN]);
    const env = velgMiljo(data, wantedEnv);
    out(`Miljø: ${env} (${HOSTS[env]})`);

    if (cmd === "well-known") {
      const { url, res } = await wellKnown({ env, fetchImpl });
      out(report("GET", url, res, secrets));
      if (res.ok) out(`\nissuer: ${res.body?.issuer ?? "(mangler)"}\ntoken_endpoint: ${res.body?.token_endpoint ?? "(mangler)"}`);
      return res.ok ? 0 : 1;
    }

    const t = await hentToken({ data, env, navn, root, scopes: scopeArg?.split(/[\s,]+/).filter(Boolean), consumerOrg, fetchImpl });
    secrets.push(t.accessToken);
    const c = claims(t.accessToken);
    const utlop = typeof t.expiresIn === "number" ? new Date(now() + t.expiresIn * 1000).toISOString() : "(ukjent)";
    const lines = [
      `Klient: ${t.klient.navn} (${t.klient.sted})`,
      `client_id: ${t.klient.clientId}`,
      `ba om: ${t.ba.join(" ")}`,
      `innvilget: ${t.scope || "(tomt)"}`,
      `expires_in: ${t.expiresIn ?? "(mangler)"} s, utløper ${utlop}`,
      ...(consumerOrg ? [`på vegne av: ${consumerOrg} (delegering)`] : []),
      ...(c ? [`claims: ${JSON.stringify(c)}`] : ["claims: tokenet er ikke en JWT som kan leses"]),
      "Tokenet skrives aldri ut.",
    ];
    const ikke = t.ba.filter((s) => !t.scope.split(" ").includes(s));
    if (ikke.length) lines.push(`MERK: ikke innvilget: ${ikke.join(" ")}`);
    out(redact(lines.join("\n"), secrets));
    return 0;
  } catch (e) {
    const msg = e instanceof MissingSecret ? e.message : `Feil: ${e.message}`;
    err(redact(msg, secrets));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(await main(process.argv.slice(2)));
