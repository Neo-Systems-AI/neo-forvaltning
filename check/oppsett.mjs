// Konfigfilene i oppsett/ og snapshotene i snapshots/<miljø>/: Neos filer, slik Neo eksporterer dem. Sjekken vurderer
// ikke innholdet: den ser at hver fil er en konfigfil fra Neo (`apiVersion: neo-config/v1`, `kind` og `spec` øverst),
// og om innholdet er gyldig, avgjør Neo i planen (`plan_config` per fil). Den gamle JSON-formen fra før `forvaltning`
// 0.2.0 er rød, og et rått svar (`raw/`) committes ikke. Unntak: README-ene, `ikke-med.md` fra snapshotet og det som
// gjøres for hånd, i `oppsett/manuelt/`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { filesIn } from "./les.mjs";

export const CHECKS = [
  { name: "oppsett", about: "Hver fil i oppsett/ og snapshots/ er en konfigfil fra Neo (neo-config/v1, kind og spec), og ingen rå svar er committet" },
  { name: "brukt", about: "Hver konfigfil i oppsett/ er det et krav ble (blir)" },
];

export const MANUELT = "oppsett/manuelt/";

// Én fil: en konfigfil fra Neo, eller et av unntakene.
export function checkConfigFile(rel, text) {
  if (/(^|\/)README\.md$/.test(rel) || /(^|\/)ikke-med\.md$/.test(rel) || rel.startsWith(MANUELT) || rel.endsWith(".gitkeep")) return [];
  if (rel.endsWith(".json")) return [{ check: "oppsett", file: rel, message: "Formen fra før forvaltning 0.2.0. Ta et nytt snapshot (/forvaltning:snapshot) og bygg oppsettet fra filene Neo skriver" }];
  if (!rel.endsWith(".yaml")) return [{ check: "oppsett", file: rel, message: "Ikke en konfigfil. Oppsettet er .yaml-filer fra Neo; det som gjøres for hånd, står i oppsett/manuelt/. Ta fila bort, eller flytt den dit" }];
  const missing = [/^apiVersion: neo-config\/v1$/m, /^kind: \S+/m, /^spec:/m].filter((re) => !re.test(text));
  return missing.length ? [{ check: "oppsett", file: rel, message: "Ikke en konfigfil fra Neo: den må ha apiVersion: neo-config/v1, kind og spec øverst. Ta et snapshot (/forvaltning:snapshot) og bygg fila fra den Neo skriver" }] : [];
}

// Alle filene i oppsett/ og snapshots/, og konfigfilene i oppsett/ (uten unntakene), som kravene kan peke på.
export function checkConfigFiles(root) {
  const findings = [];
  for (const rel of [...filesIn(root, "oppsett"), ...filesIn(root, "snapshots")]) {
    if (/(^|\/)raw\//.test(rel)) findings.push({ check: "oppsett", file: rel, message: "Et rått svar er committet. raw/ står i .gitignore" });
    else findings.push(...checkConfigFile(rel, readFileSync(join(root, rel), "utf8")));
  }
  const files = filesIn(root, "oppsett").filter((rel) => rel.endsWith(".yaml") && !rel.startsWith(MANUELT));
  return { findings, files };
}

// En konfigfil i oppsett/ som ingen krav har som blir, er gul: en fil uten krav bak seg lages ikke.
export function checkUsed(files, used) {
  return files.filter((f) => !used.has(f)).map((file) => ({ check: "brukt", level: "warn", file, message: "Ingen krav har denne fila som blir. En fil uten krav bak seg lages ikke" }));
}
