// Hemmelighetene til kallene mot Neo og systemene. En hemmelighet står aldri med verdi i config-fila, bare som en
// referanse: { "$env": "SVARINN_PASSORD", "kilde": "azure-keyvault:kv-kunde/svarinn-passord" }, og "fil": true for en
// nøkkelfil (PEM). Verdien ligger i hvelvet til den som eier den, og ingen kopi lagres lokalt:
//
// - I en jobb i GitHub settes variabelen i `$env` fra jobbens hemmeligheter, og skriptet bruker den.
// - Ellers henter skriptet verdien fra `kilde` for kjøringen, med personens egen innlogging (`az login`, `op signin`).
//   Verdien holdes i minnet, én gang per kjøring, og skrives aldri til disk eller ut. En nøkkelfil er teksten i den.
//
// En referanse kan stå hvor som helst i config-fila. For systemene står den under `<system>.hemmeligheter.<navn>`, ved
// siden av oppsettet av systemet; for maskinklienten mot Neo under `neo.byEnv.<miljø>.apiClient.clientSecret`.
import { execFileSync } from "node:child_process";
import { CONFIG } from "./neo-config.mjs";

export const REF = '{ "$env": "<NAVN>", "kilde": "azure-keyvault:<hvelv>/<navn>" } (og "fil": true for en nøkkelfil)';

export const isRef = (v) => !!v && typeof v === "object" && !Array.isArray(v) && "$env" in v;

const run = (exec, cmd, args) => exec(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

// Kildene, så kunden bruker det den har. Key Vault er standarden. `manuell` har ingen kilde: variabelen må være satt.
export const SOURCES = {
  "azure-keyvault": (rest, exec) => {
    const [vault, name] = rest.split("/");
    if (!vault || !name) throw new Error(`azure-keyvault trenger <hvelv>/<navn>, fikk «${rest}»`);
    return run(exec, "az", ["keyvault", "secret", "show", "--vault-name", vault, "--name", name, "--query", "value", "-o", "tsv"]).replace(/\r?\n$/, "");
  },
  "1password": (rest, exec) => {
    if (!rest.startsWith("op://")) throw new Error(`1password trenger op://<hvelv>/<post>/<felt>, fikk «${rest}»`);
    return run(exec, "op", ["read", "--no-newline", rest]);
  },
};

export function parseKilde(kilde) {
  const i = kilde?.indexOf(":") ?? -1;
  if (i < 0) return null;
  return { type: kilde.slice(0, i), rest: kilde.slice(i + 1) };
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

// Verdiene som er hentet i denne kjøringen: hver referanse én gang, og alle sladdes fra det som skrives ut.
const fetched = new Map();

// Verdien til referansen: variabelen når den er satt (i CI), ellers fra kilden for kjøringen. En feil sier navnet,
// kilden og hva som gikk galt, aldri verdien.
export function secret(r, { exec = execFileSync, env = process.env } = {}) {
  if (!isRef(r)) return r;
  const where = `${r.$env}${r.sted ? ` (${r.sted})` : ""}`;
  if (env[r.$env]) return env[r.$env];
  const key = `${r.$env}|${r.kilde}`;
  if (fetched.has(key)) return fetched.get(key);
  if (r.kilde === "manuell") throw new Error(`${where} er ikke satt. Kilden er manuell: sett variabelen i skallet før skriptet kjøres`);
  const k = parseKilde(r.kilde);
  if (!k || !SOURCES[k.type]) throw new Error(`${where} har ${r.kilde ? `en ukjent kilde «${r.kilde}»` : "ingen kilde"}. ${REF}`);
  let v;
  try {
    v = SOURCES[k.type](k.rest, exec);
  } catch (e) {
    const why = String(e.stderr || e.message).trim().split("\n")[0];
    const hint = k.type === "azure-keyvault" ? " Er du logget inn med az login, og har du tilgang til hvelvet?" : "";
    throw new Error(`Fikk ikke hentet ${where} fra ${r.kilde}: ${why}.${hint}`);
  }
  if (!v) throw new Error(`${where} er tom i ${r.kilde}`);
  fetched.set(key, v);
  return v;
}

// Om personen når referansen, uten å hente verdien: bare om den finnes og er slått på. For Key Vault; de andre kildene
// sier at de ikke er sjekket.
export function reach(r, { exec = execFileSync, env = process.env } = {}) {
  if (env[r.$env]) return { ok: true, why: "satt i miljøet" };
  const k = parseKilde(r.kilde);
  if (r.kilde === "manuell") return { ok: false, why: "manuell: variabelen er ikke satt" };
  if (k?.type !== "azure-keyvault") return { ok: null, why: `${k?.type ?? "ingen kilde"}: ikke sjekket` };
  const [vault, name] = k.rest.split("/");
  try {
    const enabled = run(exec, "az", ["keyvault", "secret", "show", "--vault-name", vault, "--name", name, "--query", "attributes.enabled", "-o", "tsv"]).trim();
    return enabled === "true" ? { ok: true } : { ok: false, why: "slått av i hvelvet" };
  } catch (e) {
    return { ok: false, why: String(e.stderr || e.message).trim().split("\n")[0] };
  }
}

// Alle verdiene som er hemmelige i et svar eller en feilmelding, så de kan sladdes: det som er hentet i kjøringen, og
// variablene til referansene i delen som er satt.
export function secretValues(section, { env = process.env } = {}) {
  const out = [...fetched.values()];
  const walk = (x) => {
    if (isRef(x)) {
      const got = env[x.$env];
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
