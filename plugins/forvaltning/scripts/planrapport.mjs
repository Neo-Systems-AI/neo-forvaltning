#!/usr/bin/env node
// Planen til PR-en, satt sammen av svarene fra Neo: `plan_config` for hver fil og `config_not_in_files` for det repoet
// ikke styrer. Skriptet vurderer ingenting selv: hva som endres, og om det går, er Neo sitt svar.
//
//   node planrapport.mjs <rå-mappe> --md <plan.md> --json <plan.json>
//   node planrapport.mjs <rå-mappe> --sjekk <godkjent plan.json>
//
// Rå-mappa har ett svar per fil fra `plan_config` (`<sti med / byttet med __>.json`) og eventuelt
// `ikke-styrt.json` fra `config_not_in_files`. Med `--sjekk` sammenlignes de nye svarene med planen som ble godkjent:
// samme handling og samme endringer for hver fil, ellers exit 1 med forskjellen.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unwrap } from "./skriv-eksport.mjs";

export const IKKE_STYRT = "ikke-styrt.json";
export const rawName = (path) => `${path.replaceAll("/", "__")}.json`;

export function load(dir) {
  const plans = [];
  let notInFiles = null;
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".json")) continue;
    const svar = unwrap(JSON.parse(readFileSync(join(dir, name), "utf8")));
    if (name === IKKE_STYRT) notInFiles = svar;
    else plans.push(svar);
  }
  return { plans, notInFiles };
}

// Det som godkjennes: per fil handlingen og endringene. `planHash` er med, men sammenlignes ikke: den endres når
// sandkassen endres, også når planen er den samme.
export const summary = (plans) =>
  plans.map((p) => ({
    path: p.path,
    action: p.action,
    changes: p.changes ?? [],
    notRemoved: p.notRemoved ?? [],
    deferredSteps: p.deferredSteps ?? false,
    reasons: p.reasons ?? [],
    planHash: p.planHash ?? null,
  }));

const show = (v) => {
  const s = v === undefined ? "–" : JSON.stringify(v);
  return (s.length > 60 ? `${s.slice(0, 57)}…` : s).replaceAll("|", "\\|");
};

export function markdown({ plans, notInFiles }) {
  const s = summary(plans);
  const count = (a) => s.filter((p) => p.action === a).length;
  const out = [
    "# Planen mot sandkassen",
    "",
    `Neo har prøvd hver fil uten å lagre: ${count("create")} nye, ${count("update")} endret, ${count("unchanged")} uendret, ${count("rejected")} avvist.`,
    "",
  ];
  const rejected = s.filter((p) => p.action === "rejected");
  if (rejected.length) {
    out.push("## Avvist", "", "Disse kan ikke gjennomføres før de er rettet.", "");
    for (const p of rejected) out.push(`- \`${p.path}\`: ${p.reasons.join("; ")}`);
    out.push("");
  }
  const changed = s.filter((p) => p.action === "create" || p.action === "update");
  if (changed.length) {
    out.push("## Endringene", "");
    for (const p of changed) {
      out.push(`### \`${p.path}\` (${p.action === "create" ? "ny" : "endret"})`, "");
      if (p.changes.length) {
        out.push("| Felt | Før | Etter |", "|---|---|---|");
        for (const c of p.changes) out.push(`| \`${c.path}\` | ${show(c.before)} | ${show(c.after)} |`);
        out.push("");
      }
      if (p.notRemoved.length) out.push(`Fjernet i fila, men blir stående i Neo: ${p.notRemoved.join(", ")}.`, "");
      if (p.deferredSteps) out.push("Stegene i settet skrives først når en sakstype kobler det: fila skrives på nytt etter sakstypene.", "");
    }
  }
  if (notInFiles) {
    const objects = notInFiles.objects ?? [];
    const problems = notInFiles.problems ?? [];
    out.push("## Ikke styrt fra repoet", "");
    out.push(objects.length ? "Dette finnes i sandkassen uten en fil her. Gjennomføringen rører det ikke." : "Alt i sandkassen har en fil her.", "");
    for (const o of objects) out.push(`- ${o.kind} «${o.key}» (\`${o.path}\`)`);
    for (const p of problems) out.push(`- ${p.kind} «${p.key}»: ${p.problem}`);
    out.push("");
  }
  return out.join("\n");
}

// Forskjellene mellom en godkjent plan og nye svar, per fil. Tom liste: planen er den samme.
export function differences(approved, plans) {
  const now = new Map(summary(plans).map((p) => [p.path, p]));
  const diffs = [];
  for (const a of approved) {
    const n = now.get(a.path);
    if (!n) diffs.push(`${a.path}: mangler i den nye planen`);
    else if (n.action !== a.action) diffs.push(`${a.path}: var ${a.action}, er nå ${n.action}`);
    else if (JSON.stringify(n.changes) !== JSON.stringify(a.changes)) diffs.push(`${a.path}: endringene er ikke de samme som ble godkjent`);
    now.delete(a.path);
  }
  for (const path of now.keys()) diffs.push(`${path}: var ikke med i planen som ble godkjent`);
  return diffs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const dir = args[0];
  if (!dir || !existsSync(dir)) {
    console.error("Bruk: node planrapport.mjs <rå-mappe> (--md <fil> --json <fil> | --sjekk <godkjent.json>)");
    process.exit(2);
  }
  const loaded = load(dir);
  const sjekk = opt("--sjekk");
  if (sjekk) {
    const diffs = differences(JSON.parse(readFileSync(sjekk, "utf8")), loaded.plans);
    if (diffs.length) {
      console.error(`Planen er ikke den som ble godkjent:\n${diffs.map((d) => `- ${d}`).join("\n")}`);
      process.exit(1);
    }
    console.log("Planen er den som ble godkjent.");
  } else {
    const md = opt("--md");
    const json = opt("--json");
    if (md) writeFileSync(md, markdown(loaded));
    if (json) writeFileSync(json, `${JSON.stringify(summary(loaded.plans), null, 2)}\n`);
    if (!md && !json) console.log(markdown(loaded));
    if (loaded.plans.some((p) => p.action === "rejected")) process.exitCode = 1;
  }
}
