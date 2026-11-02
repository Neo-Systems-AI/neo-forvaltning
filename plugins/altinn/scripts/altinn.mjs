#!/usr/bin/env node
// Rå lese-kall mot Altinn 3, til feilsøk: hva Altinn selv sier om en instans, så det kan settes opp mot det Neo
// gjorde. Maskinporten-tokenet til kundens klient veksles til et Altinn-token (GET mot exchange-endepunktet), og så
// leses Storage, app-API-et og Events. Ingenting her oppretter, sender, kvitterer eller endrer.
//
//   node altinn.mjs token                                       virker klienten? (claims, aldri tokenet)
//   node altinn.mjs instanser [--app <org/app> | --org <org>] [--part <n>] [--ko] [--antall <n>]
//   node altinn.mjs instans <part>/<guid>
//   node altinn.mjs prosess <part>/<guid> [--historikk] [--app <org/app>]
//   node altinn.mjs data <part>/<guid> [<dataGuid> [--innhold]]
//   node altinn.mjs hendelser [--app <org/app>] [--etter <id>] [--type <t>] [--part <n>] [--antall <n>] [--alle]
//   node altinn.mjs hendelser --tjenesteeier [--app <org/app>] [--etter <id>] [--fra <utc>] [--til <utc>] [--part <n>]
//   node altinn.mjs appmeta [--app <org/app>]
//
//   --miljo tt02|produksjon   standard: altinn.miljo (tt02)
//   --vis-person              vis fødselsnumrene i svaret; uten den er de skjult
//
// Config: `altinn` i .claude/neo.config.json. Nøkkelen leses fra miljøet eller .env.local (en sti under .keys/ eller
// en PEM), aldri fra fila. Exit: 0 svar 2xx · 1 feil eller ikke-2xx · 2 feil bruk.
import { isAbsolute, join } from "node:path";
import { load, resolve, pluginKeys } from "./lib/neo-config.mjs";
import { loadEnvLocal, secretValues, value } from "./lib/hemmeligheter.mjs";
import { call, redact, report } from "./lib/http.mjs";
import { token as maskinportenToken } from "./lib/maskinporten.mjs";

export const HOSTS = {
  tt02: { maskinporten: "test", platform: "https://platform.tt02.altinn.no", apps: "apps.tt02.altinn.no" },
  produksjon: { maskinporten: "produksjon", platform: "https://platform.altinn.no", apps: "apps.altinn.no" },
};
export const EXCHANGE_PATH = "/authentication/api/v1/exchange/maskinporten";
const MAX_PAGES = 50;

export class Usage extends Error {}

const APP = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/i;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// `<part>/<guid>`, som i instans-id-en Altinn selv gir. Part-formen brukes alltid: Storage svarer 404 på et
// dataelement uten den, og app-API-et krever den.
export function parseInstance(ref) {
  const m = String(ref ?? "").match(/^(\d+)\/([0-9a-f-]{36})$/i);
  if (!m || !GUID.test(m[2])) throw new Usage(`Instansen skal være <part>/<guid>, fikk «${ref ?? ""}»`);
  return { part: m[1], guid: m[2] };
}

export function parseArgs(argv) {
  const BOOL = new Set(["ko", "alle", "historikk", "innhold", "tjenesteeier", "vis-person"]);
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const name = a.slice(2);
    if (BOOL.has(name)) {
      out[name] = true;
      continue;
    }
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) throw new Usage(`--${name} trenger en verdi`);
    out[name] = v;
    i++;
  }
  return out;
}

export function pickEnv(data, wanted, keys = pluginKeys()) {
  const envs = data?.altinn?.environments ?? [];
  if (!envs.length) throw new Error("altinn.environments mangler i .claude/neo.config.json (for eksempel [\"tt02\", \"produksjon\"]). Se /altinn:env");
  const env = wanted ?? resolve(data, "miljo", { keys }).value;
  if (!envs.includes(env)) throw new Error(`«${env}» er ikke et miljø i altinn.environments (${envs.join(", ")})`);
  if (!HOSTS[env]) throw new Error(`«${env}» er ikke et Altinn-miljø pluginen kjenner. Miljøene: ${Object.keys(HOSTS).join(", ")}`);
  return env;
}

export function settings(data, miljo, keys = pluginKeys()) {
  const get = (path) => resolve(data, path, { keys, env: miljo });
  const need = (path) => {
    const r = get(path);
    if (r.source === "usatt") throw new Error(`${r.path} er ikke satt i .claude/neo.config.json. Se /altinn:env`);
    return r.value;
  };
  const clientId = need("maskinporten.clientId");
  const nokkel = need("maskinporten.nokkel");
  if (typeof nokkel !== "object") throw new Error(`altinn.byEnv.${miljo}.maskinporten.nokkel skal være en referanse ({ "$env": …, "kilde": …, "fil": true }), ikke en verdi. Fjern verdien fra fila`);
  const scopes = need("maskinporten.scopes");
  return {
    miljo,
    hosts: HOSTS[miljo],
    clientId,
    kid: get("maskinporten.kid").value,
    nokkel,
    scopes: Array.isArray(scopes) ? scopes : String(scopes).split(/\s+/).filter(Boolean),
    subscriptionKey: get("subscriptionKey").value,
    apps: get("apps").value ?? [],
    org: get("org").value,
  };
}

// Nøkkelen: en PEM rett i miljøet, eller en sti (relativ til repoet, slik hentingen skriver den til .keys/).
export function keySource(ref, root = process.cwd()) {
  const v = value(ref);
  if (v.includes("-----BEGIN")) return { keyPem: v.replace(/\\n/g, "\n") };
  return { keyFile: isAbsolute(v) ? v : join(root, v) };
}

const claims = (jwt) => JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));

// Maskinporten-tokenet gjelder ikke mot Altinn 3 direkte; det veksles med en GET (POST gir 411).
export async function altinnToken(s, { root, fetchImpl = fetch } = {}) {
  const mp = await maskinportenToken({ miljo: s.hosts.maskinporten, clientId: s.clientId, scopes: s.scopes, kid: s.kid, ...keySource(s.nokkel, root), fetchImpl });
  const url = `${s.hosts.platform}${EXCHANGE_PATH}`;
  const res = await call(url, { headers: { authorization: `Bearer ${mp.accessToken}` }, fetchImpl });
  if (!res.ok) throw Object.assign(new Error(`Vekslingen hos Altinn feilet: ${res.status} (${url}) ${typeof res.body === "string" ? res.body.slice(0, 300) : JSON.stringify(res.body).slice(0, 300)}`), { mpToken: mp.accessToken });
  // Svaret er tokenet som en JSON-streng eller ren tekst.
  const tok = String(res.body).trim().replace(/^"|"$/g, "");
  if (tok.split(".").length !== 3) throw new Error(`Vekslingen svarte ${res.status}, men svaret ser ikke ut som et JWT`);
  return { token: tok, mpToken: mp.accessToken, mpScope: mp.scope };
}

// Fødselsnumre skjules i alt som skrives ut, med mindre noen ber om dem.
const PERSON_KEYS = new Set(["personNumber", "ssn", "nationalIdentityNumber", "socialSecurityNumber"]);
export function hidePersons(x) {
  if (Array.isArray(x)) return x.map(hidePersons);
  if (x && typeof x === "object") return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, PERSON_KEYS.has(k) && v ? "[skjult]" : hidePersons(v)]));
  if (typeof x === "string") return x.replace(/\/person\/\d{11}\b/g, "/person/[skjult]").replace(/(urn:altinn:person:identifier-no:)\d{11}\b/g, "$1[skjult]");
  return x;
}

export function pickApp(args, s, { required = true } = {}) {
  const app = args.app ?? (s.apps.length === 1 ? s.apps[0] : undefined);
  if (app && !APP.test(app)) throw new Usage(`--app skal være <org>/<app>, fikk «${app}»`);
  if (!app && required) throw new Usage(`Si hvilken app med --app <org>/<app>${s.apps.length ? ` (appene i config: ${s.apps.join(", ")})` : ""}`);
  return app;
}

const appBase = (s, app) => `https://${app.split("/")[0]}.${s.hosts.apps}/${app}`;
const resourceUrn = (app) => `urn:altinn:resource:app_${app.replace("/", "_")}`;
const size = (n) => {
  if (n === undefined) return undefined;
  if (!/^\d+$/.test(n) || Number(n) < 1) throw new Usage("--antall må være et positivt heltall");
  return n;
};

// Hele kjøringen, med config og fetch utenfra så den kan testes. Skriver til out/err og returnerer exit-koden.
export async function run(argv, { data, root = process.cwd(), fetchImpl = fetch, out = console.log, err = console.error } = {}) {
  let args;
  try {
    args = parseArgs(argv);
    const [cmd] = args._;
    const known = ["token", "instanser", "instans", "prosess", "data", "hendelser", "appmeta"];
    if (!known.includes(cmd)) throw new Usage(`Ukjent kommando «${cmd ?? ""}». Kommandoene: ${known.join(", ")}`);
    if (["instans", "prosess", "data"].includes(cmd)) parseInstance(args._[1]);
    if (args._[2] && (cmd !== "data" || !GUID.test(args._[2]))) throw new Usage(`Dataelementet skal være en guid, fikk «${args._[2]}»`);
    if (args.innhold && !(cmd === "data" && args._[2])) throw new Usage("--innhold gjelder bare data <part>/<guid> <dataGuid>");
    if (args.app && !APP.test(args.app)) throw new Usage(`--app skal være <org>/<app>, fikk «${args.app}»`);
    if (args.org && !/^[a-z0-9-]+$/i.test(args.org)) throw new Usage(`--org skal være tjenesteeier-akronymet, fikk «${args.org}»`);
    if (args.app && args.org) throw new Usage("--app og --org utelukker hverandre. Storage tar én av dem");
    if (args.part && !/^\d+$/.test(args.part)) throw new Usage("--part skal være et part-id (bare sifre)");
    size(args.antall);
  } catch (e) {
    if (!(e instanceof Usage)) throw e;
    err(e.message);
    return 2;
  }

  const secrets = secretValues(data?.altinn);
  const show = (x) => (args["vis-person"] ? x : hidePersons(x));
  try {
    const s = settings(data, pickEnv(data, args.miljo));
    const t = await altinnToken(s, { root, fetchImpl }).catch((e) => {
      if (e.mpToken) secrets.push(e.mpToken);
      throw e;
    });
    secrets.push(t.token, t.mpToken);
    const headers = { authorization: `Bearer ${t.token}`, accept: "application/json", ...(s.subscriptionKey ? { "ocp-apim-subscription-key": value(s.subscriptionKey) } : {}) };
    if (s.subscriptionKey) secrets.push(value(s.subscriptionKey));
    const get = (url, extra = {}) => call(url, { headers: { ...headers, ...extra }, fetchImpl });
    const print = (url, result, body = result.body) => out(report("GET", url, { ...result, body: show(body) }, secrets));
    out(`Miljø: ${s.miljo}`);

    const [cmd, ref, dataGuid] = args._;
    const storage = `${s.hosts.platform}/storage/api/v1`;

    if (cmd === "token") {
      const c = claims(t.token);
      out(JSON.stringify({ iss: c.iss, "urn:altinn:org": c["urn:altinn:org"] ?? null, scope: c.scope ?? null, utloper: c.exp ? new Date(c.exp * 1000).toISOString() : null, maskinportenScope: t.mpScope }, null, 2));
      if (!c["urn:altinn:org"]) err("Tokenet har ikke urn:altinn:org. Storage-søket svarer da 400, og tjenesteeier-hendelsene 401: klienten mangler tjenesteeier-scopes.");
      return 0;
    }

    if (cmd === "instanser") {
      const p = new URLSearchParams();
      const app = args.org ? undefined : pickApp(args, s, { required: false });
      if (app) p.set("appId", app);
      else if (args.org ?? s.org) p.set("org", args.org ?? s.org);
      else throw new Usage("Si --app <org>/<app> eller --org <org>, eller sett altinn.apps eller altinn.org");
      if (args.part) p.set("instanceOwner.partyId", args.part);
      if (args.antall) p.set("size", args.antall);
      // Inntakskøen: arkivert og ikke kvittert av tjenesteeieren (kvitteringen er per stakeholder).
      if (args.ko) {
        p.set("status.isArchived", "true");
        p.set("confirmed", "false");
      }
      const url = `${storage}/instances?${p}`;
      const r = await get(url);
      if (r.ok && Array.isArray(r.body?.instances)) {
        out(`Antall: ${typeof r.body.count === "number" ? r.body.count : "(ikke oppgitt av Altinn)"}${r.body.next ? ` · flere: ${r.body.next}` : ""}`);
        for (const i of r.body.instances) out(`  ${i.id}  ${i.appId}  oppgave=${i.process?.currentTask?.elementId ?? "-"}  avsluttet=${i.process?.ended ?? "-"}  arkivert=${i.status?.isArchived ?? "-"}`);
      }
      print(url, r);
      return r.ok ? 0 : 1;
    }

    const { part, guid } = ref ? parseInstance(ref) : {};
    const instanceUrl = `${storage}/instances/${part}/${guid}`;

    if (cmd === "instans") {
      const r = await get(instanceUrl);
      print(instanceUrl, r);
      return r.ok ? 0 : 1;
    }

    if (cmd === "data") {
      if (dataGuid && args.innhold) {
        const url = `${instanceUrl}/data/${dataGuid}`;
        const r = await get(url, { accept: "*/*" });
        const type = r.headers["content-type"] ?? "";
        if (r.ok && !/^(text\/|application\/(json|xml)|[^;]*\+(json|xml))/i.test(type)) {
          out(`GET ${url} → ${r.status} (${r.ms} ms)\n${type || "ukjent type"}, ${String(r.body).length} tegn. Ikke tekst, så det skrives ikke ut.`);
          return 0;
        }
        err("Innholdet kan ha personopplysninger. Vis bare det feilsøket trenger, og skriv det aldri inn i repoet.");
        out(report("GET", url, r, secrets));
        return r.ok ? 0 : 1;
      }
      const r = await get(instanceUrl);
      if (!r.ok) {
        print(instanceUrl, r);
        return 1;
      }
      if (!Array.isArray(r.body?.data)) throw new Error("Instansdokumentet mangler «data». «Ingen dataelementer» ville vært en gjetning");
      const elements = dataGuid ? r.body.data.filter((d) => d.id === dataGuid) : r.body.data;
      if (dataGuid && !elements.length) throw new Error(`Instansen har ikke dataelementet ${dataGuid}`);
      out(`${elements.length} dataelement(er), bare metadata. Innholdet hentes med data ${part}/${guid} <dataGuid> --innhold`);
      for (const d of elements) out(`  ${d.id}  type=${d.dataType}  ${d.contentType}  ${d.size ?? "?"} bytes  låst=${d.locked ?? "-"}  ${d.filename ?? ""}`);
      print(instanceUrl, r, elements);
      return 0;
    }

    if (cmd === "prosess") {
      let app = pickApp(args, s, { required: false });
      if (!app) {
        const r = await get(instanceUrl);
        if (!r.ok || !APP.test(r.body?.appId ?? "")) {
          print(instanceUrl, r);
          throw new Error("Fant ikke appen til instansen. Si den med --app <org>/<app>");
        }
        app = r.body.appId;
      }
      const url = `${appBase(s, app)}/instances/${part}/${guid}/process${args.historikk ? "/history" : ""}`;
      const r = await get(url);
      print(url, r);
      return r.ok ? 0 : 1;
    }

    if (cmd === "appmeta") {
      const app = pickApp(args, s);
      const url = `${appBase(s, app)}/api/v1/applicationmetadata`;
      const r = await get(url);
      print(url, r);
      return r.ok ? 0 : 1;
    }

    if (cmd === "hendelser") {
      const app = pickApp(args, s);
      if (args.tjenesteeier) {
        const p = new URLSearchParams();
        for (const [flag, name] of [["etter", "after"], ["fra", "from"], ["til", "to"], ["part", "party"], ["antall", "size"]]) if (args[flag]) p.set(name, args[flag]);
        const url = `${s.hosts.platform}/events/api/v1/app/${app}${p.size ? `?${p}` : ""}`;
        const r = await get(url);
        print(url, r);
        return r.ok ? 0 : 1;
      }
      // `resource` og `after` er påkrevd. after=0 er IKKE «alt»: det gir én side, og de nyeste kan mangle.
      const page = async (after) => {
        const p = new URLSearchParams({ after, resource: resourceUrn(app) });
        if (args.type) p.set("type", args.type);
        if (args.part) p.set("subject", `/party/${args.part}`);
        if (args.antall) p.set("size", args.antall);
        const url = `${s.hosts.platform}/events/api/v1/events?${p}`;
        return { url, r: await get(url) };
      };
      const first = await page(args.etter ?? "0");
      if (!first.r.ok || !Array.isArray(first.r.body)) {
        print(first.url, first.r);
        if (first.r.ok) err("Svaret er ikke en liste med hendelser. «Ingen hendelser» ville vært en gjetning");
        return 1;
      }
      const all = [...first.r.body];
      let code = 0;
      if (args.alle) {
        const seen = new Set();
        let cursor = all.at(-1)?.id;
        let end = cursor === undefined;
        for (let n = 0; cursor !== undefined && n < MAX_PAGES; n++) {
          if (seen.has(cursor)) break;
          seen.add(cursor);
          const next = await page(String(cursor));
          if (!next.r.ok || !Array.isArray(next.r.body)) {
            print(next.url, next.r);
            return 1;
          }
          if (!next.r.body.length) {
            end = true;
            break;
          }
          all.push(...next.r.body);
          cursor = next.r.body.at(-1)?.id;
        }
        if (end) out(`Paginert til enden: ${all.length} hendelse(r)`);
        else {
          err(`STOPPET før enden etter ${all.length} hendelse(r) (høyst ${MAX_PAGES} sider, eller en id som gikk igjen). Dette er ikke alt`);
          code = 1;
        }
      } else out(`${all.length} hendelse(r) på første side. Bruk --alle for å lese til enden`);
      for (const e of [...all].sort((a, b) => String(a.time).localeCompare(String(b.time)))) out(show(`  ${e.time}  ${String(e.type).padEnd(44)} ${e.resourceinstance ?? "-"}  ${e.subject ?? ""}`));
      out(redact(JSON.stringify(show(all), null, 2), secrets));
      return code;
    }
    return 2;
  } catch (e) {
    if (e instanceof Usage) {
      err(e.message);
      return 2;
    }
    err(redact(e.message, secrets));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { found, data, errors } = load();
  if (!data) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  loadEnvLocal(found.root);
  process.exit(await run(process.argv.slice(2), { data, root: found.root ?? process.cwd() }));
}
