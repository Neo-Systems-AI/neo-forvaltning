import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyApproved, planAll, yamlFiles } from "./konfig.mjs";
import { summary } from "./planrapport.mjs";
import { NeoApiError } from "./lib/neo-api.mjs";

const oppsett = () => {
  const dir = mkdtempSync(join(tmpdir(), "konfig-"));
  mkdirSync(join(dir, "case-types"));
  mkdirSync(join(dir, "task-template-sets"));
  writeFileSync(join(dir, "case-types/byggesak.yaml"), "kind: caseType\n");
  writeFileSync(join(dir, "task-template-sets/standard.yaml"), "kind: taskTemplateSet\n");
  return dir;
};

// Rekkefølgen Neo gir svaret i (applyOrder): settene før sakstypene.
const rank = (path) => (path.startsWith("task-template-sets/") ? 0 : 1);

// En attrapp av Neo: planen for settet og for én fil, apply, og hva som ble kalt. Settets steg er utsatt til en
// sakstype er skrevet.
const fakeApi = (planFor, { applyError } = {}) => {
  const calls = [];
  return {
    calls,
    settings: { url: "https://neo.example" },
    get: async () => ({}),
    post: async (path, body) => {
      calls.push([path, body.files?.map((f) => f.path) ?? body.file?.path ?? body.paths, body.planHash]);
      if (path === "/api/config/plan-set") {
        const ordered = [...body.files].sort((a, b) => rank(a.path) - rank(b.path));
        return { files: ordered.map((f) => ({ path: f.path, ...planFor(f.path, "sett") })) };
      }
      if (path === "/api/config/plan") return { path: body.file.path, ...planFor(body.file.path, "en") };
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

const changed = (path, via) => ({ action: "update", changes: [{ path: "name", before: "a", after: "b" }], planHash: `${via}:${path}` });
const quiet = { log: () => {} };

test("planen er ett kall med alle filene og teksten deres, i rekkefølgen Neo gir, og ikke-styrt med de stiene", async () => {
  const api = fakeApi(changed);
  const { paths, plans } = await planAll(api, oppsett());
  assert.equal(api.calls[0][0], "/api/config/plan-set");
  assert.deepEqual([...api.calls[0][1]].sort(), ["case-types/byggesak.yaml", "task-template-sets/standard.yaml"]);
  assert.deepEqual(paths, ["task-template-sets/standard.yaml", "case-types/byggesak.yaml"]);
  assert.equal(plans.length, 2);
  assert.deepEqual(api.calls.at(-1), ["/api/config/not-in-files", paths, undefined]);
  assert.equal(api.calls.some(([p]) => p === "/api/config/plan"), false);
});

test("apply skriver i planens rekkefølge med hashene fra settet, og et sett med utsatte steg skrives én gang til med en ny plan", async () => {
  const dir = oppsett();
  const approved = summary((await planAll(fakeApi(changed), dir)).plans);
  const api = fakeApi(changed);
  const result = await applyApproved(api, dir, approved, quiet);
  assert.equal(result.ok, true);
  assert.deepEqual(
    api.calls.filter(([p]) => p === "/api/config/apply").map(([, path, hash]) => [path, hash]),
    [
      ["task-template-sets/standard.yaml", "sett:task-template-sets/standard.yaml"],
      ["case-types/byggesak.yaml", "sett:case-types/byggesak.yaml"],
      ["task-template-sets/standard.yaml", "en:task-template-sets/standard.yaml"],
    ],
  );
});

test("en plan som ikke er den godkjente, stopper før noe skrives", async () => {
  const dir = oppsett();
  const approved = summary((await planAll(fakeApi(changed), dir)).plans);
  const api = fakeApi((path) => ({ action: "update", changes: [{ path: "name", before: "a", after: "c" }], planHash: path }));
  const result = await applyApproved(api, dir, approved, quiet);
  assert.equal(result.ok, false);
  assert.match(result.reason, /ikke den som ble godkjent/);
  assert.equal(api.calls.some(([p]) => p === "/api/config/apply"), false);
});

test("en 409 fra Neo stopper, og sier at planen må lages på nytt", async () => {
  const dir = oppsett();
  const approved = summary((await planAll(fakeApi(changed), dir)).plans);
  const api = fakeApi(changed, { applyError: new NeoApiError("POST", "/api/config/apply", 409, { message: "PLAN_STALE" }) });
  const result = await applyApproved(api, dir, approved, quiet);
  assert.equal(result.ok, false);
  assert.match(result.reason, /409[\s\S]*Lag planen på nytt/);
});

test("filene i oppsettet er .yaml-filene i alle undermappene", () => {
  assert.deepEqual(yamlFiles(oppsett()).sort(), ["case-types/byggesak.yaml", "task-template-sets/standard.yaml"]);
});
