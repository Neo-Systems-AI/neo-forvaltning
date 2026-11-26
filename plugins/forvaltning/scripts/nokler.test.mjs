import { test } from "node:test";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import { status, write } from "./nokler.mjs";
import { needed, rows } from "./check-setup.mjs";
import { decide } from "./vakt.mjs";

const data = {
  version: 1,
  hvelv: "kv-kunde",
  neo: { environments: ["sandkasse", "produksjon"], defaultEnv: "sandkasse", byEnv: { sandkasse: { url: "https://neo.test", apiClient: { clientId: "k" } } } },
  maskinporten: { miljo: "test", klienter: { fiks: { clientId: "f" }, krr: { clientId: "c" } } },
  fiks: { miljo: "test", klient: "fiks" },
};

test("nøklene som trengs, følger av pluginene som er på og klientene, med de faste navnene, hver én gang", () => {
  assert.deepEqual(needed(data, ["forvaltning", "solution", "fiks", "maskinporten"]).map((n) => [n.navn, !!n.valgfri, !!n.fil]), [
    ["neo--sandkasse-klient", false, false],
    ["maskinporten--fiks-nokkel", false, true],
    ["fiks--integrasjon-passord", true, false],
    ["fiks--svarinn-passord", true, false],
    ["maskinporten--krr-nokkel", false, true],
  ]);
  assert.deepEqual(needed(data, ["monitoring", "data"]), [], "pluginene som går gjennom MCP, trenger ingen");
  const uten = rows({ ...data, hvelv: undefined }, "documaster").find((r) => r.nokkel === "documaster--client-secret");
  assert.deepEqual([uten.ok, uten.source], [false, "usatt"], "uten hvelv kan nøkkelen ikke finnes");
});

test("sjekken sier om hver nøkkel står i hvelvet, bare med navn", () => {
  const list = needed(data, ["fiks"]);
  assert.deepEqual(status(list, new Set(["maskinporten--fiks-nokkel"])).map((r) => [r.navn, r.finnes]), [
    ["maskinporten--fiks-nokkel", true],
    ["fiks--integrasjon-passord", false],
    ["fiks--svarinn-passord", false],
  ]);
});

test("en verdi skrives til hvelvet via en fil som slettes, aldri i argumentene", () => {
  let args;
  let fil;
  write(data, "fiks--svarinn-passord", "hemmelig-verdi", {
    exec: (cmd, a) => {
      args = [cmd, ...a];
      fil = a[a.indexOf("--file") + 1];
      return "fiks--svarinn-passord\n";
    },
  });
  assert.deepEqual(args.slice(0, 7), ["az", "keyvault", "secret", "set", "--vault-name", "kv-kunde", "--name"]);
  assert.ok(!args.includes("hemmelig-verdi"));
  assert.equal(existsSync(fil), false, "fila er slettet");
});

test("vakten stopper at agenten henter eller legger inn en verdi selv, og slipper sjekken", () => {
  const bash = (command) => decide({ tool_name: "Bash", tool_input: { command } });
  assert.ok(bash("az keyvault secret show --vault-name kv --name x --query value -o tsv"));
  assert.ok(bash('echo "$(az keyvault secret show --vault-name kv --name x)"'));
  assert.ok(bash("az keyvault secret set --vault-name kv --name x --value y"));
  assert.ok(bash('node "/p/scripts/nokler.mjs" fyll'));
  assert.ok(bash("node /p/scripts/nokler.mjs sett fiks--svarinn-passord"));
  assert.ok(bash("op read op://a/b/c"));
  assert.ok(bash("cat .env.local"));
  assert.ok(bash("printenv"));
  assert.ok(decide({ tool_name: "Read", tool_input: { file_path: "/repo/.keys/mp.pem" } }));
  assert.equal(bash("node /p/scripts/nokler.mjs"), null);
  assert.equal(bash("node /p/scripts/nokler.mjs sjekk"), null);
  assert.equal(bash("node x/konfig.mjs plan"), null);
  assert.equal(decide({ tool_name: "Read", tool_input: { file_path: "/repo/kunde.yaml" } }), null);
});
