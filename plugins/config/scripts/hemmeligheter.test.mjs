import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchAll, parseKilde, refs, SOURCES } from "./hent-hemmeligheter.mjs";
import { decide } from "./vakt.mjs";

const repo = (files) => {
  const root = mkdtempSync(join(tmpdir(), "hent-"));
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), text);
  }
  return root;
};

test("kilden leses", () => {
  assert.deepEqual(parseKilde("azure-keyvault:kv-kunde/svarinn"), { type: "azure-keyvault", rest: "kv-kunde/svarinn" });
  assert.equal(parseKilde("uten-kolon"), null);
});

test("azure-keyvault kaller az med hvelvet og navnet, og bare Key Vault er en kilde", () => {
  let args;
  const v = SOURCES["azure-keyvault"]("kv-kunde/svarinn", (cmd, a) => ((args = [cmd, ...a]), "verdi\n"));
  assert.equal(v, "verdi");
  assert.deepEqual(args.slice(0, 8), ["az", "keyvault", "secret", "show", "--vault-name", "kv-kunde", "--name", "svarinn"]);
  assert.throws(() => SOURCES["azure-keyvault"]("bare-hvelv"), /<hvelv>\/<navn>/);
  assert.deepEqual(Object.keys(SOURCES), ["azure-keyvault"]);
});

test("referansene leses fra integrasjonene og personaene, ikke fra config-fila", () => {
  const root = repo({
    "integrasjoner/fiks/hemmeligheter.yaml": "svarinn-passord:\n  $env: FIKS_SVARINN_PASSORD\n  kilde: azure-keyvault:kv-kunde/svarinn\nmaskinporten-nokkel: { $env: FIKS_MP_NOKKEL, kilde: azure-keyvault:kv-kunde/mp, fil: true }\n",
    "integrasjoner/altinn/neo.yaml": "app: x\n",
    "test/personaer/sara.yaml": "navn: Sara Saksbehandler\nrolle: saksbehandler\nhemmeligheter:\n  passord: { $env: SARA_PASSORD, kilde: manuell }\n",
    "test/personaer/uten.yaml": "navn: Uten Hemmeligheter\nrolle: leser\n",
    ".claude/neo.config.json": JSON.stringify({ fiks: { x: { $env: "IKKE_HER", kilde: "azure-keyvault:a/b" } } }),
  });
  const { list, problems } = refs(root);
  assert.deepEqual(problems, []);
  assert.deepEqual(list.map((r) => [r.path, r.env, r.kilde, r.fil]), [
    ["integrasjoner/fiks/hemmeligheter.yaml#svarinn-passord", "FIKS_SVARINN_PASSORD", "azure-keyvault:kv-kunde/svarinn", false],
    ["integrasjoner/fiks/hemmeligheter.yaml#maskinporten-nokkel", "FIKS_MP_NOKKEL", "azure-keyvault:kv-kunde/mp", true],
    ["test/personaer/sara.yaml#passord", "SARA_PASSORD", "manuell", false],
  ]);
});

test("en verdi i stedet for en referanse, og samme navn med to kilder, er feil uten at verdien vises", () => {
  const root = repo({
    "integrasjoner/a/hemmeligheter.yaml": "passord: hemmelig123\nnokkel: { $env: N, kilde: azure-keyvault:a/b }\n",
    "integrasjoner/b/hemmeligheter.yaml": "nokkel: { $env: N, kilde: azure-keyvault:a/c }\n",
  });
  const { problems } = refs(root);
  assert.equal(problems.length, 2);
  assert.match(problems[0].why, /ikke en referanse/);
  assert.match(problems[1].why, /N har ulike kilder/);
  assert.doesNotMatch(JSON.stringify(problems), /hemmelig123/);
});

test("hentingen skriver .env.local og .keys/ med 600, hopper over manuell, og sier hva som feilet uten verdier", () => {
  const root = mkdtempSync(join(tmpdir(), "hent-"));
  const list = [
    { path: "a#p", env: "SVARINN_PASSORD", kilde: "fake:p", fil: false },
    { path: "a#k", env: "MP_KEY_FILE", kilde: "fake:k", fil: true },
    { path: "a#m", env: "MAN", kilde: "manuell", fil: false },
    { path: "a#u", env: "UTEN_KILDE", kilde: null, fil: false },
    { path: "a#o", env: "OP", kilde: "1password:op://x/y/z", fil: false },
  ];
  const { done, failed } = fetchAll(list, root, { sources: { fake: (r) => (r === "k" ? "-----BEGIN PRIVATE KEY-----" : "hemmelig") } });
  assert.equal(done.length, 3);
  assert.deepEqual(failed.map((f) => f.env), ["UTEN_KILDE", "OP"]);
  assert.match(failed[1].why, /ukjent kilde «1password»/);
  const env = readFileSync(join(root, ".env.local"), "utf8");
  assert.match(env, /SVARINN_PASSORD=hemmelig/);
  assert.match(env, /MP_KEY_FILE=\.keys\/mp_key_file\.pem/);
  assert.doesNotMatch(env, /MAN=/);
  assert.equal(statSync(join(root, ".env.local")).mode & 0o777, 0o600);
});

test("vakten stopper .env, .env.* og .keys/, og hentingen", () => {
  for (const file_path of ["/repo/.env", "/repo/.env.local", "/repo/.env.test", "/repo/.keys/mp.pem", ".keys"]) {
    assert.ok(decide({ tool_name: "Read", tool_input: { file_path } }), file_path);
  }
  assert.ok(decide({ tool_name: "Write", tool_input: { file_path: "/repo/.env.production" } }));
  assert.ok(decide({ tool_name: "Grep", tool_input: { pattern: "x", path: "/repo/.keys" } }));
  for (const command of ["cat .env", "cat .env.local", "grep X .env.development", "cp .keys/a.pem /tmp", "git add .env.local", "node -e \"require('fs').readFileSync('.env')\"", "node x/hent-hemmeligheter.mjs --hent", "printenv"]) {
    assert.ok(decide({ tool_name: "Bash", tool_input: { command } }), command);
  }
});

test("vakten slipper resten", () => {
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "node x/hent-hemmeligheter.mjs --sjekk" } }), null);
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "git check-ignore .env.local" } }), null);
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "ls -la .keys" } }), null);
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "node -e 'console.log(process.env.HOME)'" } }), null);
  assert.equal(decide({ tool_name: "Read", tool_input: { file_path: "/repo/.envrc" } }), null);
  assert.equal(decide({ tool_name: "Read", tool_input: { file_path: "/repo/repo.yaml" } }), null);
  assert.equal(decide({ tool_name: "Bash", tool_input: { command: "git status" } }), null);
});

test("vakten stopper når den ikke kan lese inndataene", () => {
  assert.ok(decide(null));
  assert.ok(decide({}));
  const script = join(dirname(fileURLToPath(import.meta.url)), "vakt.mjs");
  const out = execFileSync("node", [script], { input: "ikke json", encoding: "utf8" });
  assert.equal(JSON.parse(out).hookSpecificOutput.permissionDecision, "deny");
});
