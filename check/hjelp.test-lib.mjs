// Det testene deler: et repo i en midlertidig mappe, og filene i et repo slik det skal være.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const write = (root, path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

export const git = (root, ...args) => execFileSync("git", ["-C", root, "-c", "user.email=t@example.com", "-c", "user.name=T", ...args], { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });

export function repo(files = {}, { commit = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "sjekk-"));
  for (const [p, t] of Object.entries(files)) write(root, p, t);
  git(root, "init", "-q", "-b", "main");
  if (commit) {
    git(root, "add", "-A");
    git(root, "commit", "-q", "--allow-empty", "-m", "init");
  }
  return root;
}

export const caseType = (slug, name = "Parkering", extra = "") => `apiVersion: neo-config/v1\nkind: caseType\nspec:\n  name: ${name}\n  slug: ${slug}\n  description: Søknad om ${name.toLowerCase()}\n${extra}`;
export const CONFIG = JSON.stringify({
  version: 1,
  hvelv: "kv-kunde",
  neo: {
    environments: ["sandkasse", "produksjon"],
    defaultEnv: "sandkasse",
    byEnv: { sandkasse: { mcpServer: "neo-sandkasse", url: "https://neo.test" }, produksjon: { mcpServer: "neo-produksjon", url: "https://neo.test" } },
  },
});
export const KUNDE = (type = "kunde") => `type: ${type}\nkunde: { navn: Eksempel kommune, organisasjonsnummer: "" }\ngodkjenner: { navn: G, github: g }\nforvalter: { navn: F, github: f }\nverktoy: { mal: "0.5.0", forvaltning: "0.3.0" }\n`;
export const krav = (id, blir = "") => `## ${id} Et krav\n\n\`\`\`yaml\nflyt: deterministisk\nhvorfor: Det står i kilden.\nkilde: [K1]\n${blir}\`\`\`\n`;
export const LOSNING = (status = "utkast") => `formal: Behandle søknader om parkering\neier: Kunden\nstatus: ${status}\nintegrasjoner: []\nbygger-pa: egen\n`;
export const REGISTER = "| Id | Hva | Lagret |\n|---|---|---|\n| K1 | Forskriften | [`filer/K1_forskriften.md`](filer/K1_forskriften.md) |\n";

// Et repo slik det skal være: en løsning med kilde, forståelse, krav som ble en fil, og fila.
export const GOOD = () => ({
  "kunde.yaml": KUNDE(),
  ".claude/neo.config.json": JSON.stringify({ ...JSON.parse(CONFIG), maskinporten: { miljo: "test", klienter: { altinn: { clientId: "c" } } } }),
  ".github/CODEOWNERS": "* @eier/godkjennere\n",
  "felles/kilder/kilder.md": "| Id | Hva |\n|---|---|\n| K1 | Organisasjonskartet |\n",
  "felles/forstaelse/roller-og-tilgang.md": "# Roller\n\n- Seksjonen har fem saksbehandlere. [K1]\n",
  "losninger/parkering/losning.yaml": LOSNING("i-test"),
  "losninger/parkering/kilder/kilder.md": REGISTER,
  "losninger/parkering/kilder/filer/K1_forskriften.md": "§ 1 Fristen er tre uker.\n",
  "losninger/parkering/forstaelse/forlop.md": "# Forløpet\n\n- Fristen er tre uker. [K1]\n\n## Det kildene ikke svarer på\n\n- Hvem leser e-posten?\n",
  "losninger/parkering/krav/forlop.md": krav("frist", "blir:\n  - fil: oppsett/case-types/parkering.yaml\n  - steg: Teamet settes opp i Neo\n    hvorfor: Team er miljø, ikke konfig\n"),
  "losninger/parkering/test/testcaser/innen-fristen.yaml": "beskrivelse: En søknad innen fristen\npersona: saksbehandler\nforventet:\n  krav: [frist]\n",
  "losninger/parkering/test/testplan.md": "# Testplanen\n\n## p1 Søknaden innen fristen\n\n```yaml\nkrav: [frist]\n```\n",
  "losninger/parkering/test/runder/2026-11-20.md": "# Runden\n",
  "oppsett/case-types/parkering.yaml": caseType("parkering"),
  "oppsett/manuelt/README.md": "# Det som gjøres for hånd\n",
  "snapshots/sandkasse/case-types/parkering.yaml": caseType("parkering"),
  "snapshots/sandkasse/ikke-med.md": "# Ikke med i filene\n",
  "test/personaer/saksbehandler.yaml": "navn: Sara Saksbehandler\nrolle: saksbehandler\n",
  "integrasjoner/altinn/hos-kunden.md": "## delegering Deleger tilgangen\n\n```yaml\nstatus: ikke-startet\nhvem: Hovedadministratoren\n```\n",
});
