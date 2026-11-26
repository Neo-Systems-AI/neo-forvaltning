#!/usr/bin/env node
// Nøklene repoet trenger i hvelvet: hvilke pluginene som er på, sier de trenger (med de faste navnene), og om de står i
// hvelvet. `fyll` legger inn det som mangler, én om gangen, uten å vise verdien; det er den ene kommandoen for å legge
// inn en nøkkel, også senere, når en plugin eller en klient kommer til.
//
//   node nokler.mjs [sjekk]       hva som trengs, og om det står i hvelvet (bare navn). Exit 0 alt, 1 noe mangler, 2 kunne ikke sjekke
//   node nokler.mjs fyll          legg inn det som mangler (et menneske, i en terminal)
//   node nokler.mjs sett <navn>   skriv én på nytt, for eksempel når den byttes (et menneske, i en terminal)
//
// Med personens egen innlogging i az. Agenten kjører bare sjekk.
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { load } from "./lib/neo-config.mjs";
import { az, envName, hvelv, names } from "./lib/nokler.mjs";
import { enabled, needed } from "./check-setup.mjs";

export class Usage extends Error {}

// Hva som trengs, og om det står i hvelvet. `navnene` er settet fra hvelvet.
export function status(list, navnene) {
  return list.map((n) => ({ ...n, finnes: navnene.has(n.navn) }));
}

const ask = (q, { hidden = false } = {}) =>
  new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => (s.includes(q) ? rl.output.write(s) : undefined);
    rl.question(q, (v) => {
      if (hidden) rl.output.write("\n");
      rl.close();
      res(v.trim());
    });
  });

// Skriver verdien til hvelvet via en fil med 600 som slettes med en gang, så den aldri står i argumentene til en prosess.
export function write(data, navn, verdi, { exec } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "nokkel-"));
  try {
    const f = join(dir, "v");
    writeFileSync(f, verdi, { mode: 0o600 });
    az(["keyvault", "secret", "set", "--vault-name", hvelv(data), "--name", navn, "--file", f, "--encoding", "utf-8", "--query", "name", "-o", "tsv"], exec ? { exec } : {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function fyllEn(data, n) {
  console.log(`\n${n.navn}${n.valgfri ? " (valgfri)" : ""}  ←  ${n.plugin}`);
  console.log(`  ${n.doc}`);
  let verdi;
  if (n.fil) {
    const f = await ask("  Sti til fila (tomt = hopp over): ");
    if (!f) return console.log("  Hoppet over."), false;
    if (!existsSync(f)) throw new Usage(`Fant ikke ${f}`);
    verdi = readFileSync(f, "utf8");
  } else {
    verdi = await ask("  Lim inn verdien og trykk Enter (tomt = hopp over; den vises ikke): ", { hidden: true });
    if (!verdi) return console.log("  Hoppet over."), false;
    console.log(`  Fikk ${verdi.length} tegn.`);
  }
  write(data, n.navn, verdi);
  console.log(`  Lagt inn i ${data.hvelv}.${n.fil ? " Slett fila du lastet opp fra, når den ikke trengs lenger." : ""}`);
  return true;
}

export async function main(argv, { log = console.log } = {}) {
  const [command = "sjekk", arg] = argv;
  if (!["sjekk", "fyll", "sett"].includes(command)) throw new Usage("Bruk: node nokler.mjs [sjekk] | fyll | sett <navn>");
  const { root, data } = load();
  const list = needed(data, enabled(root));
  if ((command === "fyll" || command === "sett") && !process.stdin.isTTY) throw new Usage(`${command} kjøres av et menneske i en terminal, med sin egen innlogging i az. Agenten kjører bare sjekk.`);
  if (command === "sett") {
    const n = list.find((x) => x.navn === arg);
    if (!n) throw new Usage(`${arg ?? "(ingen)"} er ikke en nøkkel pluginene som er på, trenger. De er: ${list.map((x) => x.navn).join(", ") || "ingen"}`);
    await fyllEn(data, n);
    return 0;
  }
  if (!list.length) {
    log("Pluginene som er på, trenger ingen nøkler i hvelvet.");
    return 0;
  }
  const rows = status(list, names(data));
  if (command === "fyll") {
    const mangler = rows.filter((r) => !r.finnes);
    if (!mangler.length) log("Alle nøklene står i hvelvet.");
    let lagt = 0;
    for (const n of mangler) if (await fyllEn(data, n)) lagt++;
    log(`\n${lagt} lagt inn.`);
    return 0;
  }
  log(`Hvelvet: ${data.hvelv}\n\n| Nøkkel | Plugin | I hvelvet | I CI som |\n|---|---|---|---|`);
  for (const r of rows) log(`| \`${r.navn}\` | ${r.plugin} | ${r.finnes ? "ja" : r.valgfri ? "nei (valgfri)" : "❌ nei"} | \`${envName(r.navn)}\` |`);
  const mangler = rows.filter((r) => !r.finnes && !r.valgfri);
  if (mangler.length) log(`\n${mangler.length} mangler. Et menneske legger dem inn med: node "<forvaltning>/scripts/nokler.mjs" fyll`);
  return mangler.length ? 1 : 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(e.message);
      process.exit(2);
    },
  );
}
