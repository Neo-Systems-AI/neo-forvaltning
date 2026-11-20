import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { docsDir } from "./docs.mjs";

const tmp = () => mkdtempSync(join(tmpdir(), "docs-"));

test("finner docs/ i repoet pluginen står i", () => {
  const root = tmp();
  mkdirSync(join(root, "docs", "monstre"), { recursive: true });
  mkdirSync(join(root, "plugins", "solution"), { recursive: true });
  assert.equal(docsDir("monstre", { pluginRoot: join(root, "plugins", "solution"), known: join(root, "ingen.json") }), join(root, "docs", "monstre"));
});

test("finner docs/ i markedsplassen Claude Code har klonet", () => {
  const cache = tmp();
  const market = tmp();
  mkdirSync(join(market, "docs", "integrasjoner"), { recursive: true });
  const known = join(cache, "known.json");
  writeFileSync(known, JSON.stringify({ "neo-forvaltning": { source: { source: "github", repo: "Neo-Systems-AI/neo-forvaltning" }, installLocation: market } }));
  assert.equal(docsDir("integrasjoner", { pluginRoot: join(cache, "solution", "0.1.0"), known }), join(market, "docs", "integrasjoner"));
});

test("feiler med hvorfor når docs/ ikke finnes", () => {
  const root = tmp();
  assert.throws(() => docsDir("monstre", { pluginRoot: join(root, "a", "b"), known: join(root, "ingen.json") }), /Fant ikke docs\/monstre.*plugin marketplace add/);
});
