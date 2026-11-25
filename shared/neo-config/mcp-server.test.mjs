import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lookup } from "./mcp-server.mjs";

const data = {
  version: 1,
  neo: { environments: ["development"], defaultEnv: "development", byEnv: { development: { mcpServer: "neo-development", url: "https://neo.example", organisasjon: "demo" } } },
};

test("serveren for standardmiljøet, med navnet på verktøyene og om den er lagt til i repoet", () => {
  const root = mkdtempSync(join(tmpdir(), "mcp-"));
  writeFileSync(join(root, ".mcp.json"), JSON.stringify({ mcpServers: { "neo-development": { type: "http" } } }));
  assert.deepEqual(lookup(data, undefined, { root }), {
    miljo: "development", mcpServer: "neo-development", verktoy: "mcp__neo-development__<verktøy>", url: "https://neo.example", organisasjon: "demo", iRepoet: true,
  });
  assert.equal(lookup(data, "development", { root: mkdtempSync(join(tmpdir(), "mcp-")) }).iRepoet, null);
});

test("et ukjent miljø eller en server som mangler, er en feil med hva som må rettes", () => {
  assert.match(lookup(data, "produksjon").error, /ikke et miljø/);
  assert.match(lookup({ ...data, neo: { ...data.neo, byEnv: {} } }).error, /mcpServer mangler/);
});
