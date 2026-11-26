#!/usr/bin/env node
// Maskinporten slik systemet selv svarer: well-known for miljøet, og et token for en klient med scopet og utløpet
// Maskinporten faktisk innvilget. Tokenet skrives aldri ut. Bare lesing: et token endrer ingenting hos noen.
//
//   node maskinporten.mjs well-known [--miljo test|produksjon]
//   node maskinporten.mjs token <klient> [--scope "<scope> …"] [--consumer-org <orgnr>]
//
// Klientene står i `.claude/neo.config.json` under `maskinporten.klienter.<navn>` (clientId, kid, scopes), for miljøet
// i `maskinporten.miljo`. Nøkkelen er referansen `maskinporten.hemmeligheter.<navn>-nokkel`, hentet fra
// hvelvet for kallet. Exit: 0 svar · 1 feil eller avslag · 2 feil bruk.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse, Usage } from "./lib/argumenter.mjs";
import { load, miljo } from "./lib/neo-config.mjs";
import { secret } from "./lib/hemmeligheter.mjs";
import { call, redact, report } from "./lib/http.mjs";
import { HOSTS, tokenFor } from "./lib/maskinporten.mjs";

const BRUK = `Bruk:
  maskinporten.mjs well-known [--miljo test|produksjon]
  maskinporten.mjs token <klient> [--scope "<scope> …"] [--consumer-org <orgnr>]`;

// Claimene i tokenet, uten tokenet. Det er dem feilsøket trenger: hvem, hvilket scope, på vegne av hvem, og utløpet.
export function claims(jwt) {
  try {
    const c = JSON.parse(Buffer.from(String(jwt).split(".")[1], "base64url").toString("utf8"));
    return { iss: c.iss, client_id: c.client_id, consumer: c.consumer?.ID, supplier: c.supplier?.ID, scope: c.scope, exp: c.exp };
  } catch {
    return null;
  }
}

// Kjører kommandoen og gir exit-koden. `config` ({ data, root }), `fetchImpl` og `hemmelighet` sendes inn i testene.
export async function main(argv, { fetchImpl = fetch, config, hemmelighet = secret, out = console.log, err = console.error, now = Date.now } = {}) {
  const secrets = [];
  try {
    const args = parse(argv, { verdier: ["miljo", "scope", "consumer-org"] });
    const [cmd, navn] = args._;
    if (cmd === "well-known") {
      // well-known trenger ingen klient, så den går uten config-fil når miljøet er sagt.
      const data = config?.data ?? (args.miljo ? null : load().data);
      const env = miljo(data, "maskinporten", args.miljo, HOSTS);
      const url = `${HOSTS[env]}/.well-known/oauth-authorization-server`;
      const res = await call(url, { fetchImpl });
      out(`Miljø: ${env}`);
      out(report("GET", url, res));
      if (res.ok) out(`\nissuer: ${res.body?.issuer ?? "(mangler)"}\ntoken_endpoint: ${res.body?.token_endpoint ?? "(mangler)"}`);
      return res.ok ? 0 : 1;
    }
    if (cmd !== "token" || !navn) throw new Usage(BRUK);
    if (args.miljo) throw new Usage("token bruker miljøet klientene er registrert i (maskinporten.miljo); --miljo gjelder bare well-known");
    const { data } = config ?? load();
    const t = await tokenFor({ data, navn, scopes: args.scope?.split(/[\s,]+/).filter(Boolean), consumerOrg: args["consumer-org"], fetchImpl, hemmelighet, secrets });
    const c = claims(t.accessToken);
    const utlop = typeof t.expiresIn === "number" ? new Date(now() + t.expiresIn * 1000).toISOString() : "(ukjent)";
    const lines = [
      `Miljø: ${t.klient.miljo}`,
      `Klient: ${t.klient.navn} (${t.klient.sted})`,
      `client_id: ${t.klient.clientId}`,
      `ba om: ${t.ba.join(" ")}`,
      `innvilget: ${t.scope || "(tomt)"}`,
      `expires_in: ${t.expiresIn ?? "(mangler)"} s, utløper ${utlop}`,
      ...(args["consumer-org"] ? [`på vegne av: ${args["consumer-org"]} (delegering)`] : []),
      ...(c ? [`claims: ${JSON.stringify(c)}`] : ["claims: tokenet er ikke en JWT som kan leses"]),
      "Tokenet skrives aldri ut.",
    ];
    const ikke = t.ba.filter((s) => !t.scope.split(" ").includes(s));
    if (ikke.length) lines.push(`MERK: ikke innvilget: ${ikke.join(" ")}`);
    out(redact(lines.join("\n"), secrets));
    return 0;
  } catch (e) {
    err(redact(e instanceof Usage ? e.message : `Feil: ${e.message}`, secrets));
    return e instanceof Usage ? 2 : 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exitCode = await main(process.argv.slice(2));
