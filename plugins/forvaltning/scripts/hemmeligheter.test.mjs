import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchAll, parseKilde, SOURCES } from "./hent-hemmeligheter.mjs";
import { decide } from "./vakt.mjs";

test("kilden leses", () => {
  assert.deepEqual(parseKilde("azure-keyvault:kv-kunde/svarinn"), { type: "azure-keyvault", rest: "kv-kunde/svarinn" });
  assert.equal(parseKilde("uten-kolon"), null);
});

test("azure-keyvault kaller az med hvelvet og navnet", () => {
  let args;
  const v = SOURCES["azure-keyvault"]("kv-kunde/svarinn", (cmd, a) => ((args = [cmd, ...a]), "verdi\n"));
  assert.equal(v, "verdi");
  assert.deepEqual(args.slice(0, 8), ["az", "keyvault", "secret", "show", "--vault-name", "kv-kunde", "--name", "svarinn"]);
});

test("1password kaller op read, og manuell hoppes over", () => {
  let args;
  assert.equal(SOURCES["1password"]("op://kunde/svarinn/passord", (cmd, a) => ((args = [cmd, ...a]), "v")), "v");
  assert.deepEqual(args, ["op", "read", "--no-newline", "op://kunde/svarinn/passord"]);
  assert.throws(() => SOURCES["1password"]("feil"), /op:\/\//);
  const root = mkdtempSync(join(tmpdir(), "hent-"));
  const { done, failed } = fetchAll([{ path: "x", env: "MAN", kilde: "manuell", fil: false }], root, { sources: {} });
  assert.deepEqual([done.length, failed.length, done[0].manuell], [1, 0, true]);
  assert.doesNotMatch(readFileSync(join(root, ".env.local"), "utf8"), /MAN=/);
});

test("hentingen skriver .env.local og .keys/ med 600, og sier hva som feilet uten verdier", () => {
  const root = mkdtempSync(join(tmpdir(), "hent-"));
  const list = [
    { path: "fiks.byEnv.test.passord", env: "SVARINN_PASSORD", kilde: "fake:p", fil: false },
    { path: "maskinporten.byEnv.test.nokkel", env: "MP_KEY_FILE", kilde: "fake:k", fil: true },
    { path: "krr.byEnv.test.x", env: "UTEN_KILDE", kilde: null, fil: false },
  ];
  const { done, failed } = fetchAll(list, root, { sources: { fake: (r) => (r === "k" ? "-----BEGIN PRIVATE KEY-----" : "hemmelig") } });
  assert.equal(done.length, 2);
  assert.deepEqual(failed.map((f) => [f.env, f.why]), [["UTEN_KILDE", "ingen kilde i config-fila"]]);
  const env = readFileSync(join(root, ".env.local"), "utf8");
  assert.match(env, /SVARINN_PASSORD=hemmelig/);
  assert.match(env, /MP_KEY_FILE=\.keys\/mp_key_file\.pem/);
  assert.equal(statSync(join(root, ".env.local")).mode & 0o777, 0o600);
});

test("vakten stopper lesing av hemmelighetene og hentingen, og slipper resten", () => {
  assert.ok(decide({ tool_name: "Read", tool_input: { file_path: "/repo/.env.local" } }));
  assert.ok(decide({ tool_name: "Read", tool_input: { file_path: "/repo/.keys/mp.pem" } }));
  assert.ok(decide({ tool_name: "Bash", tool_input: { command: "cat .env.local" } }));
  assert.ok(decide({ tool_name: "Bash", tool_input: { command: "node x/hent-hemmeligheter.mjs --hent" } }));
  assert.ok(decide({ tool_name: "Bash", tool_input: { command: "printenv" } }));
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "node x/hent-hemmeligheter.mjs --sjekk" } }), null);
  assert.equal(decide({ tool_name: "Read", tool_input: { file_path: "/repo/kunde.yaml" } }), null);
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "git status" } }), null);
});
