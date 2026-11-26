import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMPLATE, hidden, main } from "./entra.mjs";

// az uten tenant: hvert kall slås opp i `svar` etter argumentene, og kallene huskes.
const fakeAz = (svar) => {
  const calls = [];
  const exec = (cmd, args) => {
    calls.push(args);
    const key = args.join(" ");
    for (const [k, v] of svar) {
      if (!key.includes(k)) continue;
      const r = typeof v === "function" ? v(args) : v;
      return typeof r === "string" ? r : JSON.stringify(r);
    }
    return "";
  };
  return { exec, calls };
};
const run = async (argv, opts) => {
  const lines = [];
  const code = await main(argv, { out: (s) => lines.push(s), err: (s) => lines.push(s), sleepFn: async () => {}, ...opts });
  return { code, text: lines.join("\n"), json: (() => { try { return JSON.parse(lines[0]); } catch { return null; } })() };
};

test("app: fra malen, single tenant med upn, og samtykket for openid og profile; en ny app som ikke er synlig ennå, prøves igjen", async () => {
  let tries = 0;
  const { exec, calls } = fakeAz([
    [`applicationTemplates/${TEMPLATE}/instantiate`, { application: { appId: "app-1" }, servicePrincipal: { id: "sp-1" } }],
    ["ad app update", () => {
      if (++tries < 3) throw Object.assign(new Error("x"), { stderr: "Resource 'app-1' does not exist" });
      return "";
    }],
    ["ad sp show --id 00000003", "graph-sp\n"],
    ["oauth2PermissionGrants", { scope: "openid profile" }],
    ["account show", "tenant-1\n"],
  ]);
  const r = await run(["app"], { exec });
  assert.equal(r.code, 0, r.text);
  assert.deepEqual(r.json, { appId: "app-1", spId: "sp-1", tenant: "tenant-1" });
  assert.equal(tries, 3);
  const grant = JSON.parse(calls.find((a) => a.join(" ").includes("oauth2PermissionGrants")).at(-1));
  assert.deepEqual(grant, { clientId: "sp-1", consentType: "AllPrincipals", resourceId: "graph-sp", scope: "openid profile" });
  assert.ok(calls.some((a) => a.includes("AzureADMyOrg") && a.some((x) => x.includes('"upn"'))));
});

test("kontroller: en app som ikke er single tenant eller mangler upn, gir exit 1 med hva", async () => {
  const { exec } = fakeAz([["ad app show", { audience: "AzureADMultipleOrgs", claims: [] }]]);
  const r = await run(["kontroller", "--app", "a"], { exec });
  assert.equal(r.code, 1);
  assert.deepEqual(r.json.feil, ["Appen er AzureADMultipleOrgs, ikke single tenant (AzureADMyOrg)", "ID-tokenet mangler claimet upn"]);
});

test("tildel: hver gruppe med rollen User på appen", async () => {
  const { exec, calls } = fakeAz([["appRoles", "rolle-1\n"], ["appRoleAssignedTo", (a) => ({ principalDisplayName: JSON.parse(a.at(-1)).principalId })]]);
  const r = await run(["tildel", "--sp", "sp-1", "--gruppe", "g1", "--gruppe", "g2"], { exec });
  assert.deepEqual(r.json.tildelt, ["g1", "g2"]);
  assert.equal(JSON.parse(calls.at(-1).at(-1)).appRoleId, "rolle-1");
  assert.equal((await run(["tildel", "--sp", "sp-1"], { exec })).code, 2);
});

test("scim-tilkobling: tokenet leses skjult, valideres før det lagres, og står aldri i utdataene", async () => {
  const { exec, calls } = fakeAz([["synchronization/jobs --body", { id: "scim.abc" }]]);
  const r = await run(["scim-tilkobling", "--sp", "sp-1", "--url", "https://neo.test/scim"], { exec, readSecret: async () => "scim-token-hemmelig" });
  assert.equal(r.code, 0, r.text);
  assert.deepEqual(r.json, { jobb: "scim.abc" });
  const urls = calls.map((a) => a[a.indexOf("--url") + 1]);
  assert.ok(urls.findIndex((u) => u.endsWith("validateCredentials")) < urls.findIndex((u) => u.endsWith("synchronization/secrets")));
  assert.doesNotMatch(r.text, /scim-token-hemmelig/);
});

test("et hemmelig svar leses bare fra en terminal; uten terminal stopper skriptet", async () => {
  await assert.rejects(hidden("SCIM-token: ", { stdin: { isTTY: false } }), /leses fra terminalen uten å vises. Kjør kommandoen selv/);
  const r = await run(["scim-tilkobling", "--sp", "s", "--url", "u"], { exec: fakeAz([]).exec, readSecret: (p) => hidden(p, { stdin: { isTTY: false } }) });
  assert.equal(r.code, 2);
});

test("scim-mapping: e-posten fra userPrincipalName, og det Entra har lagret, leses tilbake", async () => {
  const schema = () => ({ synchronizationRules: [{ id: "regel-1", objectMappings: [{ sourceObjectName: "User", attributeMappings: [{ targetAttributeName: "userName", source: { expression: "[userPrincipalName]" } }, { targetAttributeName: 'emails[type eq "work"].value', source: { expression: "[mail]" } }] }] }] });
  let saved;
  const { exec } = fakeAz([["--method PUT", (a) => ((saved = JSON.parse(a.at(-1))), "")], ["--method GET", () => saved ?? schema()]]);
  const r = await run(["scim-mapping", "--sp", "s", "--jobb", "j"], { exec });
  assert.equal(r.code, 0, r.text);
  assert.deepEqual(r.json.mapping, ["userName <- [userPrincipalName]", 'emails[type eq "work"].value <- [userPrincipalName]']);
});

test("scim-prov leser svaret som er JSON i en tekststreng, og scim-status skiller en jobb som aldri har kjørt fra en feil", async () => {
  const value = JSON.stringify([{ provisioningSteps: [{ type: "Import", status: "Success", description: "ok" }, { type: "Export", status: "Skipped", description: "already match" }] }]);
  const { exec } = fakeAz([["/schema", { synchronizationRules: [{ id: "r" }] }], ["ad user show", "u-1\n"], ["provisionOnDemand", { value }], ["jobs/j", { status: { code: "Paused", lastExecution: { state: "Failed", timeBegan: "0001-01-01T00:00:00Z" } } }]]);
  assert.deepEqual((await run(["scim-prov", "--sp", "s", "--jobb", "j", "--bruker", "a@b"], { exec })).json.steg, ["Import: Success ok", "Export: Skipped already match"]);
  assert.deepEqual((await run(["scim-status", "--sp", "s", "--jobb", "j"], { exec })).json, { kode: "Paused", sist: "har ikke kjørt", startet: null, feil: null, karantene: null });
});

test("postboksen: Exchange i tenanten, og PowerShell-linjene med omfanget og rollene, sending bare når den er bedt om", async () => {
  const { exec } = fakeAz([["subscribedSkus", { value: [{ skuPartNumber: "AAD_PREMIUM", servicePlans: [{ servicePlanName: "AAD" }] }] }]]);
  assert.deepEqual((await run(["exchange-sjekk"], { exec })).json, { exchange: false, lisenser: [] });
  const r = await run(["exchange-linjer", "--app", "a1", "--sp", "s1", "--postboks", "post@k.example", "--postboks", "byggesak@k.example"], { exec });
  assert.match(r.json.linjer[2], /RecipientRestrictionFilter "PrimarySmtpAddress -eq 'post@k.example' -or PrimarySmtpAddress -eq 'byggesak@k.example'"/);
  assert.equal(r.json.linjer.filter((l) => l.startsWith("New-ManagementRoleAssignment")).length, 2);
  const send = await run(["exchange-linjer", "--app", "a1", "--sp", "s1", "--postboks", "p@k.example", "--send"], { exec });
  assert.ok(send.json.linjer.some((l) => l.includes("Application Mail.Send")));
});

test("feil bruk gir exit 2, og en feil fra az gir første linje og exit 1", async () => {
  assert.equal((await run(["ukjent"], { exec: fakeAz([]).exec })).code, 2);
  assert.equal((await run(["redirect", "--app", "a"], { exec: fakeAz([]).exec })).code, 2);
  const nei = () => {
    throw Object.assign(new Error("x"), { stderr: "ERROR: Insufficient privileges\nmer" });
  };
  const r = await run(["exchange-sjekk"], { exec: nei });
  assert.equal(r.code, 1);
  assert.equal(r.text, "Feil: ERROR: Insufficient privileges");
});
