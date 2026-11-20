#!/usr/bin/env node
// Hvor dokumentasjonen i neo-forvaltning ligger (mønstrene og integrasjonene), så skillene leser samme versjon som
// pluginen kom fra. En plugin installeres alene og har ikke docs/ med seg; markedsplassen er klonet i sin helhet, og
// stien dit står i Claude Codes liste over markedsplasser. Fra en klone av repoet ligger docs/ to nivåer opp.
//
//   node docs.mjs [monstre|integrasjoner]     skriver stien til mappa, eller feiler med hvorfor
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = "Neo-Systems-AI/neo-forvaltning";
const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Kandidatene i rekkefølge: repoet pluginen står i, så markedsplassen slik Claude Code har klonet den.
export function candidates({ pluginRoot = PLUGIN_ROOT, known = join(homedir(), ".claude/plugins/known_marketplaces.json") } = {}) {
  const out = [join(pluginRoot, "..", "..", "docs")];
  if (existsSync(known)) {
    const list = JSON.parse(readFileSync(known, "utf8"));
    for (const [name, m] of Object.entries(list)) {
      if (name === "neo-forvaltning" || m?.source?.repo === REPO) if (m.installLocation) out.push(join(m.installLocation, "docs"));
    }
  }
  return out;
}

export function docsDir(part, opts) {
  const tried = candidates(opts);
  const found = tried.find((d) => existsSync(join(d, part ?? "")));
  if (!found) {
    throw new Error(`Fant ikke docs/${part ?? ""} i neo-forvaltning. Prøvde: ${tried.join(", ")}. Legg til markedsplassen (/plugin marketplace add ${REPO}), eller les https://github.com/${REPO}/tree/main/docs`);
  }
  return part ? join(found, part) : found;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    console.log(docsDir(process.argv[2]));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
