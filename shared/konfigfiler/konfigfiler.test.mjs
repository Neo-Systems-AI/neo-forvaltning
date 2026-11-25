import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { collect, fileStem, markdown } from "./konfigfiler.mjs";
import { parseYaml } from "./yaml.mjs";

// Slik Neo skriver en sakstype (YAML fra export, oppdiktet innhold).
export const SAKSTYPE = `apiVersion: neo-config/v1
kind: caseType
spec:
  name: Parkeringstillatelse
  slug: hc-parkering
  description: |-
    Søknad om parkeringstillatelse.
    Kommer inn fra skjemaet.
  color: chart-3
  sequential: false
  isDefault: false
  defaultAgentToolIds: []
  defaultAgentModelId: null
  variantField: null
  taskTemplateRules: []
  aiCapabilityRules: []
  statusGroups:
    - label: Mottak
      sortOrder: 0
      options:
        - label: Ny
          sortOrder: 0
          description: null
  customFields:
    - name: belop
      label: Beløp
      type: number
      entityType: case
      optionsJson: null
      filterable: false
      order: 0
      group: null
      extractionCriterion: ""
      helpText: "I kroner: uten øre"
      aiSuggestions: true
      numberFormat: null
      defaultValue: null
  caseTypeInstructions: []
  templates: []
  caseRunInstructions: []
  caseDataTemplates: []
  taskTemplateSets:
    - sortOrder: 0
      taskTemplateSet: Behandling
  geoLayers: []
`;

const MANIFEST = {
  apiVersion: "neo-config/v1",
  kinds: [
    { kind: "caseType", directory: "case-types", keyFields: ["slug"] },
    { kind: "taskTemplateSet", directory: "task-template-sets", keyFields: ["name"] },
    { kind: "workflow", directory: "workflows", keyFields: ["name"] },
  ],
  applyOrder: ["taskTemplateSet", "caseType", "workflow"],
};

const repo = (files) => {
  const root = mkdtempSync(join(tmpdir(), "konfig-"));
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), text);
  }
  return root;
};

const set = (name) => `apiVersion: neo-config/v1\nkind: taskTemplateSet\nspec:\n  name: ${name}\n  description: null\n  tasks: []\n`;

test("leseren tar en fil slik Neo skriver den", () => {
  const doc = parseYaml(SAKSTYPE);
  assert.equal(doc.spec.description, "Søknad om parkeringstillatelse.\nKommer inn fra skjemaet.");
  assert.deepEqual(doc.spec.statusGroups[0].options, [{ label: "Ny", sortOrder: 0, description: null }]);
  assert.equal(doc.spec.customFields[0].helpText, "I kroner: uten øre");
  assert.deepEqual(doc.spec.defaultAgentToolIds, []);
});

test("filnavnet etter regelen i manifestet", () => {
  assert.equal(fileStem("Behandling av søknad"), "behandling-av-soknad");
  assert.equal(fileStem("case/Ærlig Åpen"), "case-aerlig-apen");
  assert.equal(fileStem("Café"), "cafe");
});

test("stien i Neo er stien under 5-oppsett, i rekkefølgen for apply, og spor.yaml er ikke konfig", () => {
  const root = repo({
    "losninger/parkering/5-oppsett/case-types/hc-parkering.yaml": SAKSTYPE,
    "losninger/parkering/5-oppsett/spor.yaml": "case-types/hc-parkering.yaml: [K1]\n",
    "organisasjon/5-oppsett/task-template-sets/behandling.yaml": set("Behandling"),
  });
  const { files, problems, iRekkefolge } = collect(root, { manifest: MANIFEST });
  assert.deepEqual(problems, []);
  assert.equal(iRekkefolge, true);
  assert.deepEqual(files.map((f) => [f.sti, f.eier, f.nokkel]), [
    ["task-template-sets/behandling.yaml", "organisasjon", "Behandling"],
    ["case-types/hc-parkering.yaml", "parkering", "hc-parkering"],
  ]);
});

test("samme nøkkel to steder stopper, også uten manifestet", () => {
  const root = repo({
    "losninger/a/5-oppsett/task-template-sets/behandling.yaml": set("Behandling"),
    "losninger/b/5-oppsett/task-template-sets/behandling.yaml": set("Behandling"),
  });
  const { problems, iRekkefolge } = collect(root);
  assert.equal(iRekkefolge, false);
  assert.equal(problems.length, 1);
  assert.match(problems[0].melding, /Samme nøkkel to steder: task-template-sets\/behandling\.yaml står i losninger\/a\/.* og losninger\/b\//);
});

test("feil mappe, feil filnavn, feil type og det som ikke er Neos format", () => {
  const root = repo({
    "organisasjon/5-oppsett/task-template-sets/feil-navn.yaml": set("Behandling"),
    "organisasjon/5-oppsett/workflows/behandling.yaml": set("Behandling"),
    "organisasjon/5-oppsett/ukjent/x.yaml": set("X"),
    "organisasjon/5-oppsett/notat.md": "# notat\n",
    "organisasjon/5-oppsett/case-types/tom.yaml": "a: 1\n",
  });
  const messages = collect(root, { manifest: MANIFEST }).problems.map((p) => p.melding);
  assert.equal(messages.length, 5);
  assert.ok(messages.some((m) => /gir task-template-sets\/behandling\.yaml, ikke task-template-sets\/feil-navn\.yaml/.test(m)));
  assert.ok(messages.some((m) => /er taskTemplateSet, men ligger i mappa for workflow/.test(m)));
  assert.ok(messages.some((m) => /ligger ikke rett i en mappe for en type/.test(m)));
  assert.ok(messages.some((m) => /bare konfigfiler/.test(m)));
  assert.ok(messages.some((m) => /mangler kind eller spec/.test(m)));
});

test("tabellen sier når rekkefølgen ikke er fra Neo", () => {
  const md = markdown(collect(repo({ "organisasjon/5-oppsett/task-template-sets/behandling.yaml": set("Behandling") })));
  assert.match(md, /Uten manifestet fra Neo/);
  assert.match(md, /\| 1 \| `organisasjon\/5-oppsett\/task-template-sets\/behandling\.yaml` \| `task-template-sets\/behandling\.yaml` \|/);
});
