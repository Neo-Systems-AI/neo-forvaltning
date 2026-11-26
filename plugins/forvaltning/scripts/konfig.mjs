#!/usr/bin/env node
// Oppsettet i Neo som filer, kalt rett mot Neo sitt API med maskinklienten (`lib/neo-api.mjs`), uten at svarene går
// gjennom modellen. Neo gjør arbeidet: skriver filene, prøver hver fil i sandkassen, og skriver dem. Skriptet flytter
// svarene mellom Neo og repoet, og sier fra med exit-koden.
//
//   node konfig.mjs token                 virker maskinklienten? (scopene, aldri tokenet)
//   node konfig.mjs miljo                 integrasjonene og postboksene en flyt kan bindes til, med nøkkelen fila bruker
//   node konfig.mjs export                snapshot: oppsettet som filer i <snapshotDir>/<miljø>
//   node konfig.mjs plan                  planen for alle filene i <oppsettDir>, samlet: <reportsDir>/plan-<miljø>.md og .json
//   node konfig.mjs plan --fil <sti>      planen for én fil (stien under <oppsettDir>), med de andre filene, som JSON
//   node konfig.mjs apply                 gjennomfører den godkjente planen (<reportsDir>/plan-<miljø>.json), fil for fil
//
//   --miljo <miljø>   et miljø i neo.environments (standard: neo.defaultEnv). Plan og apply virker bare i en sandkasse.
//
// Exit: 0 ok · 1 Neo avviste noe, eller planen er ikke den som ble godkjent · 2 feil bruk eller config.
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, realpathSync } from "node:fs";
import { join, relative } from "node:path";

import { load, resolve } from "./lib/neo-config.mjs";
import { apiSettings, neoApi, neoToken, NeoApiError } from "./lib/neo-api.mjs";
import { write } from "./skriv-eksport.mjs";
import { differences, markdown, summary } from "./planrapport.mjs";

export class Usage extends Error {}

const dirOf = (data, key) => resolve(data, key).value;

/** Stiene til `.yaml`-filene under mappa, relative til den. */
export const yamlFiles = (root, dir = root) => {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...yamlFiles(root, p));
    else if (name.endsWith(".yaml")) out.push(relative(root, p));
  }
  return out;
};

const readFiles = (oppsettDir) =>
  yamlFiles(oppsettDir).map((path) => ({ path, text: readFileSync(join(oppsettDir, path), "utf8") }));

/**
 * Planen for alle filene i oppsettet, og det sandkassen har uten fil. Neo planlegger filene samlet (`plan-set`): i
 * rekkefølgen apply skriver dem, i én transaksjon som rulles tilbake, så en fil kan peke på et objekt en annen fil
 * lager. Svaret er i den rekkefølgen.
 */
export async function planAll(api, oppsettDir) {
  const files = readFiles(oppsettDir);
  const { files: plans } = await api.post("/api/config/plan-set", { files });
  const paths = plans.map((p) => p.path);
  const notInFiles = await api.post("/api/config/not-in-files", { paths });
  return { paths, plans, notInFiles, files };
}

/**
 * Gjennomføringen: planen på nytt, sjekket mot den godkjente, så apply per fil i planens rekkefølge, med hashen fra
 * planen. Den er hashen apply av fila gir når filene før den er skrevet. Stopper ved første avvisning; det som alt er
 * skrevet, står (hver fil er sin egen transaksjon). Et oppgavemal-sett med steg som venter på en sakstype, skrives én
 * gang til etter resten, med en ny plan for den fila.
 */
export async function applyApproved(api, oppsettDir, approved, { log = console.log } = {}) {
  const { plans, files } = await planAll(api, oppsettDir);
  const diffs = differences(approved, plans);
  if (diffs.length) return { ok: false, applied: [], reason: `Planen er ikke den som ble godkjent:\n${diffs.map((d) => `- ${d}`).join("\n")}` };
  const rejected = plans.filter((p) => p.action === "rejected");
  if (rejected.length) return { ok: false, applied: [], reason: `Avvist i planen:\n${rejected.map((p) => `- ${p.path}: ${p.reasons.join("; ")}`).join("\n")}` };

  const textOf = new Map(files.map((f) => [f.path, f.text]));
  const applied = [];
  const applyWith = async (path, planHash) => {
    const result = await api.post("/api/config/apply", { file: { path, text: textOf.get(path) }, planHash });
    applied.push({ path, action: result.action });
    log(`  ${result.action}: ${path}`);
    return result;
  };
  try {
    const deferred = [];
    for (const p of plans) {
      if (p.action !== "create" && p.action !== "update") continue;
      const result = await applyWith(p.path, p.planHash);
      if (result.deferredSteps) deferred.push(p.path);
    }
    // Stegene i et nytt sett venter på sakstypen som kobler det: nå er sakstypene skrevet, så settet planlegges på
    // nytt alene og skrives én gang til.
    for (const path of deferred) {
      const plan = await api.post("/api/config/plan", { file: { path, text: textOf.get(path) } });
      if (plan.action === "unchanged") continue;
      if (plan.action === "rejected") throw new Error(`${path}: ${plan.reasons.join("; ")}`);
      await applyWith(path, plan.planHash);
    }
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
  let data;
  try {
    ({ data } = load());
  } catch (e) {
    throw new Usage(e.message);
  }
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
    // Hele settet, så fila kan peke på det de andre filene lager; svaret er bare denne fila sitt.
    const { files: plans } = await api.post("/api/config/plan-set", { files: readFiles(oppsettDir) });
    const plan = plans.find((p) => p.path === fil);
    if (!plan) throw new Usage(`Fant ikke ${fil} under ${oppsettDir}.`);
    log(JSON.stringify(plan, null, 2));
    return plan.action === "rejected" ? 1 : 0;
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

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(e.message);
      process.exit(e instanceof Usage ? 2 : 1);
    },
  );
}
