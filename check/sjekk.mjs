#!/usr/bin/env node
// Sjekken av et kunderepo eller et repo for standardløsninger laget fra neo-forvaltning-mal. Én sjekk, ett sted: kilden
// står i check/ i neo-forvaltning, og er bygget til én fil uten avhengigheter (plugins/forvaltning/scripts/sjekk.mjs)
// som pluginen kjører lokalt og malens CI henter i en låst versjon. Rødt stopper, gult sier fra. Innholdet i
// konfigfilene vurderer Neo i planen; her sjekkes at de er Neos filer.
//
//   node sjekk.mjs [--root <dir>] [--base <ref>] [--annotate] [--summary] [--json]
//   node sjekk.mjs hos-kunden                                  lista over det kunden må gjøre (committes ikke)
//   node sjekk.mjs --versjon
//
// --base er det endringen sammenlignes med for kildene (standard origin/main). Exit: 0 grønt (gult kan finnes),
// 1 rødt, 2 feil bruk.
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { places } from "./les.mjs";
import * as struktur from "./struktur.mjs";
import * as kilder from "./kilder.mjs";
import * as krav from "./krav.mjs";
import * as oppsett from "./oppsett.mjs";
import * as avvik from "./avvik.mjs";
import { render } from "./hos-kunden.mjs";

export function version() {
  // eslint-disable-next-line no-undef
  if (typeof __VERSJON__ !== "undefined") return __VERSJON__;
  return JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "package.json"), "utf8")).version;
}

// Referansene i personaene, til visningen av hemmelighetene i forvaltning: den bruker YAML-leseren til sjekken.
export const personaRefs = struktur.personaRefs;

export const CHECKS = [...struktur.CHECKS, ...kilder.CHECKS, ...krav.CHECKS, ...oppsett.CHECKS, ...avvik.CHECKS];

// Alt som sjekkes, med funnene. Sjekken kaller ingen tjeneste.
export function run(root, { base = "origin/main" } = {}) {
  const f = [];
  const kunde = struktur.readKunde(root);
  f.push(...kunde.findings);
  const config = struktur.readConfig(root);
  f.push(...config.findings);
  f.push(...struktur.checkLayout(root, kunde.type, config.envs));
  f.push(...struktur.checkCodeowners(root));
  f.push(...struktur.checkLosninger(root));
  f.push(...struktur.checkIntegrasjoner(root));
  f.push(...struktur.checkPersonaer(root));
  // I et repo for standardløsninger har felles/ ikke kilder og forståelse; strukturen over sier fra om de står der.
  const ps = places(root);
  const status = (navn) => struktur.solutionStatus(root, navn);
  f.push(...kilder.checkKilder(root, ps, { base }));
  const k = krav.checkKrav(root, ps, { status });
  f.push(...k.findings);
  f.push(...struktur.checkTester(root, k.ids));
  f.push(...struktur.checkTestplan(root, k.ids));
  const cf = oppsett.checkConfigFiles(root);
  f.push(...cf.findings);
  f.push(...oppsett.checkUsed(cf.files, k.used));
  f.push(...avvik.checkDeviations(root, ps, { status }));
  return f.map((x) => ({ level: "fail", ...x }));
}

const esc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

export function summary(findings) {
  const rows = CHECKS.map(({ name, about }) => {
    const mine = findings.filter((x) => x.check === name);
    const fails = mine.filter((x) => x.level === "fail").length;
    return `| ${name} | ${about} | ${fails ? `❌ ${fails} å rette` : mine.length ? `⚠️ ${mine.length} å se på` : "✅ ok"} |`;
  });
  const details = findings.length ? `\n<details><summary>Funnene</summary>\n\n${findings.map((x) => `- ${x.level === "fail" ? "❌" : "⚠️"} \`${x.file}${x.line ? `:${x.line}` : ""}\`: ${x.message}`).join("\n")}\n</details>\n` : "";
  return `## Repoet\n\nSjekken ${version()}.\n\n| Sjekk | Hva den sjekker | Resultat |\n|---|---|---|\n${rows.join("\n")}\n${details}`;
}

export function parseArgs(argv) {
  const VALUE = new Set(["root", "base"]);
  const FLAGS = new Set(["annotate", "summary", "json", "versjon"]);
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const name = a.slice(2);
    if (FLAGS.has(name)) out[name] = true;
    else if (VALUE.has(name)) {
      const v = argv[++i];
      if (v === undefined || v.startsWith("--")) throw new Error(`--${name} trenger en verdi`);
      out[name] = v;
    } else throw new Error(`Ukjent flagg --${name}`);
  }
  const [cmd = "sjekk"] = out._;
  if (!["sjekk", "hos-kunden"].includes(cmd)) throw new Error(`Ukjent kommando «${cmd}». Kommandoene: sjekk, hos-kunden`);
  return { ...out, cmd };
}

const gitRoot = () => {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return process.cwd();
  }
};

export async function main(argv, { out = console.log, err = console.error } = {}) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    err(e.message);
    return 2;
  }
  if (args.versjon) {
    out(version());
    return 0;
  }
  const root = args.root ?? gitRoot();
  try {
    if (args.cmd === "hos-kunden") {
      out(render(root));
      return 0;
    }
    const findings = run(root, { base: args.base });
    for (const x of findings) out(`${x.level === "fail" ? "✗" : "!"} ${x.file}${x.line ? `:${x.line}` : ""}: ${x.message}`);
    if (args.annotate) for (const x of findings) out(`::${x.level === "fail" ? "error" : "warning"} file=${x.file}${x.line ? `,line=${x.line}` : ""},title=${x.check}::${esc(x.message)}`);
    if (args.json) out(JSON.stringify({ versjon: version(), funn: findings }, null, 2));
    if (args.summary) {
      const text = summary(findings);
      if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
      else out(text);
    }
    if (!findings.length) out(`Ingen funn (sjekken ${version()}).`);
    return findings.some((x) => x.level === "fail") ? 1 : 0;
  } catch (e) {
    err(`Sjekken stoppet: ${e.message}`);
    return 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exitCode = await main(process.argv.slice(2));
