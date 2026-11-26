// Avvikene fra mønstrene for god konfig (`plugins/solution/docs/monstre/`), skrevet i design/: et item med
// `avvik: <regel-id>` og `grunn`, og `fil` når avviket bare gjelder én fil i oppsett/. Selve mønstrene vurderes ikke
// her: sjekken vurderer ikke innholdet i konfigfilene. Det gjør Neo i planen, og gjennomgangen av konfigen i et miljø.
// Avviket står så den som går gjennom konfigen, ikke melder det på nytt.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMap, items, mdFiles, text } from "./les.mjs";

export const CHECKS = [{ name: "avvik", about: "Hvert avvik i design/ viser til en regel i mønstrene som finnes og har grunnen, og fila det gjelder, finnes i oppsett/ når løsningen er ute av utkast" }];

// Alle regel-id-ene i mønstrene. Bygget inn i sjekken fra docs/monstre/; fra kildekoden leses de fra mappa.
const MONSTRE = join(dirname(fileURLToPath(import.meta.url)), "..", "plugins", "solution", "docs", "monstre");
export function ruleIds() {
  // eslint-disable-next-line no-undef
  if (typeof __REGEL_IDER__ !== "undefined") return new Set(__REGEL_IDER__);
  if (!existsSync(MONSTRE)) throw new Error(`Fant ikke mønstrene i ${MONSTRE}`);
  return new Set(readdirSync(MONSTRE).filter((f) => f.endsWith(".md")).flatMap((f) => [...readFileSync(join(MONSTRE, f), "utf8").matchAll(/^id: (\S+)/gm)].map((m) => m[1])));
}

// Avviket skrives i designet, før fila finnes: at fila finnes, kreves først når løsningen er ute av utkast (status gir
// statusen per løsning). I felles/, som ikke har en status, er en fil som mangler gul.
export function checkDeviations(root, places, { ids = ruleIds(), status = () => undefined } = {}) {
  const findings = [];
  for (const place of places) {
    for (const file of mdFiles(root, `${place.dir}/design`)) {
      for (const it of items(readFileSync(join(root, file), "utf8"))) {
        if (it.error || !isMap(it.fields) || !("avvik" in it.fields)) continue;
        const at = { check: "avvik", file, line: it.line };
        const regel = String(it.fields.avvik ?? "");
        if (!ids.has(regel)) findings.push({ ...at, message: `${it.id}: regelen «${regel}» finnes ikke i mønstrene. Rett id-en til en regel som finnes (mønstrene i pluginen solution)` });
        if (!text(it.fields.grunn)) findings.push({ ...at, message: `${it.id}: grunn mangler. Skriv hvorfor regelen brytes med vilje` });
        if (!it.fields.fil) continue;
        const fil = `oppsett/${String(it.fields.fil).replace(/^oppsett\//, "")}`;
        if (existsSync(join(root, fil))) continue;
        const s = place.felles ? undefined : status(place.navn);
        if (place.felles) findings.push({ ...at, level: "warn", message: `${it.id}: ${fil} finnes ikke ennå` });
        else if (s !== "utkast") findings.push({ ...at, message: `${it.id}: ${fil} finnes ikke. Avviket kan stå før fila mens løsningen er i utkast; nå er den ${s ?? "uten status"}. Rett stien, eller lag fila i oppsett/` });
      }
    }
  }
  return findings;
}
