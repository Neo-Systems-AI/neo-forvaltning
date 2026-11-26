// Konfigfilene i oppsett/, i felles/ og i hver løsning: Neos format, uendret. Formen sjekkes mot skjemaet Neo
// serverer (GET <neo.url>/api/config/schema), og samme objekt to steder er rødt, med nøkkelen fra manifestet. Stien en
// fil skal ha, avgjør Neo i planen; her er ingen kopi av regelen for filnavnet. Skjemaet hentes og kopieres aldri, og
// når det ikke kan hentes, er det rødt med adressen og feilen. Uten konfigfiler kalles ikke Neo.
import Ajv from "ajv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { filesIn, isMap } from "./les.mjs";
import { parseYaml } from "./yaml.mjs";

export const CHECKS = [
  { name: "oppsett", about: "Hver fil i oppsett/ er Neos format, gyldig mot skjemaet fra Neo, i mappa for typen, og samme objekt står ett sted" },
  { name: "brukt", about: "Hver fil i oppsett/ er det et krav ble (blir)" },
];

const IGNORED = new Set(["README.md", ".gitkeep"]);

// Filene, lest. Stien Neo får, er stien under oppsett/. En fil som ikke kan leses, er rød.
export function readConfigFiles(root, places) {
  const files = [];
  const findings = [];
  for (const place of places) {
    const base = `${place.dir}/oppsett/`;
    for (const fil of filesIn(root, `${place.dir}/oppsett`)) {
      const sti = fil.slice(base.length);
      if (IGNORED.has(sti.split("/").pop())) continue;
      const at = { check: "oppsett", file: fil };
      if (sti.split("/").length !== 2 || !sti.endsWith(".yaml")) {
        findings.push({ ...at, message: sti.endsWith(".yml") ? "Neo leser bare .yaml. Gi fila endelsen .yaml" : "En konfigfil er <mappa for typen>/<navn>.yaml under oppsett/" });
        continue;
      }
      let doc;
      try {
        doc = parseYaml(readFileSync(join(root, fil), "utf8"));
      } catch (e) {
        findings.push({ ...at, message: `Kan ikke leses som YAML (${e.message})` });
        continue;
      }
      if (!isMap(doc) || !doc.kind || !isMap(doc.spec)) {
        findings.push({ ...at, message: "Fila er ikke i Neos format: den mangler kind eller spec" });
        continue;
      }
      files.push({ fil, sti, place, kind: doc.kind, doc });
    }
  }
  return { files, findings };
}

const defaultFetchJson = (url) => fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20000) }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))));

export async function fetchManifest(url, fetchJson = defaultFetchJson) {
  const schemaUrl = `${url}/api/config/schema`;
  const manifest = await fetchJson(schemaUrl);
  if (!Array.isArray(manifest?.kinds)) throw new Error("svaret er ikke manifestet for konfig som fil (kinds mangler)");
  return manifest;
}

// Formen mot skjemaet, mappa for typen, og samme objekt to steder. Gir filene i rekkefølgen Neo skriver dem i.
export async function checkConfigFiles(root, places, { url, fetchJson = defaultFetchJson } = {}) {
  const { files, findings: f } = readConfigFiles(root, places);
  if (!files.length && !f.length) return { findings: f, files };
  const where = `${files.length + f.length} fil${files.length + f.length === 1 ? "" : "er"} i oppsett/ er ikke validert`;
  if (!url) return { findings: [...f, { check: "oppsett", file: ".claude/neo.config.json", message: `neo.url mangler, så skjemaet fra Neo kan ikke hentes: ${where}` }], files };
  let manifest;
  try {
    manifest = await fetchManifest(url, fetchJson);
  } catch (e) {
    return { findings: [...f, { check: "oppsett", file: ".claude/neo.config.json", message: `Fikk ikke hentet skjemaet fra ${url}/api/config/schema (${e.message}), så ${where}` }], files };
  }
  const byDir = new Map(manifest.kinds.map((k) => [k.directory, k]));
  const byKind = new Map(manifest.kinds.map((k) => [k.kind, k]));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validators = new Map();
  const validator = (k) => {
    if (!validators.has(k.kind)) validators.set(k.kind, fetchJson(k.schema).then((s) => ajv.compile(s)));
    return validators.get(k.kind);
  };
  const ok = [];
  for (const x of files) {
    const at = { check: "oppsett", file: x.fil };
    const dir = x.sti.split("/")[0];
    const k = byDir.get(dir);
    if (!k) {
      f.push({ ...at, message: `${dir}/ er ikke en mappe for en type i Neo. Mappene: ${[...byDir.keys()].join(", ")}` });
      continue;
    }
    if (x.kind !== k.kind) {
      f.push({ ...at, message: `Fila er ${x.kind}, men ligger i mappa for ${k.kind}${byKind.has(x.kind) ? `. Flytt den til ${byKind.get(x.kind).directory}/` : ""}` });
      continue;
    }
    let validate;
    try {
      validate = await validator(k);
    } catch (e) {
      f.push({ ...at, message: `Fikk ikke hentet skjemaet for ${k.kind} (${k.schema}: ${e.message}), så fila er ikke validert` });
      continue;
    }
    if (!validate(x.doc)) {
      for (const err of validate.errors.slice(0, 10)) f.push({ ...at, message: `${err.instancePath || "/"} ${err.message}${err.params?.additionalProperty ? ` (${err.params.additionalProperty})` : ""}` });
      continue;
    }
    ok.push({ ...x, nokkel: k.keyFields.map((n) => x.doc.spec?.[n]).join("/") });
  }

  // Samme objekt to steder: samme type og samme nøkkel etter manifestet. Neo har ett objekt per nøkkel, så de ville
  // skrevet over hverandre.
  const byKey = new Map();
  for (const x of ok) byKey.set(`${x.kind}\u0000${x.nokkel}`, [...(byKey.get(`${x.kind}\u0000${x.nokkel}`) ?? []), x]);
  for (const xs of byKey.values()) {
    if (xs.length < 2) continue;
    for (const x of xs) f.push({ check: "oppsett", file: x.fil, message: `Samme objekt (${x.kind} «${x.nokkel}») står også i ${xs.filter((y) => y !== x).map((y) => y.fil).join(", ")}. Et objekt står ett sted: i felles/oppsett/ når flere løsninger bruker det` });
  }

  const order = manifest.applyOrder ?? [];
  const rank = (x) => (order.includes(x.kind) ? order.indexOf(x.kind) : order.length);
  ok.sort((a, b) => rank(a) - rank(b) || a.sti.localeCompare(b.sti));
  return { findings: f, files: ok, manifest };
}

// En fil i oppsett/ som ingen krav har som blir, er gul: en fil uten krav bak seg lages ikke.
export function checkUsed(files, used) {
  return files.filter((x) => !used.has(x.fil)).map((x) => ({ check: "brukt", level: "warn", file: x.fil, message: "Ingen krav har denne fila som blir. En fil uten krav bak seg lages ikke" }));
}
