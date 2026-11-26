import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, Usage } from "./argumenter.mjs";
import { environment, load, miljo, neo, resolve } from "./neo-config.mjs";
import { gyldigFnr, gyldigOrgnr, maskFnr } from "./fnr.mjs";
import { azEnv, envName, nokkel, names, secretValues } from "./nokler.mjs";
import { basic, call, redact, report } from "./http.mjs";
import { assertion, klient, loadKey, token, tokenFor } from "./maskinporten.mjs";

const repo = (files) => {
  const root = mkdtempSync(join(tmpdir(), "shared-"));
  for (const [p, t] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), t);
  }
  execFileSync("git", ["init", "-q"], { cwd: root });
  return root;
};

// Et oppdiktet fødselsnummer med gyldige kontrollsifre, regnet ut her.
export const lagFnr = (start = "010100") => {
  for (let i = 0; i < 1000; i++) for (let k = 0; k < 100; k++) {
    const id = `${start}${String(i).padStart(3, "0")}${String(k).padStart(2, "0")}`;
    if (gyldigFnr(id)) return id;
  }
};

test("config-fila: version 1 med sandkasse og produksjon under neo.byEnv, og ett-miljø-formen sier hva som er endret", () => {
  const root = repo({ ".claude/neo.config.json": JSON.stringify({ version: 2, neo: { url: "https://neo.test", org: "o", mcpServer: "neo-dev" } }) });
  assert.throws(() => load(root), /version må være 1; neo.url står rett under neo. Miljøene står under neo.byEnv.<miljø>/);
  const neoPart = { environments: ["sandkasse", "produksjon"], defaultEnv: "sandkasse", byEnv: { sandkasse: { mcpServer: "neo-sandkasse", url: "https://sandkasse.test" }, produksjon: { mcpServer: "neo-produksjon", url: "https://neo.test" } } };
  writeFileSync(join(root, ".claude/neo.config.json"), JSON.stringify({ version: 1, neo: neoPart, solution: { off: ["navn-og-slug"] } }));
  writeFileSync(join(root, ".mcp.json"), JSON.stringify({ mcpServers: { "neo-sandkasse": {} } }));
  const { data } = load(root);
  assert.deepEqual(neo(data, root), { miljo: "sandkasse", mcpServer: "neo-sandkasse", url: "https://sandkasse.test", verktoy: "mcp__neo-sandkasse__<verktøy>", iRepoet: true });
  assert.equal(neo(data, root, "produksjon").iRepoet, false);
  assert.throws(() => environment(data, "development"), /«development» er ikke et miljø i Neo. Miljøene: sandkasse, produksjon/);
  const keys = { plugin: "monitoring", neo: true, keys: [{ path: "window", fallback: "24h" }] };
  assert.deepEqual(resolve(data, "window", { keys }), { path: "monitoring.window", value: "24h", source: "plugin-standard" });
  assert.deepEqual(resolve(data, "mcpServer", { keys, env: "produksjon" }), { path: "neo.byEnv.produksjon.mcpServer", value: "neo-produksjon", source: "config" });
  assert.deepEqual(resolve(data, "off", { keys: { plugin: "solution", keys: [{ path: "off", fallback: [] }] } }).value, ["navn-og-slug"]);
  assert.throws(() => resolve(data, "borte", { keys }), /Ukjent nøkkel borte/);
});

test("skillene til forvaltning slår opp miljøet og mappene gjennom lib/neo-config.mjs, også gjennom en symlenke", () => {
  const root = repo({ ".claude/neo.config.json": JSON.stringify({ version: 1, neo: { environments: ["sandkasse", "produksjon"], defaultEnv: "sandkasse", byEnv: { sandkasse: { mcpServer: "neo-sandkasse", url: "https://neo.test" } } } }) });
  const lib = join(dirname(fileURLToPath(import.meta.url)), "..", "plugins", "forvaltning", "scripts", "lib", "neo-config.mjs");
  const dir = mkdtempSync(join(tmpdir(), "lenke-"));
  symlinkSync(lib, join(dir, "neo-config.mjs"));
  const run = (...args) => execFileSync("node", [join(dir, "neo-config.mjs"), ...args], { cwd: root, encoding: "utf8" }).trim();
  assert.deepEqual(JSON.parse(run("--miljo", "sandkasse")), { miljo: "sandkasse", mcpServer: "neo-sandkasse", url: "https://neo.test" });
  assert.deepEqual(JSON.parse(run("--miljo")).miljo, "sandkasse");
  assert.equal(run("--get", "oppsettDir"), "oppsett");
  assert.equal(run("--get", "reportsDir"), "reports");
});

test("miljøet hos et system: --miljo, ellers <system>.miljo, og aldri en stille standard", () => {
  const hosts = { test: 1, produksjon: 2 };
  assert.equal(miljo({ krr: { miljo: "test" } }, "krr", undefined, hosts), "test");
  assert.equal(miljo({ krr: { miljo: "test" } }, "krr", "produksjon", hosts), "produksjon");
  assert.throws(() => miljo({}, "enhetsregisteret", undefined, hosts), /Miljøet for enhetsregisteret er ikke sagt: sett enhetsregisteret.miljo/);
  assert.throws(() => miljo({}, "krr", "prod", hosts), /har ikke miljøet «prod»/);
});

test("en nøkkel hentes fra hvelvet med det faste navnet, én gang per kjøring, eller fra variabelen når den er satt", () => {
  const data = { hvelv: "kv-kunde" };
  const calls = [];
  const exec = (cmd, args, opts) => (calls.push([cmd, ...args, opts.env.AZURE_CONFIG_DIR]), args.includes("fiks--pem-t") ? "-----BEGIN-----\nabc\n-----END-----\n" : "verdi\n");
  const env = { NEO_PERSON_AZURE_CONFIG_DIR: "/person/.azure", AZURE_CONFIG_DIR: "/tjeneste" };
  assert.equal(nokkel(data, "fiks--passord-t", { exec, env }), "verdi");
  assert.equal(nokkel(data, "fiks--passord-t", { exec, env }), "verdi");
  assert.equal(calls.length, 1, "én gang per kjøring");
  assert.deepEqual(calls[0], ["az", "keyvault", "secret", "show", "--vault-name", "kv-kunde", "--name", "fiks--passord-t", "--query", "value", "-o", "tsv", "/person/.azure"], "med personens egen innlogging");
  assert.equal(nokkel(data, "fiks--pem-t", { exec, env }), "-----BEGIN-----\nabc\n-----END-----", "en nøkkelfil er teksten, i minnet");
  assert.equal(nokkel(data, "fiks--ci-t", { exec: () => assert.fail("ikke hvelvet"), env: { FIKS_CI_T: "fra-ci" } }), "fra-ci");
  assert.equal(envName("maskinporten--krr-nokkel"), "MASKINPORTEN_KRR_NOKKEL");
  const borte = () => {
    throw Object.assign(new Error("x"), { stderr: "ERROR: (SecretNotFound) A secret with (name/id) x was not found" });
  };
  assert.throws(() => nokkel(data, "fiks--borte-t", { exec: borte, env: {} }), /Fikk ikke hentet nøkkelen fiks--borte-t fra kv-kunde: ERROR: \(SecretNotFound\).*Legg den inn med \/forvaltning:nokler/);
  assert.equal(nokkel(data, "altinn--valgfri-t", { exec: borte, env: {}, valgfri: true }), null);
  const login = () => {
    throw Object.assign(new Error("x"), { stderr: "ERROR: Please run 'az login' to setup account.\nmore" });
  };
  assert.throws(() => nokkel(data, "fiks--login-t", { exec: login, env: {} }), /Er du logget inn med az login/);
  assert.throws(() => nokkel({}, "fiks--uten-hvelv-t", { exec, env: {} }), /hvelv er ikke satt i .claude\/neo.config.json/);
  assert.throws(() => nokkel(data, "fiks.passord", { exec, env: {} }), /er ikke et navn på en nøkkel/);
  assert.ok(secretValues([], { env: {} }).includes("verdi"), "det som er hentet, sladdes");
  assert.equal(azEnv({}).AZURE_CONFIG_DIR.endsWith(".azure"), true);
  assert.deepEqual([...names(data, { exec: () => '["a--b","c--d"]', env: {} })], ["a--b", "c--d"]);
});

test("fødselsnummer: gyldige kontrollsifre og de personen har gitt maskeres; saksnumre og beløp står", () => {
  const fnr = lagFnr();
  assert.ok(gyldigFnr(fnr) && !gyldigFnr("12345678901"));
  assert.equal(maskFnr(`Søker ${fnr}, sak 12345678901`), `Søker ${fnr.slice(0, 6)}*****, sak 12345678901`);
  assert.equal(maskFnr("nr 12345678901", ["12345678901"]), "nr 123456*****");
  assert.equal(maskFnr("12 ms, 1730000000000, 99999999"), "12 ms, 1730000000000, 99999999");
  assert.ok(gyldigOrgnr("974760673") && !gyldigOrgnr("974760674"));
});

test("argumentene: posisjoner, flagg med og uten verdi, og feil bruk", () => {
  assert.deepEqual(parse(["a", "--miljo", "test", "--json", "--param", "x", "--param", "y"], { verdier: ["miljo"], brytere: ["json"], flere: ["param"] }), { _: ["a"], miljo: "test", json: true, param: ["x", "y"] });
  assert.throws(() => parse(["--ukjent"]), Usage);
  assert.throws(() => parse(["--miljo"], { verdier: ["miljo"] }), /--miljo trenger en verdi/);
});

test("kallet gir status, tid og JSON, og rapporten er sladdet", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ ok: "s3cr3t-verdi" }), { status: 200, headers: { "content-type": "application/json" } });
  const r = await call("https://x.test/a", { fetchImpl });
  assert.equal(r.status, 200);
  assert.doesNotMatch(report("GET", "https://x.test/a", r, ["s3cr3t-verdi"]), /s3cr3t/);
  assert.match(redact(basic("bruker", "passord123")), /Basic \[sladdet\]/);
});

test("Maskinporten: klienten med navn, assertion signert med nøkkelen, og token med issuer fra well-known", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" });
  const { key, kid } = loadKey(pem);
  const [h, p, s] = assertion({ issuer: "https://test.maskinporten.no/", clientId: "c1", scopes: ["ks:fiks"], key, kid, now: 1000 }).split(".");
  assert.ok(createVerify("RSA-SHA256").update(`${h}.${p}`).verify(publicKey, Buffer.from(s, "base64url")));

  const data = { maskinporten: { miljo: "test", klienter: { krr: { clientId: "c1", scopes: ["krr:global/kontaktinformasjon.read"] }, uten: {} } } };
  assert.equal(klient(data, "krr").miljo, "test");
  assert.throws(() => klient(data, "fiks"), /«fiks» står ikke under maskinporten.klienter \(der står: krr, uten\)/);
  assert.throws(() => klient(data, "uten"), /clientId mangler for maskinporten.klienter.uten/);
  assert.throws(() => klient(data, "krr", { miljo: "produksjon" }), /er for test, men kallet går mot produksjon/);
  assert.throws(() => klient({ maskinporten: { klienter: { krr: { clientId: "c" } } } }, "krr"), /maskinporten.miljo mangler/);

  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push(url);
    if (url.endsWith("oauth-authorization-server")) return new Response(JSON.stringify({ issuer: "https://test.maskinporten.no/", token_endpoint: "https://test.maskinporten.no/token" }));
    assert.match(init.body.toString(), /grant_type=urn/);
    return new Response(JSON.stringify({ access_token: "tok-1234", expires_in: 120, scope: "krr:global/kontaktinformasjon.read" }));
  };
  const secrets = [];
  const asked = [];
  const t = await tokenFor({ data, navn: "krr", fetchImpl, secrets, hemmelighet: (d, n) => (asked.push(n), pem) });
  assert.equal(t.accessToken, "tok-1234");
  assert.deepEqual(asked, ["maskinporten--krr-nokkel"]);
  assert.deepEqual(secrets, [pem, "tok-1234"]);
  assert.deepEqual(seen, ["https://test.maskinporten.no/.well-known/oauth-authorization-server", "https://test.maskinporten.no/token"]);
  const avslag = async (url) => (url.endsWith("oauth-authorization-server") ? new Response(JSON.stringify({ issuer: "i", token_endpoint: "https://t/token" })) : new Response(JSON.stringify({ error: "invalid_scope", error_description: "Scope x not allowed" }), { status: 400 }));
  await assert.rejects(token({ miljo: "test", clientId: "c", scopes: ["x"], pem, fetchImpl: avslag }), /Maskinporten avslo: 400 invalid_scope Scope x not allowed/);
});
