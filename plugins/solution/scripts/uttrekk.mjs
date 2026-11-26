#!/usr/bin/env node
// Uttrekket gjennomgangen av konfigen leser (`rules.mjs`), og det byggingen trenger, hentet rett fra Neo sitt API med
// maskinklienten (`lib/neo-api.mjs`): sakstypene, feltene og flytene slik de kjører, også det som ikke er konfig (om en
// flyt er aktivert), og integrasjonene og postboksene en flyt kan bindes til. Bare lesing. Svarene lagres uendret, én
// fil per kall, i en mappe som ikke committes.
//
//   node uttrekk.mjs <mappe> [--miljo <miljø>]
//
// Exit: 0 ok · 1 Neo avviste et kall · 2 feil bruk eller config.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { load } from "./lib/neo-config.mjs";
import { loadEnvLocal } from "./lib/hemmeligheter.mjs";
import { apiSettings, neoApi } from "./lib/neo-api.mjs";

// Filnavnet `rules.mjs` leser, og kallet som gir det.
export const UTTREKK = [
  ["list_case_types.json", (api) => api.get("/api/case-types")],
  ["list_custom_fields.json", (api) => api.post("/api/custom-fields/list", {})],
  ["list_workflows.json", (api) => api.get("/api/workflows")],
  // Integrasjonene og postboksene en flyt kan bindes til, med nøkkelen konfig-fila bruker (`ref`).
  ["config_environment.json", (api) => api.get("/api/config/environment")],
];

export async function hent(api, dir) {
  mkdirSync(dir, { recursive: true });
  for (const [file, kall] of UTTREKK) writeFileSync(join(dir, file), `${JSON.stringify(await kall(api), null, 2)}\n`);
  return UTTREKK.map(([file]) => file);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const miljo = args.includes("--miljo") ? args[args.indexOf("--miljo") + 1] : undefined;
  const dir = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--miljo");
  if (!dir) {
    console.error("Bruk: node uttrekk.mjs <mappe> [--miljo <miljø>]");
    process.exit(2);
  }
  loadEnvLocal();
  const { data, errors } = load();
  if (!data) {
    console.error(errors.join("\n"));
    process.exit(2);
  }
  try {
    const s = apiSettings(data, miljo);
    const files = await hent(neoApi(s), dir);
    console.log(`Miljø: ${s.miljo} (${s.url}). Skrev ${files.join(", ")} i ${dir}.`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
