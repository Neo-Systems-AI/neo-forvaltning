#!/usr/bin/env node
// Kryss-sjekk av en Altinn Studio-app FØR commit og publisering.
//
// Digdirs skills viser til verktøy som bare finnes i deres egen agent-løkke
// (verify_changes, altinn_datamodel_sync). Dette skriptet dekker det de sjekker
// og som kan avgjøres fra filene alene: at identifikatorene som binder filene
// sammen (sider, komponenter, datafelt, tekstnøkler, datatyper, kodelister)
// peker på noe som finnes, og at de tre modellfilene har de samme feltene.
//
// Det validerer IKKE mot Altinns JSON-skjemaer (egenskaper per komponent) —
// det gjør Studio når appen åpnes der. Det sier det i outputen.
//
// Bruk:  node check-app.mjs [app-rot]      (default: arbeidsmappa)
// Exit:  0 = ingen FEIL (advarsler kan finnes), 1 = FEIL, 2 = ikke en app-rot
//
// Avhengighetsfri: bare Node 18+.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const root = process.argv[2] ?? process.cwd();
const app = join(root, "App");
if (!existsSync(join(app, "config", "applicationmetadata.json"))) {
  console.error(`MANGLER: ${root} ser ikke ut som en app-rot (fant ikke App/config/applicationmetadata.json)`);
  process.exit(2);
}

let feil = 0;
let adv = 0;
const ok = (m) => console.log(`[ OK ]  ${m}`);
const err = (m) => (feil++, console.log(`[FEIL]  ${m}`));
const warn = (m) => (adv++, console.log(`[ADV ]  ${m}`));

const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8").replace(/^﻿/, ""));
  } catch (e) {
    err(`${p.slice(root.length + 1)}: ugyldig JSON (${e.message})`);
    return undefined;
  }
};
const rel = (p) => p.slice(root.length + 1);
// «a[0].b» og «a[{0}].b» er samme felt som «a.b».
const norm = (path) => String(path).replace(/\[[^\]]*\]/g, "");

// ── Versjon ────────────────────────────────────────────────────────────────
const csproj = existsSync(join(app, "App.csproj")) ? readFileSync(join(app, "App.csproj"), "utf8") : "";
const coreVersion = csproj.match(/Altinn\.App\.Core"\s+Version="([^"]+)"/)?.[1];
const major = coreVersion ? Number(coreVersion.split(".")[0]) : undefined;
console.log(`App: ${rel(app) || "App"} · Altinn.App.Core ${coreVersion ?? "ukjent"} (v${major ?? "?"})`);

// ── Metadata ───────────────────────────────────────────────────────────────
const meta = readJson(join(app, "config", "applicationmetadata.json"));
if (!meta) process.exit(1);
const dataTypeIds = new Set((meta.dataTypes ?? []).map((d) => d.id));
for (const lang of ["nb", "nn", "en"]) {
  if (!meta.title?.[lang]) warn(`applicationmetadata: title.${lang} mangler`);
  if (!meta.description?.[lang]) warn(`applicationmetadata: description.${lang} mangler`);
}
if (!Array.isArray(meta.contactPoints) || meta.contactPoints.length === 0) warn("applicationmetadata: contactPoints mangler");
if (!dataTypeIds.has("ref-data-as-pdf")) warn("applicationmetadata: datatypen ref-data-as-pdf mangler (ingen PDF av skjemaet)");
try {
  const remote = execFileSync("git", ["-C", root, "remote", "get-url", "origin"], { encoding: "utf8" }).trim();
  const m = remote.match(/\/repos\/([^/]+)\/([^/.]+)(\.git)?$/);
  if (m && meta.id !== `${m[1]}/${m[2]}`) err(`applicationmetadata.id er «${meta.id}», men repoet er ${m[1]}/${m[2]}`);
  else if (m) ok(`app-id ${meta.id} stemmer med repoet`);
} catch {
  warn("fant ikke git-remote — app-id er ikke sjekket mot repoet");
}

// ── Hendelser ──────────────────────────────────────────────────────────────
// En ny app fra Studio har RegisterEventsWithEventsComponent = false. Da sender
// appen INGEN hendelser (ikke engang app.instance.created), og et fagsystem som
// abonnerer, får aldri vite at noe er sendt inn — uten feil noe sted. Målt på
// ddlabs/uttalelse 2026-09-29: events-API-et var tomt, abonnementet var gyldig.
// Miljøfilene (appsettings.<Miljø>.json) kan overstyre, så de leses også.
{
  const settingsFiles = readdirSync(app).filter((f) => /^appsettings(\.[A-Za-z]+)?\.json$/.test(f));
  const values = [];
  for (const f of settingsFiles) {
    const j = readJson(join(app, f));
    const v = j?.AppSettings?.RegisterEventsWithEventsComponent;
    if (v !== undefined) values.push(`${f}: ${v}`);
  }
  const base = readJson(join(app, "appsettings.json"))?.AppSettings?.RegisterEventsWithEventsComponent;
  const overrides = values.filter((v) => !v.startsWith("appsettings.json:"));
  if (base === true && !overrides.some((v) => v.endsWith("false"))) ok("hendelser er på (RegisterEventsWithEventsComponent = true)");
  else
    warn(
      `hendelser er AV eller overstyrt (${values.join(", ") || "ikke satt"}). Appen sender da ingen hendelser, heller ikke app.instance.process.completed. Skal et fagsystem abonnere, må AppSettings.RegisterEventsWithEventsComponent være true`,
    );
}

// ── Datamodeller ───────────────────────────────────────────────────────────
// Stier (a.b.c) fra JSON-skjemaet, med $ref mot $defs og arrays (items).
const schemaPaths = (schema) => {
  const defs = schema.$defs ?? schema.definitions ?? {};
  const out = new Set();
  const walk = (node, prefix, depth) => {
    if (!node || depth > 20) return;
    if (node.$ref) node = defs[node.$ref.split("/").pop()] ?? {};
    if (node.type === "array" && node.items) return walk(node.items, prefix, depth + 1);
    for (const one of node.oneOf ?? node.allOf ?? []) walk(one, prefix, depth + 1);
    for (const [k, v] of Object.entries(node.properties ?? {})) {
      const p = prefix ? `${prefix}.${k}` : k;
      out.add(p);
      walk(v, p, depth + 1);
    }
  };
  walk(schema, "", 0);
  return out;
};
const models = new Map(); // dataType-id → Set(stier)
const modelsDir = join(app, "models");
for (const f of existsSync(modelsDir) ? readdirSync(modelsDir) : []) {
  if (!f.endsWith(".schema.json")) continue;
  const name = f.replace(/\.schema\.json$/, "");
  const schema = readJson(join(modelsDir, f));
  if (!schema) continue;
  const paths = schemaPaths(schema);
  models.set(name, paths);
  const leaf = new Set([...paths].map((p) => p.split(".").pop()));
  const xsdPath = join(modelsDir, `${name}.xsd`);
  const csPath = join(modelsDir, `${name}.cs`);
  if (!existsSync(xsdPath) || !existsSync(csPath)) {
    err(`models/${name}: ${!existsSync(xsdPath) ? ".xsd" : ".cs"} mangler — de tre filene er ett sett`);
    continue;
  }
  const xsd = new Set([...readFileSync(xsdPath, "utf8").matchAll(/<(?:xs|xsd):element[^>]*\bname="([^"]+)"/g)].map((m) => m[1]));
  const cs = new Set([...readFileSync(csPath, "utf8").matchAll(/\[JsonPropertyName\("([^"]+)"\)\]/g)].map((m) => m[1]));
  xsd.delete(schema["@xsdRootElement"] ?? name);
  cs.delete("altinnRowId"); // Altinn legger den på rader i lister selv
  const diff = (a, b) => [...a].filter((x) => !b.has(x));
  // Felt i $defs som ingen sti når fram til (ubrukte typer), er ikke avvik: XSD-en
  // tar dem ofte med, C#-en sjelden. Bare felt som verken er nåbare eller definert, er feil.
  const defs = schema.$defs ?? schema.definitions ?? {};
  const defined = new Set(Object.values(defs).flatMap((d) => Object.keys(d?.properties ?? {})));
  const extra = (s) => diff(s, leaf).filter((x) => !defined.has(x));
  const problems = [
    ...diff(leaf, xsd).map((x) => `«${x}» mangler i .xsd`),
    ...diff(leaf, cs).map((x) => `«${x}» mangler i .cs`),
    ...extra(xsd).map((x) => `«${x}» finnes i .xsd, ikke i .schema.json`),
    ...extra(cs).map((x) => `«${x}» finnes i .cs, ikke i .schema.json`),
  ];
  const unused = [...new Set([...diff(xsd, leaf), ...diff(cs, leaf)])].filter((x) => defined.has(x));
  if (unused.length) warn(`models/${name}: ${unused.length} felt ligger i typer ingen del av modellen bruker (${unused.slice(0, 4).join(", ")}${unused.length > 4 ? " …" : ""})`);
  if (problems.length) problems.forEach((p) => err(`models/${name}: ${p}`));
  else ok(`models/${name}: .schema.json, .xsd og .cs har de samme ${leaf.size} feltnavnene`);
  if (!dataTypeIds.has(name)) warn(`models/${name}: ingen datatype med id «${name}» i applicationmetadata`);
}
if (models.size === 0) err("fant ingen datamodell under App/models (*.schema.json)");

// ── Tekster ────────────────────────────────────────────────────────────────
const textsDir = join(app, "config", "texts");
const texts = new Map(); // språk → Map(id → ressurs)
for (const f of existsSync(textsDir) ? readdirSync(textsDir) : []) {
  const m = f.match(/^resource\.([a-z]{2})\.json$/);
  if (!m) continue;
  const res = readJson(join(textsDir, f));
  if (res) texts.set(m[1], new Map((res.resources ?? []).map((r) => [r.id, r])));
}
if (!texts.size) err("fant ingen tekstfiler (App/config/texts/resource.<språk>.json)");
const allKeys = new Set([...texts.values()].flatMap((m) => [...m.keys()]));
for (const [lang, m] of texts) {
  const missing = [...allKeys].filter((k) => !m.has(k));
  if (missing.length) warn(`resource.${lang}.json mangler ${missing.length} nøkler som finnes i andre språk: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? " …" : ""}`);
}
const hasText = (key) => allKeys.has(key);

// ── Layout-sett ────────────────────────────────────────────────────────────
const ui = join(app, "ui");
const sets = []; // { id, dir, dataType }
const layoutSets = existsSync(join(ui, "layout-sets.json")) ? readJson(join(ui, "layout-sets.json")) : undefined;
if (layoutSets?.sets) {
  for (const s of layoutSets.sets) sets.push({ id: s.id, dir: join(ui, s.id), dataType: s.dataType });
} else if (existsSync(ui)) {
  // v9: én mappe per oppgave, med datatypen fra applicationmetadata (taskId).
  for (const d of readdirSync(ui)) {
    if (!statSync(join(ui, d)).isDirectory() || !existsSync(join(ui, d, "layouts"))) continue;
    const dt = (meta.dataTypes ?? []).find((t) => t.taskId === d && t.appLogic?.classRef);
    sets.push({ id: d, dir: join(ui, d), dataType: dt?.id });
  }
}
if (!sets.length) err("fant ingen layout-sett under App/ui");

const optionsDir = join(app, "options");
const dataModelRefs = (node, out = []) => {
  if (Array.isArray(node)) {
    if (node[0] === "dataModel" && typeof node[1] === "string") out.push(node[1]);
    node.forEach((n) => dataModelRefs(n, out));
  } else if (node && typeof node === "object") Object.values(node).forEach((v) => dataModelRefs(v, out));
  return out;
};

for (const set of sets) {
  const tag = `ui/${set.id}`;
  const paths = models.get(set.dataType);
  if (!paths) err(`${tag}: datamodellen «${set.dataType}» finnes ikke under App/models`);
  const settings = existsSync(join(set.dir, "Settings.json")) ? readJson(join(set.dir, "Settings.json")) : undefined;
  // Sidelisten er enten flat (pages.order) eller gruppert (pages.groups[].order).
  const order = settings?.pages?.order ?? (settings?.pages?.groups ?? []).flatMap((g) => g.order ?? []);
  const layoutsDir = join(set.dir, "layouts");
  const pages = existsSync(layoutsDir) ? readdirSync(layoutsDir).filter((f) => f.endsWith(".json")).map((f) => basename(f, ".json")) : [];
  if (!order.length) err(`${tag}/Settings.json: pages.order (eller pages.groups[].order) er tom eller mangler`);
  for (const p of order) if (!pages.includes(p)) err(`${tag}: siden «${p}» står i pages.order, men layouts/${p}.json finnes ikke`);
  for (const p of pages) if (!order.includes(p)) warn(`${tag}: layouts/${p}.json står ikke i pages.order og vises ikke`);

  const ids = new Map();
  let bindings = 0;
  let textRefs = 0;
  for (const page of pages) {
    const layout = readJson(join(layoutsDir, `${page}.json`));
    const comps = layout?.data?.layout ?? [];
    const at = `${tag}/layouts/${page}`;
    if (order.length > 1 && order.includes(page) && !comps.some((c) => c.type === "NavigationButtons"))
      err(`${at}: siden mangler NavigationButtons — brukeren kommer seg ikke videre`);
    const compIds = new Set(comps.map((c) => c.id));
    for (const c of comps) {
      if (ids.has(c.id)) err(`${at}: komponent-id «${c.id}» er brukt to ganger (også i ${ids.get(c.id)})`);
      ids.set(c.id, page);
      for (const child of c.children ?? []) {
        const childId = typeof child === "string" ? child.replace(/^\d+:/, "") : undefined;
        if (childId && !compIds.has(childId)) err(`${at}: «${c.id}» har barnet «${childId}», som ikke finnes på siden`);
      }
      for (const [k, v] of Object.entries(c.dataModelBindings ?? {})) {
        const field = typeof v === "string" ? v : v?.field;
        bindings++;
        if (paths && field && !paths.has(norm(field))) err(`${at}: «${c.id}».${k} binder til «${field}», som ikke finnes i datamodellen`);
      }
      for (const ref of dataModelRefs(c)) if (paths && !paths.has(norm(ref))) err(`${at}: «${c.id}» har et uttrykk mot «${ref}», som ikke finnes i datamodellen`);
      for (const [k, v] of Object.entries(c.textResourceBindings ?? {})) {
        if (typeof v !== "string") continue; // uttrykk — nøklene i dem sjekkes ikke
        textRefs++;
        if (!hasText(v)) err(`${at}: «${c.id}».${k} viser til tekstnøkkelen «${v}», som ikke finnes (vises som rå nøkkel)`);
      }
      for (const o of c.options ?? []) if (typeof o.label === "string" && !hasText(o.label)) err(`${at}: «${c.id}» har et valg med tekstnøkkelen «${o.label}», som ikke finnes`);
      if (c.optionsId && !existsSync(join(optionsDir, `${c.optionsId}.json`)))
        warn(`${at}: «${c.id}» bruker kodelisten «${c.optionsId}», men App/options/${c.optionsId}.json finnes ikke (kan være dynamisk fra C#)`);
      if ((c.type === "FileUpload" || c.type === "FileUploadWithTag") && !dataTypeIds.has(c.id))
        err(`${at}: vedleggskomponenten «${c.id}» har ingen datatype med samme id i applicationmetadata`);
    }
  }
  if (paths) ok(`${tag}: ${pages.length} sider, ${ids.size} komponenter, ${bindings} bindinger og ${textRefs} tekstnøkler sjekket`);
}

// Tekstvariabler som leser fra datamodellen.
for (const [lang, m] of texts) {
  for (const r of m.values()) {
    for (const v of r.variables ?? []) {
      const dt = String(v.dataSource ?? "").replace(/^dataModel\./, "");
      const paths = models.get(dt === "default" ? sets[0]?.dataType : dt);
      if (!paths) warn(`resource.${lang}.json: «${r.id}» leser fra «${v.dataSource}», som ikke er en kjent datamodell`);
      else if (!paths.has(norm(v.key))) err(`resource.${lang}.json: «${r.id}» leser «${v.key}», som ikke finnes i datamodellen`);
    }
  }
}

// ── Hemmeligheter ──────────────────────────────────────────────────────────
// Alt i en delt org kan leses av alle. Grov sjekk, ikke en garanti.
const suspicious = [];
const scan = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (["bin", "obj", "node_modules", ".git"].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) scan(p);
    else if (/\.(json|cs|xml|config|pem|key|txt|md|cshtml)$/i.test(e.name) && statSync(p).size < 2_000_000) {
      const s = readFileSync(p, "utf8");
      if (/-----BEGIN [A-Z ]*PRIVATE KEY-----|"(client_?secret|password|apiKey|api_key|token)"\s*:\s*"[^"]{8,}"/i.test(s)) suspicious.push(rel(p));
    }
  }
};
scan(app);
if (suspicious.length) err(`mulig hemmelighet i: ${suspicious.join(", ")} — alt i en delt org kan leses av alle`);
else ok("ingen åpenbare hemmeligheter (nøkler, passord, tokens) i App/");

console.log("");
console.log("Ikke sjekket: egenskaper per komponent mot Altinns JSON-skjemaer. Studio validerer det når appen åpnes der.");
console.log(`STATUS: ${feil ? `FEIL (${feil})` : "OK"} · advarsler: ${adv}`);
process.exit(feil ? 1 : 0);
