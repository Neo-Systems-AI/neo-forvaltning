#!/usr/bin/env node
// Oppsettet i Neo som filer, kalt rett mot Neo sitt API med maskinklienten (`lib/neo-api.mjs`), uten at svarene går
// gjennom modellen. Neo gjør arbeidet: skriver filene, prøver hver fil i sandkassen, og skriver dem. Skriptet flytter
// svarene mellom Neo og repoet, og sier fra med exit-koden.
//
//   node konfig.mjs token                 virker maskinklienten? (scopene, aldri tokenet)
//   node konfig.mjs miljo                 integrasjonene og postboksene en flyt kan bindes til, med nøkkelen fila bruker
//   node konfig.mjs export                snapshot: oppsettet som filer i <snapshotDir>/<miljø>
//   node konfig.mjs plan                  planen for alle filene i <oppsettDir>: <reportsDir>/plan-<miljø>.md og .json
//   node konfig.mjs plan --fil <sti>      planen for én fil (stien under <oppsettDir>), som JSON
//   node konfig.mjs apply                 gjennomfører den godkjente planen (<reportsDir>/plan-<miljø>.json), fil for fil
//
//   --miljo <miljø>   et miljø i neo.environments (standard: neo.defaultEnv). Plan og apply virker bare i en sandkasse.
//
// Exit: 0 ok · 1 Neo avviste noe, eller planen er ikke den som ble godkjent · 2 feil bruk eller config.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { load, resolve } from "./lib/neo-config.mjs";
import { loadEnvLocal } from "./lib/hemmeligheter.mjs";
import { apiSettings, neoApi, neoToken, NeoApiError } from "./lib/neo-api.mjs";
import { write } from "./skriv-eksport.mjs";
import { loadManifest, order, yamlFiles } from "./rekkefolge.mjs";
import { differences, markdown, summary } from "./planrapport.mjs";

export class Usage extends Error {}

const dirOf = (data, key) => resolve(data, key).value;

/** Planen for hver fil i oppsettet, i rekkefølgen Neo må ha dem, og det sandkassen har uten fil. */
export async function planAll(api, oppsettDir, { manifest } = {}) {
  manifest ??= await loadManifest(api.settings.url);
  const paths = order(yamlFiles(oppsettDir), manifest);
  const plans = [];
  for (const path of paths) {
    plans.push(await api.post("/api/config/plan", { file: { path, text: readFileSync(join(oppsettDir, path), "utf8") } }));
  }
  const notInFiles = await api.post("/api/config/not-in-files", { paths });
  return { paths, plans, notInFiles };
}

/**
 * Gjennomføringen: planen på nytt, sjekket mot den godkjente, så apply per fil i rekkefølgen. Stopper ved første
 * avvisning; det som alt er skrevet, står (hver fil er sin egen transaksjon). Et oppgavemal-sett med steg som venter
 * på en sakstype, skrives én gang til etter resten.
 */
export async function applyApproved(api, oppsettDir, approved, { log = console.log, manifest } = {}) {
  const { plans } = await planAll(api, oppsettDir, { manifest });
  const diffs = differences(approved, plans);
  if (diffs.length) return { ok: false, applied: [], reason: `Planen er ikke den som ble godkjent:\n${diffs.map((d) => `- ${d}`).join("\n")}` };
  const rejected = plans.filter((p) => p.action === "rejected");
  if (rejected.length) return { ok: false, applied: [], reason: `Avvist i planen:\n${rejected.map((p) => `- ${p.path}: ${p.reasons.join("; ")}`).join("\n")}` };

  const applied = [];
  const applyOne = async (path) => {
    const text = readFileSync(join(oppsettDir, path), "utf8");
    const plan = await api.post("/api/config/plan", { file: { path, text } });
    if (plan.action === "unchanged") return null;
    if (plan.action === "rejected") throw new Error(`${path}: ${plan.reasons.join("; ")}`);
    const result = await api.post("/api/config/apply", { file: { path, text }, planHash: plan.planHash });
    applied.push({ path, action: result.action });
    log(`  ${result.action}: ${path}`);
    return result;
  };
  try {
    const deferred = [];
    for (const p of plans) {
      if (p.action !== "create" && p.action !== "update") continue;
      const result = await applyOne(p.path);
      if (result?.deferredSteps) deferred.push(p.path);
    }
    // Stegene i et nytt sett venter på sakstypen som kobler det: nå er sakstypene skrevet.
    for (const path of deferred) await applyOne(path);
  } catch (e) {
    const why = e instanceof NeoApiError && e.status === 409 ? `${e.message}\nNoe er endret i sandkassen siden planen. Lag planen på nytt.` : e.message;
    return { ok: false, applied, reason: why };
  }
  return { ok: true, applied };
}

const parse = (argv) => {
  const [command, ...rest] = argv;
  const opt = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : undefined);
  return { command, miljo: opt("--miljo"), fil: opt("--fil") };
};

export async function main(argv, { log = console.log, err = console.error } = {}) {
  const { command, miljo, fil } = parse(argv);
  if (!["token", "miljo", "export", "plan", "apply"].includes(command)) throw new Usage("Bruk: node konfig.mjs token | miljo | export | plan [--fil <sti>] | apply  [--miljo <miljø>]");
  loadEnvLocal();
  const { data, errors } = load();
  if (!data) throw new Usage(errors.join("\n"));
  const s = apiSettings(data, miljo);
  const api = neoApi(s);
  log(`Miljø: ${s.miljo} (${s.url})`);

  if (command === "token") {
    const t = await neoToken(s);
    log(`Maskinklienten ${s.clientId} fikk et token${t.expiresIn ? ` som varer ${t.expiresIn} s` : ""}.`);
    log(`Scopene: ${t.scope || "(Neo oppga ingen; klienten har scopene admin ga den)"}`);
    return 0;
  }
  if (command === "miljo") {
    log(JSON.stringify(await api.get("/api/config/environment"), null, 2));
    return 0;
  }
  if (command === "export") {
    const out = join(dirOf(data, "snapshotDir"), s.miljo);
    const r = write(await api.get("/api/config/export"), out);
    log(`${out}: nye ${r.nye.length}, endret ${r.endret.length}, uendret ${r.uendret.length}, fjernet ${r.fjernet.length}`);
    for (const [what, list] of [["ny", r.nye], ["endret", r.endret], ["fjernet", r.fjernet]]) for (const p of list) log(`  ${what}: ${p}`);
    return 0;
  }

  const oppsettDir = dirOf(data, "oppsettDir");
  const reports = dirOf(data, "reportsDir");
  const planJson = join(reports, `plan-${s.miljo}.json`);
  if (command === "plan" && fil) {
    log(JSON.stringify(await api.post("/api/config/plan", { file: { path: fil, text: readFileSync(join(oppsettDir, fil), "utf8") } }), null, 2));
    return 0;
  }
  if (command === "plan") {
    const { plans, notInFiles } = await planAll(api, oppsettDir);
    mkdirSync(reports, { recursive: true });
    writeFileSync(join(reports, `plan-${s.miljo}.md`), markdown({ plans, notInFiles }));
    writeFileSync(planJson, `${JSON.stringify(summary(plans), null, 2)}\n`);
    const count = (a) => plans.filter((p) => p.action === a).length;
    log(`Planen: ${count("create")} nye, ${count("update")} endret, ${count("unchanged")} uendret, ${count("rejected")} avvist. Skrevet til ${reports}/plan-${s.miljo}.md og .json`);
    for (const p of plans.filter((x) => x.action === "rejected")) err(`  avvist: ${p.path}: ${p.reasons.join("; ")}`);
    return count("rejected") ? 1 : 0;
  }
  // apply
  if (!existsSync(planJson)) throw new Usage(`Fant ikke den godkjente planen (${planJson}). Lag den med «node konfig.mjs plan» og få PR-en godkjent først.`);
  const result = await applyApproved(api, oppsettDir, JSON.parse(readFileSync(planJson, "utf8")), { log });
  log(`Skrevet: ${result.applied.length} fil(er).`);
  if (!result.ok) {
    err(result.reason);
    return 1;
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(e.message);
      process.exit(e instanceof Usage ? 2 : 1);
    },
  );
}
