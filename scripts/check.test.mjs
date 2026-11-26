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
  writeFileSync(join(root, ".claude-plugin/marketplace.json"), JSON.stringify({ name: "m", owner: {}, plugins: [{ name: "p", source: "./plugins/p", version: "1.0.0" }] }));
  writeFileSync(join(root, "plugins/p/.claude-plugin/plugin.json"), JSON.stringify({ name: "p", description: "d", version: "1.0.0", license: "MIT", ...plugin }));
  writeFileSync(join(root, "plugins/p/neo-config.keys.json"), JSON.stringify({ plugin: "p", keys: [] }));
  for (const [f, t] of Object.entries(extra)) writeFileSync(join(root, f), t);
  return root;
};

test("nøkkelfila beskriver bare nøkler, og kopiene fra shared/ er de importene krever, like shared/", () => {
  const root = repo();
  writeFileSync(join(root, "plugins/p/neo-config.keys.json"), JSON.stringify({ plugin: "q", neo: true, keys: [{ path: "x" }] }));
  mkdirSync(join(root, "shared"), { recursive: true });
  mkdirSync(join(root, "plugins/p/scripts/lib"), { recursive: true });
  writeFileSync(join(root, "shared/a.mjs"), 'import { b } from "./b.mjs";\n');
  writeFileSync(join(root, "shared/b.mjs"), "export const b = 1;\n");
  writeFileSync(join(root, "plugins/p/scripts/x.mjs"), 'import { b } from "./lib/a.mjs";\nimport "./lib/borte.mjs";\n');
  writeFileSync(join(root, "plugins/p/scripts/lib/a.mjs"), "// gammel\n");
  writeFileSync(join(root, "plugins/p/scripts/lib/ubrukt.mjs"), "// ingen importerer den\n");
  const msgs = run(root).filter((x) => x.check === "config").map((x) => `${x.file}: ${x.message}`).sort();
  assert.deepEqual(msgs, [
    "plugins/p/neo-config.keys.json: Hver nøkkel har path og doc: {\"path\":\"x\"}",
    "plugins/p/neo-config.keys.json: Nøkkelfila beskriver bare nøkler (keys, hemmeligheter), ikke neo",
    "plugins/p/neo-config.keys.json: plugin er «q», mappa er «p»",
    "plugins/p/scripts/lib/a.mjs: Ikke lik shared/a.mjs. Kjør node scripts/sync-shared.mjs",
    "plugins/p/scripts/lib/b.mjs: Ikke lik shared/b.mjs. Kjør node scripts/sync-shared.mjs",
    "plugins/p/scripts/lib/ubrukt.mjs: Ingen skript eller skill i pluginen bruker den. Kjør node scripts/sync-shared.mjs",
    "plugins/p: Importerer lib/borte.mjs, som ikke finnes i shared/",
  ]);
});

test("beskrivelsen står ett sted: i plugin.json, ikke i marketplace.json", () => {
  const root = repo();
  writeFileSync(join(root, ".claude-plugin/marketplace.json"), JSON.stringify({ name: "m", owner: {}, plugins: [{ name: "p", source: "./plugins/p", description: "d", version: "1.0.0" }] }));
  assert.deepEqual(run(root).map((x) => x.message), ["p: beskrivelsen står i plugin.json; ta den bort fra marketplace.json, så den står ett sted"]);
});

test("en henvisning til en skill som ikke finnes, stoppes i alle filer, også i skriptene; et scope er ikke en skill", () => {
  const root = repo();
  mkdirSync(join(root, "plugins/p/skills/finnes"), { recursive: true });
  mkdirSync(join(root, "plugins/p/scripts"), { recursive: true });
  mkdirSync(join(root, "plugins/p/docs"), { recursive: true });
  writeFileSync(join(root, "plugins/p/skills/finnes/SKILL.md"), "# Finnes\n");
  writeFileSync(join(root, "plugins/p/scripts/x.mjs"), 'throw new Error("Se /p:env");\nconst ok = "/p:finnes";\n');
  writeFileSync(join(root, "plugins/p/README.md"), "| `p:finnes` | ok |\n| `p:borte` | borte |\n");
  writeFileSync(join(root, "plugins/p/docs/a.md"), "Scopet `p:serviceowner` og `p:events.subscribe` er ikke skills.\n");
  const msgs = run(root).filter((x) => x.check === "skills").map((x) => `${x.file}:${x.line} ${x.message}`).sort();
  assert.deepEqual(msgs, ["plugins/p/README.md:2 Viser til p:borte, som ikke er en skill i p", "plugins/p/scripts/x.mjs:1 Viser til p:env, som ikke er en skill i p"]);
});

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

test("en lenke eller en regel i dokumentasjonen til en plugin som ikke finnes, stoppes", () => {
  const root = repo();
  mkdirSync(join(root, "plugins/solution/docs/monstre"), { recursive: true });
  mkdirSync(join(root, "plugins/p/docs"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "plugins/p/docs/a.md"), "# A\n\n## Det som legges i hvelvet\n");
  writeFileSync(join(root, "docs/README.md"), "[A](../plugins/p/docs/a.md) og [X](../plugins/x/docs/x.md)\n");
  writeFileSync(join(root, "plugins/solution/docs/monstre/01-sak.md"), "## en-regel Regelen\n\n```yaml\nid: en-regel\n```\n");
  writeFileSync(join(root, "plugins/solution/docs/monstre/02-status.md"), [
    "krever: [01-sak.md#en-regel, 01-sak.md#borte]",
    "Se [A](../../../p/docs/a.md#det-som-legges-i-hvelvet) og [B](../../../p/docs/b.md) og [C](../../../p/docs/a.md#mangler).",
  ].join("\n"));
  const msgs = run(root).filter((x) => x.check === "docs").map((x) => x.message);
  assert.deepEqual(msgs.sort(), [
    "Lenken peker på #mangler, som ikke er en overskrift i ../../../p/docs/a.md",
    "Lenken peker på ../../../p/docs/b.md, som ikke finnes",
    "Lenken peker på ../plugins/x/docs/x.md, som ikke finnes",
    "Regelen 01-sak.md#borte finnes ikke",
  ]);
});

test("en skill som viser til en annen skill, eller har en dato, stoppes", () => {
  const root = repo();
  mkdirSync(join(root, "plugins/p/skills/a"), { recursive: true });
  mkdirSync(join(root, "plugins/p/skills/b"), { recursive: true });
  writeFileSync(join(root, "plugins/p/skills/b/SKILL.md"), "# B\n");
  writeFileSync(join(root, "plugins/p/skills/a/SKILL.md"), "Kjør /p:b etterpå.\nSe p:a og x:b, og mcp__neo:verktoy.\nAvgjort 2026-11-25.\n");
  const msgs = run(root).filter((x) => x.check === "skills").map((x) => `${x.line}: ${x.message}`);
  assert.equal(msgs.length, 2);
  assert.match(msgs[0], /^1: Viser til \/p:b/);
  assert.match(msgs[1], /^3: En dato/);
});
