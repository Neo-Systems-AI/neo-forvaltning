#!/usr/bin/env node
// Synker Digdirs Altinn Studio-skills inn i plugins/altinn/skills/.
//
// Kilden er Altinn/altinn-studio, src/AI/agents/agents/skills — skillene bak
// KI-assistenten i Altinn Studio. Digdir skriver selv at de kan installeres i
// Claude Code. De kopieres BYTE-IDENTISK: ingen redigering her, for da er neste
// synk en merge framfor en kopi. Våre egne merknader står i README.md.
//
// Våre EGNE skills (OWN_SKILLS) bor i samme skills/-mappe, men eies ikke av
// kilden: synken rører bare mappene kilden har (eller hadde ved forrige synk),
// og stopper hvis kilden en dag får en skill med samme navn som en av våre.
//
// Bruk:
//   node scripts/sync-skills.mjs              # synk mot sha-en i UPSTREAM.json
//   node scripts/sync-skills.mjs --ref main   # hent ny versjon (løser ref → sha)
//   node scripts/sync-skills.mjs --check      # avvik mot sha-en i UPSTREAM.json? exit 1
//
// Avhengighetsfri: bare Node 18+ (innebygd fetch). GITHUB_TOKEN brukes hvis satt,
// kun for å heve rate-limiten — verdien skrives aldri ut.

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "Altinn/altinn-studio";
const UPSTREAM_DIR = "src/AI/agents/agents/skills";
const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(PLUGIN_ROOT, "skills");
const UPSTREAM_FILE = join(PLUGIN_ROOT, "UPSTREAM.json");
const OWN_SKILLS = ["altinn-publisering", "altinn-kall", "env"];

const args = process.argv.slice(2);
const check = args.includes("--check");
const refIdx = args.indexOf("--ref");
const refArg = refIdx >= 0 ? args[refIdx + 1] : undefined;
if (refIdx >= 0 && !refArg) fail("MANGLER: --ref krever en verdi (branch, tag eller sha)");
if (check && refArg) fail("--check sammenligner mot sha-en i UPSTREAM.json og tar ikke --ref");

const headers = { "User-Agent": "neo-forvaltning-altinn-sync", Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

async function getJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) fail(`GitHub svarte ${res.status} på ${url}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": headers["User-Agent"] } });
  if (!res.ok) fail(`GitHub svarte ${res.status} på ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function readUpstream() {
  try {
    return JSON.parse(await readFile(UPSTREAM_FILE, "utf8"));
  } catch {
    return undefined;
  }
}

async function listLocal(dir, prefix = "") {
  const out = new Map();
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) for (const [k, v] of await listLocal(join(dir, e.name), rel)) out.set(k, v);
    else out.set(rel, await readFile(join(dir, e.name)));
  }
  return out;
}

const pinned = await readUpstream();
const ref = refArg ?? pinned?.sha;
if (!ref) fail("MANGLER: ingen sha i UPSTREAM.json — kjør med --ref main første gang");

const commit = await getJson(`https://api.github.com/repos/${REPO}/commits/${encodeURIComponent(ref)}`);
const sha = commit.sha;
const tree = await getJson(`https://api.github.com/repos/${REPO}/git/trees/${sha}?recursive=1`);
if (tree.truncated) fail("GitHub returnerte et avkuttet tre — kan ikke garantere en komplett synk");

// Bare skill-mappene: toppnivå-README.md beskriver Digdirs egen laster, ikke skillene.
const prefix = `${UPSTREAM_DIR}/`;
const files = tree.tree
  .filter((t) => t.type === "blob" && t.path.startsWith(prefix))
  .map((t) => t.path.slice(prefix.length))
  .filter((p) => p.includes("/"));
if (files.length === 0) fail(`Fant ingen skill-filer under ${UPSTREAM_DIR} på ${sha}`);

const remote = new Map();
for (const p of files) {
  remote.set(p, await getText(`https://raw.githubusercontent.com/${REPO}/${sha}/${UPSTREAM_DIR}/${p}`));
}

const skills = [...new Set(files.map((p) => p.split("/")[0]))].sort();
const collision = skills.filter((s) => OWN_SKILLS.includes(s));
if (collision.length) fail(`Kilden har fått en skill med samme navn som vår egen: ${collision.join(", ")} — gi vår et nytt navn før synk`);

// Kildens mapper nå, pluss de den hadde ved forrige synk, så en skill kilden har
// fjernet også blir fjernet her. Våre egne mapper er aldri med.
const managed = new Set([...skills, ...(pinned?.skills ?? [])].filter((s) => !OWN_SKILLS.includes(s)));
const local = new Map([...(await listLocal(SKILLS_DIR))].filter(([p]) => managed.has(p.split("/")[0])));
const added = [...remote.keys()].filter((p) => !local.has(p));
const removed = [...local.keys()].filter((p) => !remote.has(p));
const changed = [...remote.keys()].filter((p) => local.has(p) && !local.get(p).equals(remote.get(p)));

console.log(`Kilde: ${REPO}@${sha.slice(0, 7)} (${commit.commit.committer.date.slice(0, 10)})`);
console.log(`Skills (${skills.length}): ${skills.join(", ")}`);

if (check) {
  if (added.length + removed.length + changed.length === 0) {
    console.log(`OK: kildens skills er byte-identiske med kilden (egne, ikke sjekket: ${OWN_SKILLS.join(", ")})`);
    process.exit(0);
  }
  for (const p of added) console.log(`  mangler lokalt: ${p}`);
  for (const p of removed) console.log(`  finnes ikke i kilden: ${p}`);
  for (const p of changed) console.log(`  endret lokalt: ${p}`);
  fail("AVVIK: skills/ er ikke lik kilden — kjør uten --check for å synke");
}

for (const s of managed) await rm(join(SKILLS_DIR, s), { recursive: true, force: true });
for (const [p, buf] of remote) {
  const dest = join(SKILLS_DIR, p);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
}
const upstream = {
  repo: REPO,
  path: UPSTREAM_DIR,
  sha,
  committed: commit.commit.committer.date,
  license: "MIT",
  skills,
};
await writeFile(UPSTREAM_FILE, `${JSON.stringify(upstream, null, 2)}\n`);
console.log(`Skrevet: ${remote.size} filer (${added.length} nye, ${changed.length} endret, ${removed.length} fjernet)`);
