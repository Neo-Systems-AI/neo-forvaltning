#!/usr/bin/env node
// Det deterministiske i oppsettet i kundens Microsoft-tenant for Neo: kommandoene mot Entra og Microsoft Graph med
// `az`, kjørt av et menneske med sin egen innlogging (`az login --allow-no-subscriptions`). Hver kommando gjør ett
// steg og skriver ut det neste steget trenger. Client secret og SCIM-token går aldri gjennom skriptet til en fil eller
// til utdataene: tokenet leses fra terminalen uten å vises, og bare når skriptet kjøres i en terminal.
//
//   SSO og SCIM
//   node entra.mjs app [--navn Neo]                        appen fra Microsofts mal: single tenant, upn, samtykket
//   node entra.mjs kontroller --app <appId>                 at appen er single tenant, med upn og samtykket
//   node entra.mjs tildel --sp <spId> --gruppe <id> …       gruppene til appen
//   node entra.mjs redirect --app <appId> --uri <uri>       redirect-adressen Neo gir
//   node entra.mjs scim-tilkobling --sp <spId> --url <Tenant URL>   jobben, og tilkoblingen med tokenet (leses skjult)
//   node entra.mjs scim-mapping --sp <spId> --jobb <id>     e-posten fra userPrincipalName, og kontrollen av den
//   node entra.mjs scim-prov --sp <spId> --jobb <id> --bruker <upn>
//   node entra.mjs scim-start --sp <spId> --jobb <id>
//   node entra.mjs scim-status --sp <spId> --jobb <id>
//
//   Felles postboks
//   node entra.mjs exchange-sjekk                           har tenanten Exchange Online?
//   node entra.mjs postboks-app [--navn "Neo innboks"]      appen for innboksen: klient-ID og objekt-ID
//   node entra.mjs exchange-linjer --app <appId> --sp <spId> --postboks <adresse> … [--send]
//
//   Prøve og rydding
//   node entra.mjs testbrukere --domene <underdomene> [--antall 3]   passordet leses skjult
//   node entra.mjs rydd --app <appId> [--gruppe <id> …] [--domene <underdomene>]
import { realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parse, Usage } from "./lib/argumenter.mjs";

const GRAPH = "https://graph.microsoft.com/v1.0";
// Microsofts mal for egne apper («Integrate any other application you don't find in the gallery»). Det er malen som
// gir fanen Provisioning; en app laget bare som appregistrering har den ikke.
export const TEMPLATE = "8adf8e6e-67b2-4cf2-a259-e3dc5476c621";
const GRAPH_APP = "00000003-0000-0000-c000-000000000000";

const az = (exec, args) => exec("az", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const json = (s) => (s && s.trim() ? JSON.parse(s) : null);
const rest = (exec, method, url, body) => json(az(exec, ["rest", "--method", method, "--url", url, ...(body === undefined ? [] : ["--body", typeof body === "string" ? body : JSON.stringify(body)])]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// En ny app bruker litt tid på å bli synlig. Prøv igjen en stund før det er en feil.
async function retry(fn, { tries = 6, wait = 5000, sleepFn = sleep } = {}) {
  for (let i = 1; ; i++) {
    try {
      return fn();
    } catch (e) {
      if (i >= tries || !/does not exist|not found|NotFound|Request_ResourceNotFound/i.test(String(e.stderr || e.message))) throw e;
      await sleepFn(wait);
    }
  }
}

// Et hemmelig svar fra terminalen, uten at det vises. Kjører skriptet uten terminal (som fra en agent), stopper det:
// tokenet skal fra Neo til Entra gjennom personen, ikke gjennom en logg.
export async function hidden(prompt, { stdin = process.stdin, stdout = process.stdout } = {}) {
  if (!stdin.isTTY) throw new Usage(`${prompt.replace(/: $/, "")} leses fra terminalen uten å vises. Kjør kommandoen selv, i en terminal`);
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  let v = "";
  return new Promise((resolve) => {
    const on = (d) => {
      for (const c of d.toString("utf8")) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", on);
          stdout.write("\n");
          return resolve(v);
        }
        if (c === "\u0003") process.exit(130);
        v = c === "\u007f" ? v.slice(0, -1) : v + c;
      }
    };
    stdin.on("data", on);
  });
}

export const COMMANDS = {
  // Appen fra malen, gjort klar til innlogging: single tenant, claimet upn på ID-tokenet (Neo leser hvem som logger
  // inn, fra upn), og administratorsamtykke for openid og profile, som er alt Neo ber om.
  async app({ exec, args, sleepFn }) {
    const r = rest(exec, "POST", `${GRAPH}/applicationTemplates/${TEMPLATE}/instantiate`, { displayName: args.navn ?? "Neo" });
    const appId = r.application.appId;
    const spId = r.servicePrincipal.id;
    await retry(() => az(exec, ["ad", "app", "update", "--id", appId, "--sign-in-audience", "AzureADMyOrg", "--optional-claims", JSON.stringify({ idToken: [{ name: "upn", essential: false }] })]), { sleepFn });
    const graphSp = az(exec, ["ad", "sp", "show", "--id", GRAPH_APP, "--query", "id", "-o", "tsv"]).trim();
    rest(exec, "POST", `${GRAPH}/oauth2PermissionGrants`, { clientId: spId, consentType: "AllPrincipals", resourceId: graphSp, scope: "openid profile" });
    return { appId, spId, tenant: az(exec, ["account", "show", "--query", "tenantId", "-o", "tsv"]).trim() };
  },

  kontroller({ exec, args }) {
    const app = json(az(exec, ["ad", "app", "show", "--id", need(args, "app"), "--query", "{audience:signInAudience, claims:optionalClaims.idToken[].name}"]));
    const feil = [];
    if (app.audience !== "AzureADMyOrg") feil.push(`Appen er ${app.audience}, ikke single tenant (AzureADMyOrg)`);
    if (!(app.claims ?? []).includes("upn")) feil.push("ID-tokenet mangler claimet upn");
    return { ...app, ok: !feil.length, feil };
  },

  // Gruppene til appen. Appen fra malen krever tildeling, så ingen kommer inn før de er tildelt, og det er samme liste
  // SCIM provisjonerer. Medlemmene må være direkte medlemmer: nestede grupper telles ikke.
  tildel({ exec, args }) {
    const sp = need(args, "sp");
    const grupper = args.gruppe;
    if (!grupper.length) throw new Usage("Si gruppene med --gruppe <Object ID> (én eller flere)");
    const rolle = az(exec, ["ad", "sp", "show", "--id", sp, "--query", "appRoles[?displayName=='User'].id | [0]", "-o", "tsv"]).trim();
    return { tildelt: grupper.map((g) => rest(exec, "POST", `${GRAPH}/servicePrincipals/${sp}/appRoleAssignedTo`, { principalId: g, resourceId: sp, appRoleId: rolle }).principalDisplayName) };
  },

  redirect({ exec, args }) {
    az(exec, ["ad", "app", "update", "--id", need(args, "app"), "--web-redirect-uris", need(args, "uri")]);
    return { redirect: json(az(exec, ["ad", "app", "show", "--id", args.app, "--query", "web.redirectUris"])) };
  },

  // Jobben fra malen scim, og tilkoblingen: validert først, så lagret. Ingen av de to gir utdata når de går bra.
  async "scim-tilkobling"({ exec, args, readSecret }) {
    const sp = need(args, "sp");
    const url = need(args, "url");
    const token = await readSecret("SCIM-token fra Neo: ");
    const jobb = rest(exec, "POST", `${GRAPH}/servicePrincipals/${sp}/synchronization/jobs`, { templateId: "scim" }).id;
    const credentials = [{ key: "BaseAddress", value: url }, { key: "SecretToken", value: token }];
    rest(exec, "POST", `${GRAPH}/servicePrincipals/${sp}/synchronization/jobs/${jobb}/validateCredentials`, { credentials });
    rest(exec, "PUT", `${GRAPH}/servicePrincipals/${sp}/synchronization/secrets`, { value: credentials });
    return { jobb };
  },

  // Neo bruker UPN som e-post ved innlogging. Er e-posten i provisjoneringen en annen, blir brukeren opprettet to ganger.
  // Malen henter userName fra UPN, men e-posten fra mail; den byttes, og det Entra har lagret, leses tilbake.
  "scim-mapping"({ exec, args }) {
    const base = `${GRAPH}/servicePrincipals/${need(args, "sp")}/synchronization/jobs/${need(args, "jobb")}/schema`;
    const schema = rest(exec, "GET", base);
    const users = schema.synchronizationRules.flatMap((r) => r.objectMappings).filter((m) => m.sourceObjectName === "User");
    for (const m of users) for (const a of m.attributeMappings) if (a.targetAttributeName === 'emails[type eq "work"].value') a.source = { expression: "[userPrincipalName]", name: "userPrincipalName", type: "Attribute", parameters: [] };
    rest(exec, "PUT", base, schema);
    const lagret = rest(exec, "GET", base);
    const rader = lagret.synchronizationRules.flatMap((r) => r.objectMappings).filter((m) => m.sourceObjectName === "User").flatMap((m) => m.attributeMappings).filter((a) => a.targetAttributeName === "userName" || a.targetAttributeName.startsWith("emails")).map((a) => `${a.targetAttributeName} <- ${a.source?.expression}`);
    return { regel: lagret.synchronizationRules[0]?.id, mapping: rader, ok: rader.length > 0 && rader.every((r) => r.endsWith("[userPrincipalName]")) };
  },

  // Én bruker før jobben startes. Svaret er én tekststreng med JSON inni. Står eksporten som Skipped med «already
  // match», er brukeren alt lik i Entra og Neo.
  "scim-prov"({ exec, args }) {
    const base = `${GRAPH}/servicePrincipals/${need(args, "sp")}/synchronization/jobs/${need(args, "jobb")}`;
    const regel = rest(exec, "GET", `${base}/schema`).synchronizationRules[0].id;
    const bruker = az(exec, ["ad", "user", "show", "--id", need(args, "bruker"), "--query", "id", "-o", "tsv"]).trim();
    const svar = rest(exec, "POST", `${base}/provisionOnDemand`, { parameters: [{ ruleId: regel, subjects: [{ objectId: bruker, objectTypeName: "User" }] }] });
    const steg = (typeof svar.value === "string" ? JSON.parse(svar.value) : svar.value).flatMap((x) => x.provisioningSteps ?? []);
    return { steg: steg.map((s) => `${s.type}: ${s.status} ${s.description ?? ""}`.trim()) };
  },

  // En prøve for én bruker sender ikke gruppene, og en ny jobb står stille til den er startet.
  "scim-start"({ exec, args }) {
    rest(exec, "POST", `${GRAPH}/servicePrincipals/${need(args, "sp")}/synchronization/jobs/${need(args, "jobb")}/start`);
    return COMMANDS["scim-status"]({ exec, args });
  },

  // En jobb som aldri har kjørt, viser Paused og Failed med tidspunktet 0001-01-01: standardverdiene, ikke en feil.
  "scim-status"({ exec, args }) {
    const j = rest(exec, "GET", `${GRAPH}/servicePrincipals/${need(args, "sp")}/synchronization/jobs/${need(args, "jobb")}`);
    const last = j.status?.lastExecution ?? {};
    const aldri = String(last.timeBegan ?? "").startsWith("0001-01-01");
    return { kode: j.status?.code, sist: aldri ? "har ikke kjørt" : last.state, startet: aldri ? null : last.timeBegan, feil: last.error?.message ?? null, karantene: j.status?.quarantine?.reason ?? null };
  },

  // En tenant med bare Entra ID har ingen Exchange-organisasjon, og da kan verken postboksen eller rollene lages.
  "exchange-sjekk"({ exec }) {
    const skus = rest(exec, "GET", `${GRAPH}/subscribedSkus`).value ?? [];
    const med = skus.map((s) => ({ sku: s.skuPartNumber, exchange: (s.servicePlans ?? []).map((p) => p.servicePlanName).find((n) => n.includes("EXCHANGE")) ?? null })).filter((s) => s.exchange);
    return { exchange: med.length > 0, lisenser: med };
  },

  // Appen for innboksen: ingen e-posttillatelser i Entra. De ville gjelde alle postboksene i tenanten, i tillegg til
  // avgrensningen i Exchange; tilgangen gis bare med rollene i omfanget.
  "postboks-app"({ exec, args }) {
    const appId = az(exec, ["ad", "app", "create", "--display-name", args.navn ?? "Neo innboks", "--sign-in-audience", "AzureADMyOrg", "--query", "appId", "-o", "tsv"]).trim();
    const spId = az(exec, ["ad", "sp", "create", "--id", appId, "--query", "id", "-o", "tsv"]).trim();
    return { appId, spId, tenant: az(exec, ["account", "show", "--query", "tenantId", "-o", "tsv"]).trim() };
  },

  // Linjene til Exchange Online PowerShell, med verdiene fylt inn. De kjøres i pwsh av en Exchange-administrator.
  "exchange-linjer"({ args }) {
    const app = need(args, "app");
    const postbokser = args.postboks;
    if (!postbokser.length) throw new Usage("Si postboksene med --postboks <adresse> (én eller flere)");
    const filter = postbokser.map((p) => `PrimarySmtpAddress -eq '${p}'`).join(" -or ");
    const roller = ["Application Mail.Read", "Application MailboxSettings.Read", ...(args.send ? ["Application Mail.ReadWrite", "Application Mail.Send"] : [])];
    return {
      linjer: [
        "Connect-ExchangeOnline",
        `New-ServicePrincipal -AppId ${app} -ObjectId ${need(args, "sp")} -DisplayName "Neo innboks"`,
        `New-ManagementScope -Name "Neo felles postbokser" -RecipientRestrictionFilter "${filter}"`,
        ...roller.map((r) => `New-ManagementRoleAssignment -App ${app} -Role "${r}" -CustomResourceScope "Neo felles postbokser"`),
        ...postbokser.map((p) => `Test-ServicePrincipalAuthorization -Identity ${app} -Resource ${p}`),
      ],
    };
  },

  // Testbrukere i et underdomene av et domene tenanten alt har verifisert: det blir verifisert uten ny DNS-post.
  async testbrukere({ exec, args, readSecret }) {
    const domene = need(args, "domene");
    const antall = Number(args.antall ?? 3);
    const verifisert = rest(exec, "POST", `${GRAPH}/domains`, { id: domene }).isVerified;
    const passord = await readSecret("Passord for testbrukerne: ");
    const brukere = [];
    for (let n = 1; n <= antall; n++) brukere.push(az(exec, ["ad", "user", "create", "--display-name", `Neo Test ${n}`, "--user-principal-name", `neotest${n}@${domene}`, "--password", passord, "--force-change-password-next-sign-in", "false", "--query", "userPrincipalName", "-o", "tsv"]).trim());
    return { domene, verifisert, brukere };
  },

  // Etter en prøve. SCIM, «Kun SSO» og SSO slås av og kobles fra i Neo først, av et menneske i nettleseren.
  rydd({ exec, args }) {
    const gjort = [];
    az(exec, ["ad", "app", "delete", "--id", need(args, "app")]);
    gjort.push(`appen ${args.app}`);
    for (const g of args.gruppe) {
      az(exec, ["ad", "group", "delete", "--group", g]);
      gjort.push(`gruppen ${g}`);
    }
    if (args.domene) {
      for (const upn of json(az(exec, ["ad", "user", "list", "--filter", `endswith(userPrincipalName,'@${args.domene}')`, "--query", "[].userPrincipalName"])) ?? []) {
        az(exec, ["ad", "user", "delete", "--id", upn]);
        gjort.push(`brukeren ${upn}`);
      }
      rest(exec, "DELETE", `${GRAPH}/domains/${args.domene}`);
      gjort.push(`domenet ${args.domene}`);
    }
    return { slettet: gjort };
  },
};

const need = (args, name) => {
  if (!args[name]) throw new Usage(`--${name} mangler`);
  return args[name];
};

export async function main(argv, { exec = execFileSync, readSecret = (p) => hidden(p), out = console.log, err = console.error, sleepFn } = {}) {
  try {
    const args = parse(argv, { verdier: ["navn", "app", "sp", "uri", "url", "jobb", "bruker", "domene", "antall"], flere: ["gruppe", "postboks"], brytere: ["send"] });
    const cmd = COMMANDS[args._[0]];
    if (!cmd) throw new Usage(`Kommandoene: ${Object.keys(COMMANDS).join(", ")}`);
    const r = await cmd({ exec, args, readSecret, sleepFn });
    out(JSON.stringify(r, null, 2));
    return r.ok === false ? 1 : 0;
  } catch (e) {
    if (e instanceof Usage) {
      err(e.message);
      return 2;
    }
    err(`Feil: ${String(e.stderr || e.message).trim().split("\n")[0]}`);
    return 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exitCode = await main(process.argv.slice(2));
