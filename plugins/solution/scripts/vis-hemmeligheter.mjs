#!/usr/bin/env node
// Hemmelighetene repoet viser til: referansene i `integrasjoner/<system>/hemmeligheter.yaml` og i personaene i
// `test/personaer/`, hvor verdien ligger i hvelvet, og om personen når den med sin egen innlogging (`az login`).
// Aldri verdier: sjekken spør bare om hemmeligheten finnes og er slått på. Exit 1 når en ikke kan nås eller ikke er en
// referanse.
//
//   node vis-hemmeligheter.mjs [--uten-az]      --uten-az: bare referansene, uten å spørre hvelvet
import { fileURLToPath } from "node:url";
import { repoRoot } from "./lib/config.mjs";
import { allRefs, reach } from "./lib/hemmeligheter.mjs";

export function table(root, { exec, utenAz = false } = {}) {
  const { list, problems } = allRefs(root);
  const rows = list.map((r) => ({ ...r, nar: utenAz ? null : reach(r, exec ? { exec } : {}) }));
  return { rows, problems };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const utenAz = process.argv.includes("--uten-az");
  const { rows, problems } = table(repoRoot(), { utenAz });
  if (!rows.length && !problems.length) console.log("Ingen referanser i integrasjoner/*/hemmeligheter.yaml eller test/personaer/.");
  else {
    const cols = ["Står i", "Kilde", "Fil", ...(utenAz ? [] : ["Når du den"])];
    console.log(`| ${cols.join(" | ")} |\n|${cols.map(() => "---|").join("")}`);
    for (const r of rows) console.log(`| ${[`\`${r.sted}\``, r.kilde, r.fil ? "ja" : "", ...(utenAz ? [] : [r.nar.ok ? "ja" : `❌ nei: ${r.nar.why}`])].join(" | ")} |`);
  }
  for (const p of problems) console.log(`❌ ${p.sted}: ${p.why}`);
  process.exitCode = problems.length || rows.some((r) => r.nar && !r.nar.ok) ? 1 : 0;
}
