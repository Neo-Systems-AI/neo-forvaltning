import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { docsDir } from "./docs.mjs";

test("mønstrene står i docs/ i pluginen, og følger med når den installeres", () => {
  assert.equal(docsDir("monstre"), join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "monstre"));
  const root = mkdtempSync(join(tmpdir(), "docs-"));
  mkdirSync(join(root, "docs", "monstre"), { recursive: true });
  assert.equal(docsDir("monstre", { pluginRoot: root }), join(root, "docs", "monstre"));
});

test("feiler med hvorfor når docs/ ikke finnes", () => {
  const root = mkdtempSync(join(tmpdir(), "docs-"));
  assert.throws(() => docsDir("monstre", { pluginRoot: root }), /Fant ikke docs\/monstre i pluginen/);
});
