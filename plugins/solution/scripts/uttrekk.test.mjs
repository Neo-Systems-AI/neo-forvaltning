import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hent } from "./uttrekk.mjs";
import { run } from "./rules.mjs";

test("uttrekket gir filene reglene leser, med svarene fra Neo uendret", async () => {
  const calls = [];
  const api = {
    get: async (path) => {
      calls.push(["GET", path]);
      return path === "/api/case-types"
        ? [{ slug: "a", name: "Skjenking", description: "" }]
        : [{ name: "Vedtak", isPublished: false }];
    },
    post: async (path, body) => {
      calls.push(["POST", path, body]);
      return [{ name: "Gnr", aiSuggestions: true, extractionCriterion: "" }];
    },
  };
  const dir = mkdtempSync(join(tmpdir(), "uttrekk-"));
  await hent(api, dir);
  assert.deepEqual(calls, [
    ["GET", "/api/case-types"],
    ["POST", "/api/custom-fields/list", {}],
    ["GET", "/api/workflows"],
    ["GET", "/api/config/environment"],
  ]);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, "list_workflows.json"), "utf8")), [{ name: "Vedtak", isPublished: false }]);
  // Reglene får alt de trenger: ingen står som «ikke vurdert».
  assert.deepEqual(run(dir).filter((r) => r.state === "ikke vurdert"), []);
});
