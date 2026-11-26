import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkPath, unwrap, write } from "./skriv-eksport.mjs";
import { loadManifest, order } from "./rekkefolge.mjs";
import { differences, markdown, summary } from "./planrapport.mjs";
import { tokensIn, tokensInDir } from "./miljo-nokler.mjs";

test("miljø-nøklene: integrasjoner og postbokser, med og uten anførselstegn, og ingenting annet", () => {
  const text = [
    "spec:",
    "  definition:",
    "    nodes:",
    "      - id: krr",
    "        data:",
    "          integrationId: ref:integration:KRR/Kontaktregisteret",
    "      - id: arkiv",
    "        data:",
    '          integrationId: "ref:integration:DOCUMASTER/Arkiv %2F bygg"',
    "      - id: epost",
    "        data:",
    "          inputs:",
    "            sender:",
    "              integrationId: 'ref:mailbox:MICROSOFT/postmottak@kommune.example'",
    "            caseTypeId: ref:caseType:byggesak",
    "            notat: ikke ref:integration:X/Y midt i en tekst",
  ].join("\n");
  assert.deepEqual(tokensIn(text), [
    "ref:integration:KRR/Kontaktregisteret",
    "ref:integration:DOCUMASTER/Arkiv %2F bygg",
    "ref:mailbox:MICROSOFT/postmottak@kommune.example",
  ]);
  const dir = tmp();
  mkdirSync(join(dir, "workflows"), { recursive: true });
  writeFileSync(join(dir, "workflows/a.yaml"), text);
  writeFileSync(join(dir, "workflows/b.yaml"), "x: ref:integration:KRR/Kontaktregisteret\n");
  assert.equal(tokensInDir(dir).length, 3);
});

const tmp = () => mkdtempSync(join(tmpdir(), "forvaltning-"));
const TYPE = "apiVersion: neo-config/v1\nkind: caseType\nspec:\n  name: Byggesak\n  slug: byggesak\n";

const svar = (files, notExported = []) => ({ ok: true, files, notExported });

test("eksporten skrives som Neo ga den, og ikke-med står med grunnen", () => {
  const dir = tmp();
  const r = write(svar([{ path: "case-types/byggesak.yaml", text: TYPE }], [{ rootType: "instruction", name: "Regel", reason: "bølge 2" }]), dir);
  assert.deepEqual(r.nye, ["case-types/byggesak.yaml"]);
  assert.equal(readFileSync(join(dir, "case-types/byggesak.yaml"), "utf8"), TYPE);
  assert.match(readFileSync(join(dir, "ikke-med.md"), "utf8"), /\| instruction \| Regel \| bølge 2 \|/);
});

test("en fil Neo ikke lenger har, fjernes; en lik fil røres ikke", () => {
  const dir = tmp();
  mkdirSync(join(dir, "workflows"), { recursive: true });
  writeFileSync(join(dir, "workflows/gammel.yaml"), "x");
  mkdirSync(join(dir, "case-types"), { recursive: true });
  writeFileSync(join(dir, "case-types/byggesak.yaml"), TYPE);
  const r = write(svar([{ path: "case-types/byggesak.yaml", text: TYPE }]), dir);
  assert.deepEqual(r.uendret, ["case-types/byggesak.yaml"]);
  assert.deepEqual(r.fjernet, ["workflows/gammel.yaml"]);
  assert.equal(existsSync(join(dir, "workflows/gammel.yaml")), false);
});

test("MCP-innpakningen pakkes ut", () => {
  const inner = svar([]);
  assert.deepEqual(unwrap({ content: [{ type: "text", text: JSON.stringify(inner) }] }), inner);
});

test("ok:false skriver ingenting og sier hva som må rettes i Neo", () => {
  const dir = tmp();
  assert.throws(
    () => write({ ok: false, problems: [{ kind: "taskTemplateSet", name: "Standard", problems: ["to sett heter det samme"] }], layoutProblems: [], notExported: [] }, dir),
    /taskTemplateSet «Standard»: to sett heter det samme/,
  );
  assert.equal(existsSync(join(dir, "ikke-med.md")), false);
});

test("en sti ut av mappa avvises", () => {
  assert.ok(checkPath("../x.yaml"));
  assert.ok(checkPath("/etc/x.yaml"));
  assert.ok(checkPath("case-types/x.json"));
  assert.equal(checkPath("case-types/byggesak.yaml"), null);
  assert.throws(() => write(svar([{ path: "../ut.yaml", text: "x" }]), tmp()), /ikke en relativ sti/);
});

const manifest = {
  kinds: [
    { kind: "caseType", directory: "case-types" },
    { kind: "taskStatusGroup", directory: "task-status-groups" },
    { kind: "workflow", directory: "workflows" },
  ],
  applyOrder: ["taskStatusGroup", "caseType", "workflow"],
};

test("rekkefølgen er manifestets, alfabetisk innenfor en type", () => {
  assert.deepEqual(order(["workflows/a.yaml", "case-types/b.yaml", "case-types/a.yaml", "task-status-groups/z.yaml"], manifest), [
    "task-status-groups/z.yaml",
    "case-types/a.yaml",
    "case-types/b.yaml",
    "workflows/a.yaml",
  ]);
});

test("en fil i en mappe Neo ikke kjenner, er en feil", () => {
  assert.throws(() => order(["maler/x.yaml"], manifest), /maler\/x\.yaml/);
});

test("manifestet hentes fra adressen", async () => {
  let asked;
  const fake = async (url) => {
    asked = url;
    return { ok: true, json: async () => manifest };
  };
  assert.deepEqual(await loadManifest("https://neo.example/", fake), manifest);
  assert.equal(asked, "https://neo.example/api/config/schema");
});

const plans = [
  { action: "update", kind: "caseType", key: "byggesak", path: "case-types/byggesak.yaml", changes: [{ path: "name", before: "Bygg", after: "Byggesak" }], notRemoved: ["Statusen «Ny / Mottatt»"], deferredSteps: false, planHash: "a" },
  { action: "rejected", kind: "workflow", key: null, path: "workflows/x.yaml", reasons: ["Pekeren finnes ikke"] },
  { action: "unchanged", kind: "taskStatusGroup", key: "Ny", path: "task-status-groups/ny.yaml", changes: [], notRemoved: [], deferredSteps: false, planHash: "b" },
];

test("rapporten viser Neo sine svar: endringer, det som blir stående, avvist og ikke styrt", () => {
  const md = markdown({ plans, notInFiles: { objects: [{ kind: "workflow", key: "Gammel", path: "workflows/gammel.yaml" }], problems: [] } });
  assert.match(md, /0 nye, 1 endret, 1 uendret, 1 avvist/);
  assert.match(md, /\| `name` \| "Bygg" \| "Byggesak" \|/);
  assert.match(md, /blir stående i Neo: Statusen «Ny \/ Mottatt»/);
  assert.match(md, /`workflows\/x\.yaml`: Pekeren finnes ikke/);
  assert.match(md, /workflow «Gammel»/);
});

test("sjekken mot godkjent plan: samme endringer går, ny planHash teller ikke", () => {
  const approved = summary(plans);
  const again = plans.map((p) => ({ ...p, planHash: "ny" }));
  assert.deepEqual(differences(approved, again), []);
  const changed = plans.map((p) => (p.path === "case-types/byggesak.yaml" ? { ...p, changes: [] } : p));
  assert.deepEqual(differences(approved, changed), ["case-types/byggesak.yaml: endringene er ikke de samme som ble godkjent"]);
  assert.deepEqual(differences(approved, [...plans, { action: "create", path: "workflows/ny.yaml", changes: [] }]), ["workflows/ny.yaml: var ikke med i planen som ble godkjent"]);
});
