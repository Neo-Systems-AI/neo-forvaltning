// Hemmelighetene til kallene mot de eksterne systemene. En hemmelighet står aldri med verdi i config-fila, bare som
// en referanse: { "$env": "SVARINN_PASSORD", "kilde": "azure-keyvault:kv-kunde/svarinn-passord" }. Verdien ligger i
// kundens hvelv og hentes lokalt av et menneske (`hent-hemmeligheter.mjs --hent`) til `.env.local` og `.keys/`, som
// aldri committes. Skriptene leser derfra uten å skrive verdien ut. Kunden eier hemmelighetene; vi eier koden.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const ENV_FILE = ".env.local";

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
    super(`Hemmeligheten ${ref.$env} er ikke satt.${ref.kilde ? ` Den ligger i ${ref.kilde};` : ""} hent den med /forvaltning:hemmeligheter (et menneske kjører hentingen, aldri agenten)`);
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
