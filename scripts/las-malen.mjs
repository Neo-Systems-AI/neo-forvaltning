#!/usr/bin/env node
// Låser malen (eller et repo laget fra den) til en versjon av sjekken: taggen og sha256 for fila i taggen, i
// `.github/workflows/check.yml` og `.claude/method.json`. Henter fila fra taggen på github.com, regner ut sha256, skriver
// begge filene, og prøver at den låste adressen gir den samme fila. Låsen skrives aldri for hånd: to filer med en
// tag og en sha256 hver er der en feil kommer inn.
//
//   node scripts/las-malen.mjs <sti til malen> <tag, for eksempel sjekk-v3.1.0>
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const url = (tag) => `https://raw.githubusercontent.com/Neo-Systems-AI/neo-forvaltning/${tag}/plugins/forvaltning/scripts/sjekk.mjs`;
export const sha256 = (text) => createHash("sha256").update(text).digest("hex");

// Bytter taggen og sha256 i de to filene. Feiler når en fil ikke har nøyaktig én lås, så ingenting halvveis skrives.
export function relock(files, tag, sum) {
  const out = {};
  for (const [name, text] of Object.entries(files)) {
    const refs = text.match(/sjekk-v\d+\.\d+\.\d+|\b[0-9a-f]{40}\b/g) ?? [];
    const sums = text.match(/\b[0-9a-f]{64}\b/g) ?? [];
    if (new Set(refs).size !== 1 || new Set(sums).size !== 1) throw new Error(`${name}: fant ${new Set(refs).size} versjoner og ${new Set(sums).size} sha256; venter nøyaktig én av hver`);
    out[name] = text.split(refs[0]).join(tag).split(sums[0]).join(sum);
  }
  return out;
}

export const FILES = [".github/workflows/check.yml", ".claude/method.json"];

async function main([dir, tag]) {
  if (!dir || !/^sjekk-v\d+\.\d+\.\d+$/.test(tag ?? "")) throw new Error("Bruk: node scripts/las-malen.mjs <sti til malen> sjekk-v<versjon>");
  const res = await fetch(url(tag));
  if (!res.ok) throw new Error(`${url(tag)} → ${res.status}. Finnes taggen på github.com?`);
  const sum = sha256(await res.text());
  const files = Object.fromEntries(FILES.map((f) => [f, readFileSync(join(dir, f), "utf8")]));
  const next = relock(files, tag, sum);
  for (const f of FILES) writeFileSync(join(dir, f), next[f]);
  const again = sha256(await (await fetch(url(tag))).text());
  if (again !== sum) throw new Error("Fila bak taggen endret seg mens låsen ble skrevet. Kjør på nytt");
  console.log(`Låst til ${tag} (sha256 ${sum.slice(0, 12)}…) i ${FILES.join(" og ")}.`);
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
