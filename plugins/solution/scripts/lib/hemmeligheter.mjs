// Hemmelighetene til kallene mot Neo og systemene. En hemmelighet står aldri med verdi i config-fila, bare som en
// referanse: { "$env": "SVARINN_PASSORD", "kilde": "azure-keyvault:kv-kunde/svarinn-passord" }, og "fil": true for en
// nøkkelfil (PEM). Verdien ligger i kundens hvelv og hentes lokalt av et menneske (`hent-hemmeligheter.mjs --hent`) til
// `.env.local` og `.keys/`, som aldri committes; i en jobb i GitHub settes den samme variabelen fra jobbens hemmeligheter.
// Skriptene leser derfra uten å skrive verdien ut. Kunden eier hemmelighetene; vi eier koden.
//
// En referanse kan stå hvor som helst i config-fila. For systemene står den under `<system>.hemmeligheter.<navn>`, ved
// siden av oppsettet av systemet; for maskinklienten mot Neo under `neo.byEnv.<miljø>.apiClient.clientSecret`.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CONFIG } from "./neo-config.mjs";

export const ENV_FILE = ".env.local";
export const REF = '{ "$env": "<NAVN>", "kilde": "azure-keyvault:<hvelv>/<navn>" } (og "fil": true for en nøkkelfil)';

export const isRef = (v) => !!v && typeof v === "object" && !Array.isArray(v) && "$env" in v;

// Les .env.local inn i process.env, uten å overskrive det som alt er satt, og uten å skrive noe ut.
export function loadEnvLocal(root = process.cwd()) {
  const file = join(root, ENV_FILE);
  if (!existsSync(file)) return false;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#") || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  return true;
}

export class MissingSecret extends Error {
  constructor(ref) {
    super(`Hemmeligheten ${ref.$env}${ref.sted ? ` (${ref.sted})` : ""} er ikke satt.${ref.kilde ? ` Den ligger i ${ref.kilde};` : ""} hent den med /forvaltning:hemmeligheter (et menneske kjører hentingen, aldri agenten)`);
    this.ref = ref;
  }
}

// En verdi fra config-fila: en vanlig verdi som den er, en referanse fra miljøet. Feiler med navnet, aldri verdien.
export function value(v) {
  if (!isRef(v)) return v;
  const got = process.env[v.$env];
  if (got === undefined || got === "") throw new MissingSecret(v);
  return got;
}

// Om systemet har en referanse med navnet. For en hemmelighet bare noen kunder har.
export const has = (data, system, navn) => data?.[system]?.hemmeligheter?.[navn] !== undefined;

// Referansen med navnet under <system>.hemmeligheter i config-fila. Mangler den, sier feilen hvor den skal stå.
export function ref(data, system, navn) {
  const sted = `${system}.hemmeligheter.${navn}`;
  const r = data?.[system]?.hemmeligheter?.[navn];
  if (r === undefined) throw new Error(`${sted} står ikke i ${CONFIG}. Legg inn "${navn}": ${REF} under ${system}.hemmeligheter`);
  if (!isRef(r)) throw new Error(`${sted} i ${CONFIG} er ikke en referanse: ${REF}`);
  return { ...r, sted };
}

// Verdien til referansen: fra miljøet (.env.local lest inn først), og for en nøkkelfil innholdet i fila variabelen
// peker på. Ingen verdi skrives ut; en feil sier navnet og kilden.
export function secret(r, { root = process.cwd() } = {}) {
  loadEnvLocal(root);
  const v = value(r);
  if (!r.fil) return v;
  const file = join(root, v);
  if (!existsSync(file)) throw new Error(`Nøkkelfila for ${r.$env}${r.sted ? ` (${r.sted})` : ""} finnes ikke (${v}). Hent den med /forvaltning:hemmeligheter`);
  return readFileSync(file, "utf8");
}

// Alle verdiene som er hemmelige i et svar eller en feilmelding, så de kan sladdes.
export function secretValues(section) {
  const out = [];
  const walk = (x) => {
    if (isRef(x)) {
      const got = process.env[x.$env];
      if (got && got.length >= 4) out.push(got);
    } else if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  walk(section);
  return out;
}

// Alle referansene i config-fila: hvor hver hemmelighet står, navnet og kilden. Bare navn, aldri verdier.
export function refs(data) {
  const out = [];
  const walk = (x, path) => {
    if (isRef(x)) out.push({ path, env: x.$env, kilde: x.kilde ?? null, fil: x.fil ?? false });
    else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(data, "");
  return out;
}
