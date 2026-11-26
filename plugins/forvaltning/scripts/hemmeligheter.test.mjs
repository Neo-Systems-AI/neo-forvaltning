import { test } from "node:test";
import assert from "node:assert/strict";
import { table } from "./vis-hemmeligheter.mjs";
import { decide } from "./vakt.mjs";

test("hemmelighetene vises med hvor de står og om personen når dem, aldri med verdien", () => {
  const data = {
    neo: { byEnv: { sandkasse: { apiClient: { clientId: "k", clientSecret: { $env: "NEO_K", kilde: "azure-keyvault:kv/neo" } } } } },
    fiks: { hemmeligheter: { passord: { $env: "FIKS_P", kilde: "azure-keyvault:kv/fiks" }, op: { $env: "OP_X", kilde: "1password:op://a/b/c" }, man: { $env: "MAN_X", kilde: "manuell" } } },
  };
  const calls = [];
  const exec = (cmd, args) => {
    calls.push(args.join(" "));
    if (args.includes("fiks")) throw Object.assign(new Error("x"), { stderr: "ERROR: (Forbidden) Caller is not authorized" });
    return "true\n";
  };
  const rows = table(data, { exec, env: {} });
  assert.deepEqual(rows.map((r) => [r.path, r.nar.ok]), [
    ["neo.byEnv.sandkasse.apiClient.clientSecret", true],
    ["fiks.hemmeligheter.passord", false],
    ["fiks.hemmeligheter.op", null],
    ["fiks.hemmeligheter.man", false],
  ]);
  assert.match(rows[1].nar.why, /Forbidden/);
  assert.ok(calls.every((c) => c.includes("--query attributes.enabled")), "bare om den finnes og er slått på");
  assert.equal(table(data, { exec, env: { FIKS_P: "satt" } })[1].nar.why, "satt i miljøet");
  assert.ok(table(data, { utenAz: true }).every((r) => r.nar === null));
});

test("vakten stopper at agenten henter en verdi selv eller leser en fil med hemmeligheter, og slipper resten", () => {
  const bash = (command) => decide({ tool_name: "Bash", tool_input: { command } });
  assert.ok(bash("az keyvault secret show --vault-name kv --name x --query value -o tsv"));
  assert.ok(bash('echo "$(az keyvault secret show --vault-name kv --name x)"'));
  assert.ok(bash("az keyvault secret download --vault-name kv --name x --file /tmp/k"));
  assert.ok(bash("op read op://a/b/c"));
  assert.ok(bash("cat .env.local"));
  assert.ok(bash("printenv"));
  assert.ok(decide({ tool_name: "Read", tool_input: { file_path: "/repo/.env.local" } }));
  assert.ok(decide({ tool_name: "Read", tool_input: { file_path: "/repo/.keys/mp.pem" } }));
  assert.equal(bash("az keyvault secret show --vault-name kv --name x --query attributes.enabled -o tsv"), null);
  assert.equal(bash("node x/vis-hemmeligheter.mjs"), null);
  assert.equal(bash("node x/konfig.mjs plan"), null);
  assert.equal(bash("git status"), null);
  assert.equal(decide({ tool_name: "Read", tool_input: { file_path: "/repo/kunde.yaml" } }), null);
  assert.equal(decide({ tool_name: "Read", tool_input: { file_path: "/repo/.envrc-ikke" } }), null);
});
