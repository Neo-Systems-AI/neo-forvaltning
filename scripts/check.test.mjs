import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "./check.mjs";

const repo = (plugin = {}, extra = {}) => {
  const root = mkdtempSync(join(tmpdir(), "check-"));
  mkdirSync(join(root, ".claude-plugin"));
  mkdirSync(join(root, "plugins/p/.claude-plugin"), { recursive: true });
  writeFileSync(join(root, ".claude-plugin/marketplace.json"), JSON.stringify({ name: "m", owner: {}, plugins: [{ name: "p", source: "./plugins/p", description: "d", version: "1.0.0" }] }));
  writeFileSync(join(root, "plugins/p/.claude-plugin/plugin.json"), JSON.stringify({ name: "p", description: "d", version: "1.0.0", license: "MIT", ...plugin }));
  for (const [f, t] of Object.entries(extra)) writeFileSync(join(root, f), t);
  return root;
};

test("et rent repo har ingen funn", () => assert.deepEqual(run(repo()), []));
test("ulik versjon og manglende lisens stoppes", () => {
  const checks = run(repo({ version: "1.1.0", license: undefined })).map((x) => x.check).sort();
  assert.deepEqual(checks, ["manifests", "versions"]);
});
test("en intern vert stoppes med linja", () => {
  const [x] = run(repo({}, { "README.md": "ok\nse https://example.ghe.com/x\n" }));
  assert.equal(x.check, "public");
  assert.equal(x.line, 2);
});
