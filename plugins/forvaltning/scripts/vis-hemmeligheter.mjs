#!/usr/bin/env node
// Hemmelighetene repoet viser til: hvor referansen står i config-fila, navnet på variabelen, kilden, og om personen når
// den. Bare navn, aldri verdier: for Key Vault spør skriptet bare om hemmeligheten finnes og er slått på. Ingenting
// hentes eller lagres; skriptene som trenger en verdi, henter den selv for kjøringen.
//
//   node vis-hemmeligheter.mjs [--uten-az]
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { load } from "./lib/neo-config.mjs";
import { reach, refs } from "./lib/hemmeligheter.mjs";

export function table(data, { utenAz = false, exec, env = process.env } = {}) {
  return refs(data).map((r) => ({ ...r, nar: utenAz ? null : reach({ $env: r.env, kilde: r.kilde }, { ...(exec ? { exec } : {}), env }) }));
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  let data;
  try {
    ({ data } = load());
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  const rows = table(data, { utenAz: process.argv.includes("--uten-az") });
  if (!rows.length) {
    console.log("Config-fila viser ikke til noen hemmeligheter.");
    process.exit(0);
  }
  console.log("| Hemmelighet | Står i config | Kilde | Fil | Når du den |\n|---|---|---|---|---|");
  for (const r of rows) {
    const nar = r.nar === null ? "ikke sjekket" : r.nar.ok === true ? `ja${r.nar.why ? ` (${r.nar.why})` : ""}` : r.nar.ok === null ? r.nar.why : `❌ nei: ${r.nar.why}`;
    console.log(`| \`${r.env}\` | \`${r.path}\` | ${r.kilde ?? "—"} | ${r.fil ? "ja" : ""} | ${nar} |`);
  }
  process.exit(rows.some((r) => r.nar && r.nar.ok === false) ? 1 : 0);
}
