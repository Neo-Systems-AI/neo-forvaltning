// Nøklene til kallene mot Neo og systemene. De ligger bare i hvelvet, med faste navn i formen `<system>--<navn>`, som i
// methods og labben. Repoet sier bare hvilket hvelv (`hvelv` i `.claude/neo.config.json`); pluginen sier hvilke nøkler
// den trenger (`nokler` i nøkkelfila). Ingen referanse står noe sted, og ingen kopi lagres lokalt.
//
// - Er variabelen satt (navnet med store bokstaver og `_`: `fiks--integrasjon-passord` → `FIKS_INTEGRASJON_PASSORD`),
//   brukes den. Det er veien i CI, der jobbens hemmeligheter har de samme navnene.
// - Ellers hentes verdien fra hvelvet for kjøringen, med personens egen innlogging i az, én gang per kjøring, og holdes
//   i minnet. Den skrives aldri til disk og aldri ut.
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { CONFIG } from "./neo-config.mjs";

export const NAVN = /^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*$/;

// Variabelen for en nøkkel: navnet med store bokstaver og `_`.
export const envName = (navn) => navn.toUpperCase().replace(/[^A-Z0-9]+/g, "_");

// Personens egen innlogging i az. I en Claude-økt kan AZURE_CONFIG_DIR peke på en tjenestekonto som ikke når hvelvene.
export const azEnv = (env = process.env) => ({ ...env, AZURE_CONFIG_DIR: env.NEO_PERSON_AZURE_CONFIG_DIR || join(homedir(), ".azure") });

export const az = (args, { exec = execFileSync, env = process.env } = {}) =>
  exec("az", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: azEnv(env) });

export const firstLine = (e) => String(e.stderr || e.message).trim().split("\n")[0];

// Hvelvet repoet bruker. Mangler det, sier feilen hvor det skal stå.
export function hvelv(data) {
  const v = data?.hvelv;
  if (typeof v !== "string" || !/^[A-Za-z0-9-]{3,24}$/.test(v)) throw new Error(`hvelv er ikke satt i ${CONFIG}: navnet på Key Vault-hvelvet nøklene ligger i, for eksempel "hvelv": "kv-kunde". /forvaltning:oppstart skriver det`);
  return v;
}

// Verdiene som er hentet i denne kjøringen: hver nøkkel én gang, og alle sladdes fra det som skrives ut.
const fetched = new Map();

// Verdien til nøkkelen med navnet: variabelen når den er satt, ellers fra hvelvet. En feil sier navnet og hvelvet,
// aldri verdien. En nøkkel pluginen sier er valgfri (`valgfri`), og som ikke finnes i hvelvet, gir null.
export function nokkel(data, navn, { exec = execFileSync, env = process.env, valgfri = false } = {}) {
  if (!NAVN.test(navn)) throw new Error(`«${navn}» er ikke et navn på en nøkkel (<system>--<navn>)`);
  const fra = env[envName(navn)];
  if (fra) return fra;
  if (fetched.has(navn)) return fetched.get(navn);
  const v = hvelv(data);
  let verdi;
  try {
    verdi = az(["keyvault", "secret", "show", "--vault-name", v, "--name", navn, "--query", "value", "-o", "tsv"], { exec, env }).replace(/\r?\n$/, "");
  } catch (e) {
    const why = firstLine(e);
    if (valgfri && /SecretNotFound|not found/i.test(why)) return null;
    const hint = /SecretNotFound|not found/i.test(why) ? " Legg den inn med /forvaltning:nokler (et menneske kjører fyll)." : " Er du logget inn med az login, og har du tilgang til hvelvet?";
    throw new Error(`Fikk ikke hentet nøkkelen ${navn} fra ${v}: ${why}.${hint}`);
  }
  if (!verdi) throw new Error(`Nøkkelen ${navn} er tom i ${v}`);
  fetched.set(navn, verdi);
  return verdi;
}

// Navnene på nøklene som står i hvelvet og er slått på. Bare navn, aldri verdier.
export function names(data, { exec = execFileSync, env = process.env } = {}) {
  const v = hvelv(data);
  try {
    return new Set(JSON.parse(az(["keyvault", "secret", "list", "--vault-name", v, "--query", "[?attributes.enabled].name", "-o", "json"], { exec, env }) || "[]"));
  } catch (e) {
    throw new Error(`Fikk ikke lest navnene i ${v}: ${firstLine(e)}. Er du logget inn med az login, og har du tilgang til hvelvet?`);
  }
}

// Verdiene som er hemmelige i et svar eller en feilmelding, så de kan sladdes: det som er hentet i kjøringen, og
// variablene til nøklene med navnene som er satt.
export function secretValues(navnene = [], { env = process.env } = {}) {
  const out = [...fetched.values()];
  for (const n of navnene) {
    const v = env[envName(n)];
    if (v && v.length >= 4) out.push(v);
  }
  return out;
}
