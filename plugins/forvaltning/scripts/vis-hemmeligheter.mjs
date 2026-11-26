#!/usr/bin/env node
// Hemmelighetene repoet viser til: referansene under `<system>.hemmeligheter` i `.claude/neo.config.json` og i
// personaene i `test/personaer/`, hvor verdien ligger i hvelvet, og om personen når den med sin egen innlogging
// (`az login`). Aldri verdier: sjekken spør bare om hemmeligheten finnes og er slått på. Personaene leses med
// YAML-leseren til sjekken; ingen annen plugin leser dem. Exit 1 når en ikke kan nås eller ikke er en referanse.
//
//   node vis-hemmeligheter.mjs [--uten-az]      --uten-az: bare referansene, uten å spørre hvelvet
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { load } from "./lib/neo-config.mjs";
import { configRefs, reach } from "./lib/hemmeligheter.mjs";
import { personaRefs } from "./sjekk.mjs";

export function table(root, data, { exec, utenAz = false } = {}) {
  const c = configRefs(data);
  const p = personaRefs(root);
  const list = [...c.list, ...p.list];
  const problems = [...c.problems, ...p.problems];
  const rows = list.map((r) => ({ ...r, nar: utenAz ? null : reach(r, exec ? { exec } : {}) }));
  return { rows, problems };
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const utenAz = process.argv.includes("--uten-az");
  let t;
  try {
    const { root, data } = load();
    t = table(root, data, { utenAz });
  } catch (e) {
    console.log(`❌ ${e.message}`);
    process.exit(1);
  }
  const { rows, problems } = t;
  if (!rows.length && !problems.length) console.log("Ingen referanser under <system>.hemmeligheter i .claude/neo.config.json eller i test/personaer/.");
  else {
    const cols = ["Står i", "Kilde", "Fil", ...(utenAz ? [] : ["Når du den"])];
    console.log(`| ${cols.join(" | ")} |\n|${cols.map(() => "---|").join("")}`);
    for (const r of rows) console.log(`| ${[`\`${r.sted}\``, r.kilde, r.fil ? "ja" : "", ...(utenAz ? [] : [r.nar.ok ? "ja" : `❌ nei: ${r.nar.why}`])].join(" | ")} |`);
  }
  for (const p of problems) console.log(`❌ ${p.sted}: ${p.why}`);
  process.exitCode = problems.length || rows.some((r) => r.nar && !r.nar.ok) ? 1 : 0;
}
