#!/usr/bin/env node
// Kontrollen for repoet: markedsplassen og hver plugin har samme form, og ingenting internt hos Neo Systems eller
// om en kunde kommer med, fordi repoet er offentlig. CI kjører den på hver PR; hver sjekk skriver sin rad i
// sammendraget, også de grønne, og hvert funn er en merknad på fila.
//
//   node scripts/check.mjs [--annotate] [--summary] [--root <dir>]
import { appendFileSync, existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { plan } from "./sync-shared.mjs";

export const CHECKS = [
  { name: "manifests", about: "Markedsplassen og hver plugin har et gyldig manifest med lisens, og beskrivelsen står ett sted: i plugin.json" },
  { name: "listed", about: "Hver plugin-mappe står i markedsplassen, og hver oppføring har mappa si" },
  { name: "versions", about: "Versjonen er lik i plugin.json og marketplace.json" },
  { name: "hooks", about: "Hvert skript en hook nevner, finnes" },
  { name: "public", about: "Ingenting internt eller om en kunde: interne verter, repoer og stier" },
  { name: "config", about: "Hver plugin har neo-config.keys.json med nøklene den leser, og kopiene fra shared/ er de importene krever, like shared/" },
  { name: "docs", about: "Lenkene i docs/ og i pluginenes docs/ peker på filer og overskrifter som finnes, og hver regel i mønstrene det vises til, finnes" },
  { name: "inngang", about: "Et skript som kjøres direkte, løser opp stiene før det sammenligner process.argv[1] med seg selv, så det kjører også gjennom en symlenke" },
  { name: "skills", about: "En skill viser ikke til en annen skill og har ingen datoer, og hver henvisning til en skill (/plugin:skill) i en fil viser til en som finnes" },
];

// Ankeret GitHub gir en overskrift: små bokstaver, tegnsetting ut, mellomrom blir bindestrek.
export const anchor = (heading) => heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");

// Mønstrene for god konfig, der reglene står med id.
export const MONSTRE = "plugins/solution/docs/monstre";

// Mappene med dokumentasjon: inngangen i roten, og `docs/` i hver plugin.
const docDirs = (root) => [
  join(root, "docs"),
  ...(existsSync(join(root, "plugins")) ? readdirSync(join(root, "plugins")).map((p) => join(root, "plugins", p, "docs")) : []),
].filter((d) => existsSync(d));

// Lenkene i dokumentasjonen: markdown-lenker til filer og overskrifter, og henvisningene til en regel i mønstrene
// (`NN-flate.md#id` i `krever` og i teksten), som skal treffe en regel med den id-en.
export function checkDocs(root) {
  const f = [];
  const files = docDirs(root).flatMap((d) => walk(d)).filter((p) => p.endsWith(".md"));
  const headings = new Map(files.map((p) => [p, new Set(readFileSync(p, "utf8").split("\n").filter((l) => /^#{1,6} /.test(l)).map((l) => anchor(l.replace(/^#+ /, ""))))]));
  const ids = new Map(files.map((p) => [p, new Set([...readFileSync(p, "utf8").matchAll(/^id: (\S+)/gm)].map((m) => m[1]))]));
  for (const file of files) {
    const rel = relative(root, file);
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      for (const [, target] of line.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^[a-z]+:/.test(target)) continue;
        const [path, hash] = target.split("#");
        const dest = path ? join(dirname(file), path) : file;
        if (!existsSync(dest)) f.push({ check: "docs", file: rel, line: i + 1, message: `Lenken peker på ${path}, som ikke finnes` });
        else if (hash && dest.endsWith(".md") && !headings.get(dest)?.has(hash)) f.push({ check: "docs", file: rel, line: i + 1, message: `Lenken peker på #${hash}, som ikke er en overskrift i ${path || "fila"}` });
      }
      if (!rel.startsWith(`${MONSTRE}/`)) return;
      const refs = [...line.matchAll(/(\d\d-[a-z0-9-]+\.md)#([a-z0-9-]+)/g)].filter((m) => !line.includes(`](${m[0]}`) && !line.includes(`](./${m[0]}`));
      for (const [, name, id] of refs) {
        const dest = join(root, MONSTRE, name);
        if (!existsSync(dest)) f.push({ check: "docs", file: rel, line: i + 1, message: `Henvisningen peker på ${name}, som ikke finnes` });
        else if (!ids.get(dest)?.has(id)) f.push({ check: "docs", file: rel, line: i + 1, message: `Regelen ${name}#${id} finnes ikke` });
      }
    });
  }
  return f;
}

// En skill har ingen datoer; historikken står i PR-en. Digdirs skills
// i `altinn` er kopiert uendret og sjekkes ikke.
export function checkSkills(root, plugins) {
  const f = [];
  const names = new Set(plugins);
  for (const p of plugins) {
    const dir = join(root, "plugins", p, "skills");
    if (!existsSync(dir)) continue;
    for (const s of readdirSync(dir)) {
      if (p === "altinn" && s.startsWith("altinn-")) continue;
      const file = join(dir, s, "SKILL.md");
      if (!existsSync(file)) continue;
      const rel = relative(root, file);
      readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        if (/\b20\d\d-\d\d-\d\d\b/.test(line)) f.push({ check: "skills", file: rel, line: i + 1, message: "En dato. En skill har ingen historikk; den står i PR-en" });
      });
    }
  }
  return f;
}

// En henvisning til en skill i en fil, også i skriptene: «/plugin:skill», og «`plugin:skill`» i en README (der står
// skillene i tabeller). Pluginen må være en av våre og skillen må finnes; en henvisning til en skill som er tatt bort,
// sender personen til noe som ikke er der. Et scope som `altinn:serviceowner` i en oppskrift er ikke en skill.
export function checkSkillRefs(root, plugins, files) {
  const f = [];
  const names = new Set(plugins);
  for (const file of files) {
    const rel = relative(root, file);
    if (!/\.(md|mjs|json)$/.test(rel) || /\/skills\/altinn-[^/]+\//.test(rel) || rel === "plugins/forvaltning/scripts/sjekk.mjs") continue;
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      for (const m of line.matchAll(/(?:(?<=^|[\s(«"'])\/|`)([a-z][a-z0-9-]*):([a-z0-9][a-z0-9-]*)(?=`|\b)/g)) {
        const [ref, plugin, skill] = m;
        if (!names.has(plugin)) continue;
        if (ref.startsWith("`") && (line[m.index + ref.length] !== "`" || !rel.endsWith("README.md"))) continue;
        if (!existsSync(join(root, "plugins", plugin, "skills", skill, "SKILL.md"))) f.push({ check: "skills", file: rel, line: i + 1, message: `Viser til ${plugin}:${skill}, som ikke er en skill i ${plugin}` });
      }
    });
  }
  return f;
}

// Nøkkelfila sier hva pluginen leser fra .claude/neo.config.json: `neo: true` når den snakker med Neo (miljøene og
// MCP-serveren per miljø), `neoApi: true` når den gjør det med skript og maskinklienten i stedet for MCP, nøklene relativt til pluginens del, og referansene til hvelvet den trenger under
// <system>.hemmeligheter. Bare nøkler: hva som kopieres inn i pluginen, avledes av importene.
export function checkKeys(root, p, keys) {
  const f = [];
  const kf = `plugins/${p}/neo-config.keys.json`;
  if (keys.plugin !== p) f.push({ check: "config", file: kf, message: `plugin er «${keys.plugin}», mappa er «${p}»` });
  const extra = Object.keys(keys).filter((k) => !["plugin", "neo", "neoApi", "keys", "hemmeligheter"].includes(k));
  if (extra.length) f.push({ check: "config", file: kf, message: `Nøkkelfila beskriver bare nøkler (neo, neoApi, keys, hemmeligheter), ikke ${extra.join(", ")}` });
  if (keys.neoApi !== undefined && (keys.neoApi !== true || keys.neo !== true)) f.push({ check: "config", file: kf, message: "neoApi er true når pluginen kaller Neo med maskinklienten, og da er neo også true" });
  if (keys.neo !== undefined && keys.neo !== true) f.push({ check: "config", file: kf, message: "neo er true når pluginen snakker med Neo, ellers står den ikke" });
  if (!Array.isArray(keys.keys)) f.push({ check: "config", file: kf, message: "keys mangler (en tom liste når pluginen ikke leser noe)" });
  for (const k of keys.keys ?? []) if (!k.path || !k.doc) f.push({ check: "config", file: kf, message: `Hver nøkkel har path og doc: ${JSON.stringify(k)}` });
  for (const h of keys.hemmeligheter ?? []) if (!/^[a-z]+\.hemmeligheter\.[\w<>-]+$/.test(String(h.path ?? "")) || !h.doc) f.push({ check: "config", file: kf, message: `Hver hemmelighet har path (<system>.hemmeligheter.<navn>) og doc: ${JSON.stringify(h)}` });
  return f;
}

// Inngangen i et skript: «er det meg som kjøres?». process.argv[1] er stien slik den ble gitt, import.meta.url er
// stien med symlenkene løst opp. Gjennom en symlenke (som mktemp -d på macOS) blir de ulike, og skriptet gjør ingenting
// og gir exit 0 uten utskrift. Begge sider løses opp med realpathSync.
export function checkEntry(root, files) {
  const f = [];
  for (const file of files) {
    const rel = relative(root, file);
    if (!rel.endsWith(".mjs") || rel.startsWith("check/node_modules/") || rel === "scripts/check.mjs" || rel === "scripts/check.test.mjs") continue;
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (!/^\s*\/\//.test(line) && /process\.argv\[1\]/.test(line) && /import\.meta\.url|\bself\b/.test(line) && !/realpathSync\(process\.argv\[1\]\)/.test(line)) f.push({ check: "inngang", file: rel, line: i + 1, message: "Sammenligner process.argv[1] med stien til skriptet uten å løse opp symlenkene. Gjennom en symlenke kjører da ingenting, med exit 0. Bruk realpathSync på begge sider" });
    });
  }
  return f;
}

// Det som aldri skal stå i et offentlig repo. Kundenavn holdes ute ved review; her står det som kan sjekkes.
export const INTERNAL = [
  { re: /\.ghe\.com/i, why: "en intern GitHub-vert" },
  { re: /Neo-Systems-AS\//, why: "et internt repo" },
  { re: /\b(memory|methods)#\d+/, why: "en intern PR" },
  { re: /\/Users\/[a-z]/i, why: "en lokal sti" },
  { re: /~\/Code\//, why: "en lokal sti" },
  { re: /\bkv-neo[\w-]*/i, why: "et nøkkelhvelv" },
];

const SKIP = new Set([".git", "node_modules"]);
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    if (SKIP.has(n)) return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const readJson = (root, file, findings, check) => {
  try {
    return JSON.parse(readFileSync(join(root, file), "utf8"));
  } catch (e) {
    findings.push({ check, file, message: existsSync(join(root, file)) ? `Ikke gyldig JSON: ${e.message}` : "Mangler" });
    return null;
  }
};

export function run(root) {
  const f = [];
  const market = readJson(root, ".claude-plugin/marketplace.json", f, "manifests");
  if (market) {
    for (const k of ["name", "owner", "plugins"]) if (!market[k]) f.push({ check: "manifests", file: ".claude-plugin/marketplace.json", message: `«${k}» mangler` });
    const folders = existsSync(join(root, "plugins")) ? readdirSync(join(root, "plugins"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
    const entries = new Map((market.plugins ?? []).map((p) => [p.name, p]));
    for (const dir of folders) if (!entries.has(dir)) f.push({ check: "listed", file: `plugins/${dir}`, message: "Står ikke i marketplace.json, så ingen kan installere den" });
    for (const [name, entry] of entries) {
      const mf = ".claude-plugin/marketplace.json";
      if (entry.source !== `./plugins/${name}`) f.push({ check: "listed", file: mf, message: `${name}: source skal være ./plugins/${name}, ikke ${entry.source}` });
      if (!folders.includes(name)) {
        f.push({ check: "listed", file: mf, message: `${name}: mappa plugins/${name} finnes ikke` });
        continue;
      }
      const pf = `plugins/${name}/.claude-plugin/plugin.json`;
      const plugin = readJson(root, pf, f, "manifests");
      if (!plugin) continue;
      if (plugin.name !== name) f.push({ check: "manifests", file: pf, message: `name er «${plugin.name}», mappa er «${name}»` });
      if (!plugin.description) f.push({ check: "manifests", file: pf, message: `${name}: beskrivelsen mangler i plugin.json` });
      if (entry.description !== undefined) f.push({ check: "manifests", file: mf, message: `${name}: beskrivelsen står i plugin.json; ta den bort fra marketplace.json, så den står ett sted` });
      if (!plugin.license) f.push({ check: "manifests", file: pf, message: `${name}: lisensen mangler. Repoet er offentlig, og uten lisens kan ingen bruke det` });
      if (!plugin.version || plugin.version !== entry.version) {
        f.push({ check: "versions", file: pf, message: `${name}: ${plugin.version ?? "ingen versjon"} i plugin.json, ${entry.version ?? "ingen versjon"} i marketplace.json. Bump begge, ellers ser ingen endringen` });
      }
      const hf = `plugins/${name}/hooks/hooks.json`;
      if (existsSync(join(root, hf))) {
        const hooks = readJson(root, hf, f, "hooks");
        for (const cmd of JSON.stringify(hooks ?? {}).match(/\$\{CLAUDE_PLUGIN_ROOT\}\/[^\s"\\]+/g) ?? []) {
          const rel = cmd.replace("${CLAUDE_PLUGIN_ROOT}/", "");
          if (!existsSync(join(root, "plugins", name, rel))) f.push({ check: "hooks", file: hf, message: `Hooken nevner ${rel}, som ikke finnes. En hook som ikke laster, feiler stille` });
        }
      }
    }
  }
  for (const file of walk(root)) {
    const rel = relative(root, file);
    if (rel === "scripts/check.mjs" || rel === "scripts/check.test.mjs" || rel.startsWith("check/node_modules/")) continue;
    const text = readFileSync(file, "utf8");
    text.split("\n").forEach((line, i) => {
      for (const { re, why } of INTERNAL) if (re.test(line)) f.push({ check: "public", file: rel, line: i + 1, message: `Linja nevner ${why}. Repoet er offentlig` });
    });
  }
  const plugins = existsSync(join(root, "plugins")) ? readdirSync(join(root, "plugins"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  for (const p of plugins) {
    const kf = `plugins/${p}/neo-config.keys.json`;
    if (!existsSync(join(root, kf))) f.push({ check: "config", file: kf, message: "Mangler. Hver plugin sier hva den leser fra .claude/neo.config.json, også når det er ingenting" });
    else {
      const keys = readJson(root, kf, f, "config");
      if (keys) f.push(...checkKeys(root, p, keys));
    }
  }
  if (existsSync(join(root, "shared"))) {
    for (const i of plan(root)) {
      const at = i.text !== undefined ? `plugins/${i.plugin}/scripts/${i.mod}` : `plugins/${i.plugin}/scripts/lib/${i.mod}`;
      if (i.missing) f.push({ check: "config", file: `plugins/${i.plugin}`, message: `Importerer lib/${i.mod}, som ikke finnes i shared/` });
      else if (i.unused) f.push({ check: "config", file: at, message: "Ingen skript eller skill i pluginen bruker den. Kjør node scripts/sync-shared.mjs" });
      else if (!i.same) f.push({ check: "config", file: at, message: `Ikke lik ${i.text !== undefined ? "nøkkelfilene til pluginene" : `shared/${i.mod}`}. Kjør node scripts/sync-shared.mjs` });
    }
  }
  f.push(...checkSkillRefs(root, plugins, walk(root)));
  f.push(...checkEntry(root, walk(root)));
  f.push(...checkDocs(root));
  f.push(...checkSkills(root, plugins));
  return f.map((x) => ({ level: "fail", ...x }));
}

const esc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

export function summary(findings) {
  const rows = CHECKS.map(({ name, about }) => {
    const n = findings.filter((x) => x.check === name).length;
    return `| ${name} | ${about} | ${n ? `❌ ${n} å rette` : "✅ ok"} |`;
  });
  const details = findings.length ? `\n<details><summary>Funnene</summary>\n\n${findings.map((x) => `- ❌ \`${x.file}${x.line ? `:${x.line}` : ""}\`: ${x.message}`).join("\n")}\n</details>\n` : "";
  return `## Repoet\n\n| Sjekk | Hva den sjekker | Resultat |\n|---|---|---|\n${rows.join("\n")}\n${details}`;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  const root = args.includes("--root") ? args[args.indexOf("--root") + 1] : process.cwd();
  const findings = run(root);
  for (const x of findings) console.log(`✗ ${x.file}${x.line ? `:${x.line}` : ""}: ${x.message}`);
  if (args.includes("--annotate")) for (const x of findings) console.log(`::error file=${x.file}${x.line ? `,line=${x.line}` : ""},title=${x.check}::${esc(x.message)}`);
  if (args.includes("--summary")) {
    const text = summary(findings);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
    else console.log(text);
  }
  if (!findings.length) console.log("Ingen funn.");
  process.exit(findings.length ? 1 : 0);
}
