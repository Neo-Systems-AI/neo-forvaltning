#!/usr/bin/env node
// Konfigfilene i kunderepoet: hver fil i Neos format under en løsnings `5-oppsett/` eller under
// `organisasjon/5-oppsett/`, med stien Neo skal ha (stien under `5-oppsett/`). Samme sti to steder er samme nøkkel to
// steder, og stopper: Neo har bare ett objekt per nøkkel. `spor.yaml` er sporingen, ikke konfig.
//
// Med manifestet fra Neo (`GET <adresse>/api/config/schema`, åpent) sjekkes også at fila ligger i mappa for typen,
// med filnavnet nøkkelen gir, og lista kommer i rekkefølgen apply trenger. Manifestet hentes fra Neo, aldri kopiert
// hit. Uten det (`--uten-neo`) sies det, og lista er alfabetisk.
//
//   node konfigfiler.mjs [--miljo <miljø>] [--manifest <fil>] [--uten-neo] [--losning <navn>] [--stier] [--json]
//                        [--root <dir>]
//
//   --stier    bare stiene i Neo, som JSON (det config_not_in_files tar)
//   --losning  bare filene til én løsning (`organisasjon` for de felles); samme nøkkel sjekkes likevel i hele repoet
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { parseYaml } from "./yaml.mjs";

export const OPPSETT = "5-oppsett";
export const SPOR = "spor.yaml";

// Filnavnet Neo gir en nøkkel (regelen står i manifestet, `fileName.rule`).
export const fileStem = (key) =>
  String(key)
    .toLowerCase()
    .replace(/[æøå]/g, (c) => ({ æ: "ae", ø: "o", å: "a" })[c])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const posix = (p) => p.split(sep).join("/");
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// Mappene med konfig: organisasjonen, og hver løsning.
export function roots(root) {
  const out = [];
  const org = join(root, "organisasjon", OPPSETT);
  if (existsSync(org)) out.push({ eier: "organisasjon", dir: org });
  const losninger = join(root, "losninger");
  if (existsSync(losninger)) {
    for (const d of readdirSync(losninger, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name).sort()) {
      const dir = join(losninger, d, OPPSETT);
      if (existsSync(dir)) out.push({ eier: d, dir });
    }
  }
  return out;
}

// Filene, lest og sjekket. `manifest` er svaret fra Neo, eller null.
export function collect(root, { manifest = null } = {}) {
  const files = [];
  const problems = [];
  for (const { eier, dir } of roots(root)) {
    for (const abs of walk(dir).sort()) {
      const fil = posix(relative(root, abs));
      const sti = posix(relative(dir, abs));
      if (sti === SPOR || basename(abs).toLowerCase() === "readme.md" || basename(abs).startsWith(".")) continue;
      if (/\.yml$/.test(abs)) {
        problems.push({ fil, melding: "Neo leser bare .yaml. Gi fila endelsen .yaml" });
        continue;
      }
      if (!/\.yaml$/.test(abs)) {
        problems.push({ fil, melding: `${OPPSETT}/ har bare konfigfiler i Neos format (.yaml) og ${SPOR}` });
        continue;
      }
      const tekst = readFileSync(abs, "utf8");
      let doc;
      try {
        doc = parseYaml(tekst);
      } catch (e) {
        problems.push({ fil, melding: `YAML: ${e.message}` });
        continue;
      }
      if (!doc || typeof doc !== "object" || !doc.kind || !doc.spec) {
        problems.push({ fil, melding: "Fila er ikke i Neos format: den mangler kind eller spec" });
        continue;
      }
      files.push({ fil, sti, eier, kind: doc.kind, apiVersion: doc.apiVersion ?? null, doc, tekst });
    }
  }

  // Samme sti to steder er samme nøkkel to steder.
  const bySti = new Map();
  for (const f of files) bySti.set(f.sti, [...(bySti.get(f.sti) ?? []), f]);
  for (const [sti, group] of bySti) {
    if (group.length > 1) problems.push({ fil: group[0].fil, melding: `Samme nøkkel to steder: ${sti} står i ${group.map((g) => g.fil).join(" og ")}. Neo har ett objekt per nøkkel; behold den ene` });
  }

  if (manifest) {
    const byDir = new Map(manifest.kinds.map((k) => [k.directory, k]));
    for (const f of files) {
      if (manifest.apiVersion && f.apiVersion !== manifest.apiVersion) problems.push({ fil: f.fil, melding: `apiVersion er ${f.apiVersion ?? "tom"}, Neo leser ${manifest.apiVersion}` });
      const [dir, ...rest] = f.sti.split("/");
      const kind = byDir.get(dir);
      if (!kind || rest.length !== 1) {
        problems.push({ fil: f.fil, melding: `${f.sti} ligger ikke rett i en mappe for en type. Mappene: ${[...byDir.keys()].join(", ")}` });
        continue;
      }
      if (kind.kind !== f.kind) {
        problems.push({ fil: f.fil, melding: `Fila er ${f.kind}, men ligger i mappa for ${kind.kind}` });
        continue;
      }
      f.nokkel = kind.keyFields.map((k) => f.doc.spec?.[k]).join("/");
      const want = `${dir}/${fileStem(f.nokkel)}.yaml`;
      if (want !== f.sti) problems.push({ fil: f.fil, melding: `Nøkkelen «${f.nokkel}» gir ${want}, ikke ${f.sti}. Flytt fila, eller rett nøkkelen` });
    }
    const order = manifest.applyOrder ?? [];
    const rank = (f) => (order.includes(f.kind) ? order.indexOf(f.kind) : order.length);
    files.sort((a, b) => rank(a) - rank(b) || (a.sti < b.sti ? -1 : a.sti > b.sti ? 1 : 0));
  } else {
    files.sort((a, b) => (a.sti < b.sti ? -1 : a.sti > b.sti ? 1 : 0));
  }
  return { files, problems, iRekkefolge: !!manifest };
}

// Manifestet fra Neo for miljøet, med adressen fra `.claude/neo.config.json`.
export async function fetchManifest(url, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(`${String(url).replace(/\/+$/, "")}/api/config/schema`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${url}/api/config/schema svarte ${res.status}`);
  return res.json();
}

export function markdown({ files, problems, iRekkefolge }) {
  const lines = [];
  lines.push(iRekkefolge ? "Rekkefølgen er den Neo gir for apply." : "Uten manifestet fra Neo: alfabetisk, ikke rekkefølgen for apply, og mappene og filnavnene er ikke sjekket.");
  lines.push("", "| # | Fil i repoet | Sti i Neo | Type | Hører til |", "|---|---|---|---|---|");
  files.forEach((f, i) => lines.push(`| ${i + 1} | \`${f.fil}\` | \`${f.sti}\` | ${f.kind} | ${f.eier} |`));
  if (problems.length) lines.push("", `**${problems.length} å rette:**`, ...problems.map((p) => `- ❌ \`${p.fil}\`: ${p.melding}`));
  return `${lines.join("\n")}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  let root = arg("--root");
  let manifest = null;
  if (arg("--manifest")) manifest = JSON.parse(readFileSync(arg("--manifest"), "utf8"));
  if (!root || (!manifest && !args.includes("--uten-neo"))) {
    const { load, resolve, environment } = await import("./neo-config.mjs");
    const { found, data, errors } = load();
    root ??= found?.root ?? process.cwd();
    if (!manifest && !args.includes("--uten-neo")) {
      if (!data) {
        console.error(`${errors.join("\n")}\nUten config-fila vet ikke skriptet hvor Neo er. Bruk --manifest <fil> eller --uten-neo.`);
        process.exit(2);
      }
      const env = environment(data, arg("--miljo"));
      const url = resolve(data, "url", { keys: null, env }).value;
      if (!url) {
        console.error(`neo.byEnv.${env}.url mangler i .claude/neo.config.json, så manifestet kan ikke hentes. Bruk --manifest <fil> eller --uten-neo.`);
        process.exit(2);
      }
      try {
        manifest = await fetchManifest(url);
      } catch (e) {
        console.error(`Fikk ikke manifestet fra Neo (${env}): ${e.message}. Bruk --manifest <fil> eller --uten-neo.`);
        process.exit(2);
      }
    }
  }
  const result = collect(root, { manifest });
  const only = arg("--losning");
  const shown = only ? { ...result, files: result.files.filter((f) => f.eier === only) } : result;
  if (args.includes("--stier")) console.log(JSON.stringify(shown.files.map((f) => f.sti)));
  else if (args.includes("--json")) console.log(JSON.stringify({ ...shown, files: shown.files.map(({ doc, tekst, ...f }) => f) }, null, 2));
  else console.log(markdown(shown));
  for (const p of args.includes("--stier") ? result.problems : []) console.error(`✗ ${p.fil}: ${p.melding}`);
  process.exit(result.problems.length ? 1 : 0);
}
