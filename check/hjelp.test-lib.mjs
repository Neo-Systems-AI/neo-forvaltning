// Det testene deler: et repo i en midlertidig mappe, og et lite skjema i formen Neo serverer på /api/config/schema.
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

export const URL = "https://neo.test";
export const MANIFEST = {
  apiVersion: "neo-config/v1",
  kinds: [
    { kind: "caseType", directory: "case-types", keyFields: ["slug"], schema: `${URL}/api/config/schema/caseType.schema.json` },
    { kind: "customFieldDefinition", directory: "custom-fields", keyFields: ["entityType", "name"], schema: `${URL}/api/config/schema/customFieldDefinition.schema.json` },
    { kind: "workflow", directory: "workflows", keyFields: ["name"], schema: `${URL}/api/config/schema/workflow.schema.json` },
    { kind: "caseWizard", directory: "case-wizards", keyFields: ["caseType"], schema: `${URL}/api/config/schema/caseWizard.schema.json` },
  ],
  applyOrder: ["customFieldDefinition", "caseType", "workflow", "caseWizard"],
};
const obj = (kind, spec) => ({ type: "object", required: ["apiVersion", "kind", "spec"], additionalProperties: false, properties: { apiVersion: { const: "neo-config/v1" }, kind: { const: kind }, spec } });
export const SCHEMAS = {
  caseType: obj("caseType", { type: "object", required: ["name", "slug"], additionalProperties: false, properties: { name: { type: "string", minLength: 1 }, slug: { type: "string" }, description: { type: ["string", "null"] }, customFields: { type: "array" } } }),
  customFieldDefinition: obj("customFieldDefinition", { type: "object", required: ["name", "entityType"], properties: { name: { type: "string" }, entityType: { type: "string" } } }),
  workflow: obj("workflow", { type: "object", required: ["name"], properties: { name: { type: "string" } } }),
  caseWizard: obj("caseWizard", { type: "object", required: ["caseType"], properties: { caseType: { type: "string" } } }),
};
export const fake = (calls = []) => async (url) => {
  calls.push(url);
  if (url === `${URL}/api/config/schema`) return MANIFEST;
  const k = url.match(/\/(\w+)\.schema\.json$/)?.[1];
  if (k && SCHEMAS[k]) return SCHEMAS[k];
  throw new Error("HTTP 404");
};
export const down = async () => {
  throw new Error("fetch failed");
};

export const caseType = (slug, name = "Parkering", extra = "") => `apiVersion: neo-config/v1\nkind: caseType\nspec:\n  name: ${name}\n  slug: ${slug}\n  description: Søknad om ${name.toLowerCase()}\n${extra}`;
export const CONFIG = JSON.stringify({ version: 2, neo: { url: URL, org: "testorg", mcpServer: "neo-development" } });
export const REPO = (type = "kunde") => `type: ${type}\neier: { navn: Eier }\nforvalter: { navn: F, github: f }\n`;
export const krav = (id, blir = "") => `## ${id} Et krav\n\n\`\`\`yaml\nflyt: deterministisk\nhvorfor: Det står i kilden.\nkilde: [K1]\n${blir}\`\`\`\n`;
export const LOSNING = (status = "utkast") => `formal: Behandle søknader om parkering\neier: Kunden\nstatus: ${status}\nintegrasjoner: []\nbygger-pa: egen\n`;
export const REGISTER = "| Id | Hva | Lagret |\n|---|---|---|\n| K1 | Forskriften | [`filer/K1_forskriften.md`](filer/K1_forskriften.md) |\n";

// Et repo slik det skal være: en løsning med kilde, forståelse, krav som ble en fil, og fila.
export const GOOD = () => ({
  "repo.yaml": REPO(),
  ".claude/neo.config.json": JSON.stringify({ ...JSON.parse(CONFIG), maskinporten: { miljo: "test", hemmeligheter: { "altinn-nokkel": { kilde: "azure-keyvault:kv-kunde/altinn-nokkel", fil: true } } } }),
  ".github/CODEOWNERS": "* @eier/godkjennere\n",
  "felles/kilder/kilder.md": "| Id | Hva |\n|---|---|\n| K1 | Organisasjonskartet |\n",
  "felles/forstaelse/roller-og-tilgang.md": "# Roller\n\n- Seksjonen har fem saksbehandlere. [K1]\n",
  "losninger/parkering/losning.yaml": LOSNING("i-test"),
  "losninger/parkering/kilder/kilder.md": REGISTER,
  "losninger/parkering/kilder/filer/K1_forskriften.md": "§ 1 Fristen er tre uker.\n",
  "losninger/parkering/forstaelse/forlop.md": "# Forløpet\n\n- Fristen er tre uker. [K1]\n\n## Det kildene ikke svarer på\n\n- Hvem leser e-posten?\n",
  "losninger/parkering/krav/forlop.md": krav("frist", "blir:\n  - fil: oppsett/case-types/parkering.yaml\n  - steg: Teamet settes opp i Neo\n    hvorfor: Team er miljø, ikke konfig\n"),
  "losninger/parkering/oppsett/case-types/parkering.yaml": caseType("parkering"),
  "losninger/parkering/test/testcaser/innen-fristen.yaml": "beskrivelse: En søknad innen fristen\npersona: saksbehandler\nforventet:\n  krav: [frist]\n",
  "test/personaer/saksbehandler.yaml": "navn: Sara Saksbehandler\nrolle: saksbehandler\nhemmeligheter:\n  passord: { kilde: azure-keyvault:kv-test/sara }\n",
  "integrasjoner/altinn/hos-kunden.md": "## delegering Deleger tilgangen\n\n```yaml\nstatus: ikke-startet\nhvem: Hovedadministratoren\n```\n",
});
