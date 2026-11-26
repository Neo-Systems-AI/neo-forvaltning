// Hemmelighetene til kallene mot systemene. Repoet har bare referansen, ved siden av oppsettet av systemet i
// `.claude/neo.config.json`, under `<system>.hemmeligheter`:
//
//   "<navn>": { "kilde": "azure-keyvault:<hvelv>/<navn i hvelvet>" }               en verdi
//   "<navn>": { "kilde": "azure-keyvault:<hvelv>/<navn i hvelvet>", "fil": true }  en fil, for eksempel en nøkkel (PEM)
//
// Verdien hentes fra Key Vault ved hvert kall, med personens egen innlogging (`az login`), og ligger aldri på disk: en
// fil lastes ned til en midlertidig mappe for kallet og slettes. Ingen verdi skrives ut; en feil sier referansen.
// Personaenes referanser (i `test/personaer/`) leses bare av `solution`, som har YAML-leseren til sjekken.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONFIG } from "./config.mjs";

export const KILDE = /^azure-keyvault:([A-Za-z0-9-]+)\/([A-Za-z0-9-]+)$/;
export const REF = '{ "kilde": "azure-keyvault:<hvelv>/<navn>" } (og "fil": true for en nøkkelfil)';
const isMap = (v) => !!v && typeof v === "object" && !Array.isArray(v);
export const isRef = (v) => isMap(v) && KILDE.test(String(v.kilde ?? "")) && (v.fil === undefined || typeof v.fil === "boolean") && Object.keys(v).every((k) => ["kilde", "fil"].includes(k));

const vault = (r) => {
  const [, hvelv, navn] = KILDE.exec(r.kilde);
  return { hvelv, navn };
};
const az = (exec, args) => exec("az", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const azError = (r, e) => new Error(`Fikk ikke hentet ${r.sted ?? r.kilde} fra hvelvet (${r.kilde}): ${String(e.stderr || e.message).trim().split("\n")[0]}. Er du logget inn med az login, og har du tilgang til hvelvet?`);

// Om systemet har en referanse med navnet. For en hemmelighet bare noen kunder har.
export const has = (data, system, navn) => data?.[system]?.hemmeligheter?.[navn] !== undefined;

// Referansen med navnet under <system>.hemmeligheter i config-fila. Mangler den, sier feilen hvor den skal stå.
export function ref(data, system, navn) {
  const sted = `${system}.hemmeligheter.${navn}`;
  const r = data?.[system]?.hemmeligheter?.[navn];
  if (r === undefined) throw new Error(`${sted} står ikke i ${CONFIG}. Legg inn "${navn}": { "kilde": "azure-keyvault:<hvelv>/<navn>" } under ${system}.hemmeligheter`);
  if (!isRef(r)) throw new Error(`${sted} i ${CONFIG} er ikke en referanse: ${REF}`);
  return { ...r, sted };
}

// Verdien fra hvelvet. En fil lastes ned til en midlertidig mappe, leses og slettes.
export function secret(r, { exec = execFileSync } = {}) {
  const { hvelv, navn } = vault(r);
  if (!r.fil) {
    try {
      return az(exec, ["keyvault", "secret", "show", "--vault-name", hvelv, "--name", navn, "--query", "value", "-o", "tsv"]).replace(/\r?\n$/, "");
    } catch (e) {
      throw azError(r, e);
    }
  }
  const dir = mkdtempSync(join(tmpdir(), "neo-hemmelighet-"));
  try {
    const file = join(dir, "verdi");
    az(exec, ["keyvault", "secret", "download", "--vault-name", hvelv, "--name", navn, "--file", file]);
    return readFileSync(file, "utf8");
  } catch (e) {
    throw azError(r, e);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Om personen når referansen, uten å hente verdien ut: bare om den finnes og er slått på.
export function reach(r, { exec = execFileSync } = {}) {
  const { hvelv, navn } = vault(r);
  try {
    const enabled = az(exec, ["keyvault", "secret", "show", "--vault-name", hvelv, "--name", navn, "--query", "attributes.enabled", "-o", "tsv"]).trim();
    return enabled === "true" ? { ok: true } : { ok: false, why: "slått av i hvelvet" };
  } catch (e) {
    return { ok: false, why: String(e.stderr || e.message).trim().split("\n")[0] };
  }
}

// Alle referansene i config-fila, med hvor de står. Det som ikke er en referanse, er et problem; verdien vises aldri.
export function configRefs(data) {
  const list = [];
  const problems = [];
  for (const [system, part] of Object.entries(isMap(data) ? data : {})) {
    if (!isMap(part) || part.hemmeligheter === undefined) continue;
    const at = `${system}.hemmeligheter`;
    if (!isMap(part.hemmeligheter)) {
      problems.push({ sted: at, why: "er et kart fra navnet til referansen" });
      continue;
    }
    for (const [navn, r] of Object.entries(part.hemmeligheter)) {
      if (isRef(r)) list.push({ ...r, sted: `${at}.${navn}` });
      else problems.push({ sted: `${at}.${navn}`, why: `ikke en referanse (${REF}). Står verdien her, ta den ut, legg den i hvelvet og bytt den` });
    }
  }
  return { list, problems };
}
