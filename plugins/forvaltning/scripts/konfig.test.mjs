import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyApproved, planAll } from "./konfig.mjs";
import { summary } from "./planrapport.mjs";
import { NeoApiError } from "./lib/neo-api.mjs";

const manifest = {
  kinds: [
    { kind: "taskTemplateSet", directory: "task-template-sets" },
    { kind: "caseType", directory: "case-types" },
  ],
  applyOrder: ["taskTemplateSet", "caseType"],
};

const oppsett = () => {
  const dir = mkdtempSync(join(tmpdir(), "konfig-"));
  mkdirSync(join(dir, "case-types"));
  mkdirSync(join(dir, "task-template-sets"));
  writeFileSync(join(dir, "case-types/byggesak.yaml"), "kind: caseType\n");
  writeFileSync(join(dir, "task-template-sets/standard.yaml"), "kind: taskTemplateSet\n");
  return dir;
};

// En attrapp av Neo: planen og apply per sti, og hva som ble kalt. Settets steg er utsatt til en sakstype er skrevet.
const fakeApi = (planFor, { applyError } = {}) => {
  const calls = [];
  return {
    calls,
    settings: { url: "https://neo.example" },
    get: async () => ({}),
    post: async (path, body) => {
      calls.push([path, body.file?.path ?? body.paths]);
      if (path === "/api/config/plan") return { path: body.file.path, ...planFor(body.file.path) };
      if (path === "/api/config/not-in-files") return { objects: [], problems: [] };
      if (path === "/api/config/apply") {
        if (applyError) throw applyError;
        const caseTypeWritten = calls.some(([p, f]) => p === "/api/config/apply" && String(f).startsWith("case-types"));
        return { action: "update", path: body.file.path, deferredSteps: body.file.path.startsWith("task-template-sets") && !caseTypeWritten };
      }
      throw new Error(path);
    },
  };
};

const changed = () => ({ action: "update", changes: [{ path: "name", before: "a", after: "b" }], planHash: "h" });
const quiet = { manifest, log: () => {} };

test("planen tas i manifestets rekkefølge, med teksten fra fila, og ikke-styrt med alle stiene", async () => {
  const api = fakeApi(() => changed());
  const { paths, plans } = await planAll(api, oppsett(), { manifest });
  assert.deepEqual(paths, ["task-template-sets/standard.yaml", "case-types/byggesak.yaml"]);
  assert.equal(plans.length, 2);
  assert.deepEqual(api.calls.at(-1), ["/api/config/not-in-files", paths]);
});

test("apply skriver i rekkefølge, og et sett med utsatte steg skrives én gang til etter sakstypen", async () => {
  const dir = oppsett();
  const approved = summary((await planAll(fakeApi(() => changed()), dir, { manifest })).plans);
  const result = await applyApproved(fakeApi(() => changed()), dir, approved, quiet);
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.applied.map((a) => a.path),
    ["task-template-sets/standard.yaml", "case-types/byggesak.yaml", "task-template-sets/standard.yaml"],
  );
});

test("en plan som ikke er den godkjente, stopper før noe skrives", async () => {
  const dir = oppsett();
  const approved = summary((await planAll(fakeApi(() => changed()), dir, { manifest })).plans);
  const api = fakeApi(() => ({ action: "update", changes: [{ path: "name", before: "a", after: "c" }], planHash: "h" }));
  const result = await applyApproved(api, dir, approved, quiet);
  assert.equal(result.ok, false);
  assert.match(result.reason, /ikke den som ble godkjent/);
  assert.equal(api.calls.some(([p]) => p === "/api/config/apply"), false);
});

test("en 409 fra Neo stopper, og sier at planen må lages på nytt", async () => {
  const dir = oppsett();
  const approved = summary((await planAll(fakeApi(() => changed()), dir, { manifest })).plans);
  const api = fakeApi(() => changed(), { applyError: new NeoApiError("POST", "/api/config/apply", 409, { message: "PLAN_STALE" }) });
  const result = await applyApproved(api, dir, approved, quiet);
  assert.equal(result.ok, false);
  assert.match(result.reason, /409[\s\S]*Lag planen på nytt/);
});
