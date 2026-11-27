#!/usr/bin/env node
// Hvor dokumentasjonen til pluginen ligger (mønstrene for god konfig, oppskriftene og eSignering), så skillene leser samme versjon
// som pluginen. Dokumentasjonen står i `docs/` i plugin-mappa og følger med når pluginen installeres.
//
//   node docs.mjs [monstre | oppskrifter]   skriver stien, eller feiler med hvorfor
import { existsSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = "Neo-Systems-AI/neo-forvaltning";
const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function docsDir(part, { pluginRoot = PLUGIN_ROOT } = {}) {
  const dir = join(pluginRoot, "docs", part ?? "");
  if (!existsSync(dir)) throw new Error(`Fant ikke docs/${part ?? ""} i pluginen (${pluginRoot}). Oppdater pluginen, eller les https://github.com/${REPO}/tree/main/plugins/solution/docs`);
  return dir;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    console.log(docsDir(process.argv[2]));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
