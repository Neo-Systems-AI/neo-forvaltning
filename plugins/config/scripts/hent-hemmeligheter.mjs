#!/usr/bin/env node
// Hemmelighetene fra hvelvet til `.env.local` og `.keys/`. Repoet har bare referansene, der de brukes:
// `integrasjoner/<system>/hemmeligheter.yaml` og `hemmeligheter` i personaene i `test/personaer/`. Verdiene skrives
// aldri ut: `--sjekk` viser navn og om de er satt, `--hent` skriver dem til filer som aldri committes.
//
//   node hent-hemmeligheter.mjs --sjekk [--root <dir>]
//   node hent-hemmeligheter.mjs --hent [--root <dir>]     kjøres av et menneske, med sin egen innlogging mot hvelvet
//
// En referanse: { $env: <NAVN>, kilde: azure-keyvault:<hvelv>/<navn> }, og `fil: true` når verdien er en nøkkelfil.
// Kildene:
//   azure-keyvault:<hvelv>/<navn>   Azure Key Vault (az keyvault secret show), med personens egen innlogging
//   manuell                          personen skriver verdien i .env.local selv; hentingen hopper over den
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { ENV_FILE, isRef, loadEnvLocal } from "./lib/hemmeligheter.mjs";
import { parseYaml } from "./lib/yaml.mjs";

export const SOURCES = {
  "azure-keyvault": (rest, exec = execFileSync) => {
    const [vault, name, ...more] = rest.split("/");
    if (!vault || !name || more.length) throw new Error(`azure-keyvault trenger <hvelv>/<navn>, fikk «${rest}»`);
    return exec("az", ["keyvault", "secret", "show", "--vault-name", vault, "--name", name, "--query", "value", "-o", "tsv"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd();
  },
};

export function parseKilde(kilde) {
  const i = kilde?.indexOf(":") ?? -1;
  if (i < 0) return null;
  return { type: kilde.slice(0, i), rest: kilde.slice(i + 1) };
}

const yamlFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort() : []);

// Stedene referansene står: hemmelighetene til hvert system, og hemmelighetene til hver persona.
export function sources(root) {
  const out = [];
  const integ = join(root, "integrasjoner");
  if (existsSync(integ)) {
    for (const sys of readdirSync(integ, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
      const abs = join(integ, sys, "hemmeligheter.yaml");
      if (existsSync(abs)) out.push({ file: `integrasjoner/${sys}/hemmeligheter.yaml`, abs, pick: (doc) => doc });
    }
  }
  for (const f of yamlFiles(join(root, "test", "personaer"))) {
    out.push({ file: `test/personaer/${f}`, abs: join(root, "test", "personaer", f), pick: (doc) => doc?.hemmeligheter });
  }
  return out;
}

// Alle referansene, med hvor de står. En verdi som ikke er en referanse, er en feil: verdien står aldri i repoet.
export function refs(root) {
  const list = [];
  const problems = [];
  for (const s of sources(root)) {
    let doc;
    try {
      doc = parseYaml(readFileSync(s.abs, "utf8"));
    } catch (e) {
      problems.push({ path: s.file, why: `YAML: ${e.message}` });
      continue;
    }
    const map = s.pick(doc);
    if (map == null) continue;
    if (typeof map !== "object" || Array.isArray(map)) {
      problems.push({ path: s.file, why: "hemmelighetene skal være et kart fra navn til referanse" });
      continue;
    }
    for (const [name, ref] of Object.entries(map)) {
      const path = `${s.file}#${name}`;
      if (!isRef(ref)) problems.push({ path, why: "ikke en referanse ({ $env, kilde }). Står verdien her, ta den ut og legg den i hvelvet" });
      else list.push({ path, env: ref.$env, kilde: ref.kilde ?? null, fil: ref.fil === true });
    }
  }
  const byEnv = new Map();
  for (const r of list) byEnv.set(r.env, [...(byEnv.get(r.env) ?? []), r]);
  for (const [env, group] of byEnv) {
    if (new Set(group.map((r) => `${r.kilde}|${r.fil}`)).size > 1) problems.push({ path: group.map((r) => r.path).join(", "), why: `${env} har ulike kilder; ett navn er én verdi` });
  }
  return { list: [...byEnv.values()].map((g) => g[0]), problems };
}

// Hva som er satt, uten verdier.
export const status = (list) => list.map((r) => ({ ...r, satt: process.env[r.env] !== undefined && process.env[r.env] !== "" }));

export function fetchAll(list, root, { sources: srcs = SOURCES } = {}) {
  const lines = existsSync(join(root, ENV_FILE)) ? readFileSync(join(root, ENV_FILE), "utf8").split("\n").filter((l) => l.trim()) : [];
  const set = (name, v) => {
    const i = lines.findIndex((l) => l.startsWith(`${name}=`));
    const line = `${name}=${v}`;
    if (i >= 0) lines[i] = line;
    else lines.push(line);
  };
  const done = [];
  const failed = [];
  for (const r of list) {
    if (r.kilde === "manuell") {
      done.push({ ...r, manuell: true });
      continue;
    }
    const k = parseKilde(r.kilde);
    if (!k || !srcs[k.type]) {
      failed.push({ ...r, why: r.kilde ? `ukjent kilde «${k?.type ?? r.kilde}» (azure-keyvault eller manuell)` : "referansen har ingen kilde" });
      continue;
    }
    try {
      const v = srcs[k.type](k.rest);
      if (r.fil) {
        mkdirSync(join(root, ".keys"), { recursive: true, mode: 0o700 });
        const f = join(".keys", `${r.env.toLowerCase()}.pem`);
        writeFileSync(join(root, f), v.endsWith("\n") ? v : `${v}\n`, { mode: 0o600 });
        set(r.env, f);
      } else set(r.env, v);
      done.push(r);
    } catch (e) {
      failed.push({ ...r, why: String(e.message).split("\n")[0] });
    }
  }
  writeFileSync(join(root, ENV_FILE), `${lines.join("\n")}\n`, { mode: 0o600 });
  chmodSync(join(root, ENV_FILE), 0o600);
  return { done, failed };
}

const gitRoot = () => {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return process.cwd();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const root = args.includes("--root") ? args[args.indexOf("--root") + 1] : gitRoot();
  const { list, problems } = refs(root);
  for (const p of problems) console.log(`✗ ${p.path}: ${p.why}`);
  if (!list.length && !problems.length) {
    console.log("Ingen referanser i integrasjoner/*/hemmeligheter.yaml eller test/personaer/.");
    process.exit(0);
  }
  if (args.includes("--hent")) {
    const { done, failed } = fetchAll(list, root);
    const fetched = done.filter((r) => !r.manuell);
    console.log(`${fetched.length} hentet til ${ENV_FILE}${fetched.some((r) => r.fil) ? " og .keys/" : ""}. Verdiene er ikke skrevet ut.`);
    for (const r of done.filter((x) => x.manuell)) console.log(`– ${r.env} settes for hånd i ${ENV_FILE} (kilde: manuell)`);
    for (const f of failed) console.log(`✗ ${f.env} (${f.path}): ${f.why}`);
    process.exit(failed.length || problems.length ? 1 : 0);
  }
  loadEnvLocal(root);
  console.log("| Hemmelighet | Står i | Kilde | Satt |\n|---|---|---|---|");
  for (const r of status(list)) console.log(`| \`${r.env}\` | \`${r.path}\` | ${r.kilde ?? "—"}${r.fil ? " (fil)" : ""} | ${r.satt ? "ja" : "❌ nei"} |`);
  process.exit(status(list).every((r) => r.satt) && !problems.length ? 0 : 1);
}
