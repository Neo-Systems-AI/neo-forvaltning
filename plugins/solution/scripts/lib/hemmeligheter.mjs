// Hemmelighetene til kallene mot systemene. Repoet har bare referansen, der den brukes:
// `integrasjoner/<system>/hemmeligheter.yaml` og `hemmeligheter` i personaene i `test/personaer/`:
//
//   <navn>: { kilde: azure-keyvault:<hvelv>/<navn i hvelvet> }            en verdi
//   <navn>: { kilde: azure-keyvault:<hvelv>/<navn i hvelvet>, fil: true } en fil, for eksempel en nøkkel (PEM)
//
// Verdien hentes fra Key Vault ved hvert kall, med personens egen innlogging (`az login`), og ligger aldri på disk: en
// fil lastes ned til en midlertidig mappe for kallet og slettes. Ingen verdi skrives ut; en feil sier referansen.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseYaml } from "./yaml.mjs";

export const KILDE = /^azure-keyvault:([A-Za-z0-9-]+)\/([A-Za-z0-9-]+)$/;
const isMap = (v) => !!v && typeof v === "object" && !Array.isArray(v);
export const isRef = (v) => isMap(v) && KILDE.test(String(v.kilde ?? "")) && (v.fil === undefined || typeof v.fil === "boolean") && Object.keys(v).every((k) => ["kilde", "fil"].includes(k));

const vault = (r) => {
  const [, hvelv, navn] = KILDE.exec(r.kilde);
  return { hvelv, navn };
};
const az = (exec, args) => exec("az", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const azError = (r, e) => new Error(`Fikk ikke hentet ${r.sted ?? r.kilde} fra hvelvet (${r.kilde}): ${String(e.stderr || e.message).trim().split("\n")[0]}. Er du logget inn med az login, og har du tilgang til hvelvet?`);

// Referansen med navnet i hemmeligheter.yaml til et system. Mangler den, sier feilen hvor den skal stå.
export function ref(root, system, navn) {
  const file = `integrasjoner/${system}/hemmeligheter.yaml`;
  if (!existsSync(join(root, file))) throw new Error(`${file} finnes ikke. Referansen ${navn}: { kilde: azure-keyvault:<hvelv>/<navn> } står der`);
  let doc;
  try {
    doc = parseYaml(readFileSync(join(root, file), "utf8"));
  } catch (e) {
    throw new Error(`${file} kan ikke leses som YAML (${e.message})`);
  }
  const r = isMap(doc) ? doc[navn] : undefined;
  if (r === undefined) throw new Error(`${navn} står ikke i ${file}. Legg inn ${navn}: { kilde: azure-keyvault:<hvelv>/<navn> }`);
  if (!isRef(r)) throw new Error(`${navn} i ${file} er ikke en referanse ({ kilde: azure-keyvault:<hvelv>/<navn> }, og fil: true for en fil)`);
  return { ...r, sted: `${file}#${navn}` };
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

// Alle referansene i repoet, med hvor de står. Det som ikke er en referanse, er et problem; verdien vises aldri.
export function allRefs(root) {
  const list = [];
  const problems = [];
  const sources = [];
  const integ = join(root, "integrasjoner");
  if (existsSync(integ)) for (const s of readdirSync(integ).sort()) if (existsSync(join(integ, s, "hemmeligheter.yaml"))) sources.push({ file: `integrasjoner/${s}/hemmeligheter.yaml`, pick: (d) => d });
  const pers = join(root, "test", "personaer");
  if (existsSync(pers)) for (const f of readdirSync(pers).filter((x) => /\.ya?ml$/.test(x)).sort()) sources.push({ file: `test/personaer/${f}`, pick: (d) => d?.hemmeligheter });
  for (const s of sources) {
    let map;
    try {
      map = s.pick(parseYaml(readFileSync(join(root, s.file), "utf8")));
    } catch (e) {
      problems.push({ sted: s.file, why: `kan ikke leses som YAML (${e.message})` });
      continue;
    }
    if (map == null) continue;
    if (!isMap(map)) {
      problems.push({ sted: s.file, why: "hemmelighetene er et kart fra navnet til referansen" });
      continue;
    }
    for (const [navn, r] of Object.entries(map)) {
      if (isRef(r)) list.push({ ...r, sted: `${s.file}#${navn}` });
      else problems.push({ sted: `${s.file}#${navn}`, why: "ikke en referanse ({ kilde: azure-keyvault:<hvelv>/<navn> }). Står verdien her, ta den ut, legg den i hvelvet og bytt den" });
    }
  }
  return { list, problems };
}
