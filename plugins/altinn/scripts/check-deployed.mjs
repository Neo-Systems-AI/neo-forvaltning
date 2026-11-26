#!/usr/bin/env node
// Er det som kjører i miljøet det samme som ligger i klonen?
//
// Studio henger etter miljøet: appen kan svare i tt02 flere minutter før
// *Publiser*-fanen sier at den er publisert, og en grønn status sier ikke hvilken
// commit som kjører. Dette skriptet spør miljøet selv, via endepunktene appen
// eksponerer uten innlogging, og sammenligner med den lokale app-roten:
// app-id, datatyper, sider per layout-sett og feltene i datamodellen.
//
// Bruk:  node check-deployed.mjs [app-rot] [--env tt02|prod] [--wait <sekunder>]
//   --wait  prøv på nytt til miljøet matcher klonen (for rett etter en publisering), maks N sekunder
// Exit:  0 = miljøet matcher klonen, 1 = avvik eller appen svarer ikke, 2 = feil bruk
//
// Leser bare. Avhengighetsfri: Node 18+.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const root = args.find((a, i) => !a.startsWith("--") && !["--env", "--wait"].includes(args[i - 1])) ?? process.cwd();
const env = flag("--env") ?? "tt02";
const waitSec = Number(flag("--wait") ?? 0);
if (!["tt02", "prod"].includes(env)) {
  console.error(`MANGLER: ukjent miljø «${env}» — bruk tt02 eller prod`);
  process.exit(2);
}

const app = join(root, "App");
const metaPath = join(app, "config", "applicationmetadata.json");
if (!existsSync(metaPath)) {
  console.error(`MANGLER: ${root} ser ikke ut som en app-rot (fant ikke App/config/applicationmetadata.json)`);
  process.exit(2);
}
const readJson = (p) => JSON.parse(readFileSync(p, "utf8").replace(/^﻿/, ""));
const local = readJson(metaPath);
const [org, name] = String(local.id).split("/");
if (!org || !name) {
  console.error(`MANGLER: applicationmetadata.id er «${local.id}», forventet <org>/<app>`);
  process.exit(2);
}
const base = env === "prod" ? `https://${org}.apps.altinn.no/${org}/${name}` : `https://${org}.apps.tt02.altinn.no/${org}/${name}`;
console.log(`Miljø: ${env} · ${base}`);

// Hvert forsøk samler linjene sine. Bare det siste forsøket skrives ut.
let lines = [];
let feil = 0;
const ok = (m) => lines.push(`[ OK ]  ${m}`);
const err = (m) => (feil++, lines.push(`[FEIL]  ${m}`));
const fatal = (m) => {
  console.log(`[FEIL]  ${m}`);
  process.exit(1);
};

const get = async (path) => {
  let res;
  try {
    res = await fetch(`${base}${path}`, { headers: { Accept: "application/json" } });
  } catch (e) {
    // Ingen vert for eieren = eieren er ikke en tjenesteeier med et miljø (f.eks. en personlig konto).
    if (e.cause?.code === "ENOTFOUND") {
      fatal(`vertsnavnet ${org}.apps.${env === "prod" ? "" : "tt02."}altinn.no finnes ikke — «${org}» er ikke en tjenesteeier med et ${env}-miljø. En app på en personlig konto kan ikke publiseres. Kopiér den til org-en først.`);
    }
    fatal(`nettverksfeil mot ${base}${path}: ${e.cause?.code ?? e.message}`);
  }
  if (!res.ok) return { status: res.status };
  let body = await res.json();
  // /api/layouts svarer med JSON serialisert som en streng når Accept er JSON.
  if (typeof body === "string") body = JSON.parse(body);
  return { status: res.status, body };
};

const attempt = async () => {
lines = [];
feil = 0;
const metaRes = await get("/api/v1/applicationmetadata");
if (metaRes.status !== 200) {
  err(`appen svarer ikke i ${env} (HTTP ${metaRes.status} på /api/v1/applicationmetadata) — er den publisert? Prøv --wait 300`);
  return;
}
const remote = metaRes.body;

if (remote.id === local.id) ok(`app-id ${remote.id}`);
else err(`app-id i miljøet er «${remote.id}», lokalt «${local.id}»`);

const ids = (m) => (m.dataTypes ?? []).map((d) => d.id).sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
if (same(ids(remote), ids(local))) ok(`datatyper: ${ids(remote).join(", ")}`);
else err(`datatyper i miljøet [${ids(remote).join(", ")}] ≠ lokalt [${ids(local).join(", ")}]`);
if (remote.title?.nb === local.title?.nb) ok(`tittel: ${remote.title?.nb}`);
else err(`tittel i miljøet «${remote.title?.nb}» ≠ lokalt «${local.title?.nb}»`);

// Layout-sett: v8 har layout-sets.json, v9 én mappe per oppgave.
const ui = join(app, "ui");
const sets = [];
if (existsSync(join(ui, "layout-sets.json"))) {
  for (const s of readJson(join(ui, "layout-sets.json")).sets ?? []) sets.push({ id: s.id, dataType: s.dataType });
} else if (existsSync(ui)) {
  for (const d of readdirSync(ui)) {
    if (!statSync(join(ui, d)).isDirectory() || !existsSync(join(ui, d, "layouts"))) continue;
    const dt = (local.dataTypes ?? []).find((t) => t.taskId === d && t.appLogic?.classRef);
    sets.push({ id: d, dataType: dt?.id });
  }
}
for (const set of sets) {
  const layoutsDir = join(ui, set.id, "layouts");
  const localPages = readdirSync(layoutsDir).filter((f) => f.endsWith(".json")).map((f) => basename(f, ".json")).sort();
  const r = await get(`/api/layouts/${set.id}`);
  if (r.status !== 200) {
    err(`layout-settet «${set.id}» svarer ikke (HTTP ${r.status})`);
    continue;
  }
  const remotePages = Object.keys(r.body).sort();
  if (same(remotePages, localPages)) ok(`sider i «${set.id}»: ${remotePages.join(", ")}`);
  else err(`sider i «${set.id}» i miljøet [${remotePages.join(", ")}] ≠ lokalt [${localPages.join(", ")}]`);
  // Komponent-id-er per side: fanger en endring som ikke er publisert, selv om sidene heter det samme.
  for (const p of localPages.filter((x) => remotePages.includes(x))) {
    const l = (readJson(join(layoutsDir, `${p}.json`)).data?.layout ?? []).map((c) => c.id).sort();
    const m = (r.body[p]?.data?.layout ?? []).map((c) => c.id).sort();
    if (!same(l, m)) err(`siden «${p}»: komponentene i miljøet avviker fra klonen — er siste commit publisert?`);
  }

  if (!set.dataType) continue;
  const js = await get(`/api/jsonschema/${set.dataType}`);
  const schemaPath = join(app, "models", `${set.dataType}.schema.json`);
  if (js.status !== 200) err(`datamodellen «${set.dataType}» svarer ikke (HTTP ${js.status})`);
  else if (existsSync(schemaPath)) {
    const top = (s) => Object.keys(s.properties ?? {}).sort();
    const a = top(js.body);
    const b = top(readJson(schemaPath));
    if (same(a, b)) ok(`datamodell «${set.dataType}»: ${a.join(", ")}`);
    else err(`datamodell «${set.dataType}» i miljøet [${a.join(", ")}] ≠ lokalt [${b.join(", ")}]`);
  }
}

};

// Med --wait: prøv på nytt til alt stemmer. En publisering ruller ut gradvis, og i
// et vindu svarer en gammel og en ny pod om hverandre (målt: nye sider, men gammel
// datamodell i ca. ett minutt). Et første 200-svar sier derfor ikke at versjonen er ute.
const started = Date.now();
let tries = 0;
for (;;) {
  tries++;
  await attempt();
  if (feil === 0 || Date.now() - started >= waitSec * 1000) break;
  await new Promise((r) => setTimeout(r, 15000));
}
for (const l of lines) console.log(l);
if (waitSec) console.log(`(${tries} forsøk over ${Math.round((Date.now() - started) / 1000)} s)`);

console.log("");
console.log("Ikke sjekket: at innsending virker. Det krever en innlogget testbruker og gjøres av et menneske.");
console.log(`STATUS: ${feil ? `AVVIK (${feil})` : "OK — miljøet matcher klonen"}`);
process.exit(feil ? 1 : 0);
