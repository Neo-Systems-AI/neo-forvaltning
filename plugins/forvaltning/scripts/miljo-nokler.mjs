#!/usr/bin/env node
// Nøklene til miljøet i oppsettet: integrasjonene (`ref:integration:<app>/<navn>`) og postboksene
// (`ref:mailbox:<leverandør>/<adresse>`) flytene er bundet til. De er ikke konfig og følger ikke med promoteringen, så
// org-en sandkassen promoteres til, må ha dem selv. Svaret er lista `check_config_refs` tar imot, som JSON.
//
//   node miljo-nokler.mjs <oppsett-mappe>
//
// Leser fila linje for linje: Neo skriver bindingen som en verdi på sin egen linje, med eller uten anførselstegn.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Tokenet er hele verdien til en nøkkel (`integrationId: …`), ikke et ord i en tekst.
const TOKEN = /:\s+["']?(ref:(?:integration|mailbox):[^\n]*?)["']?\s*$/;

export function tokensIn(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const m = line.match(TOKEN);
    if (m) out.push(m[1].replace(/\\"/g, '"'));
  }
  return out;
}

const yamlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? yamlFiles(p) : name.endsWith(".yaml") ? [p] : [];
  });

export const tokensInDir = (dir) => [...new Set(yamlFiles(dir).flatMap((f) => tokensIn(readFileSync(f, "utf8"))))].sort();

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Bruk: node miljo-nokler.mjs <oppsett-mappe>");
    process.exit(2);
  }
  console.log(JSON.stringify(tokensInDir(dir)));
}
