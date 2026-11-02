#!/usr/bin/env node
// Rå lese-kall mot KS Fiks, slik vi gjør dem i labben når vi leter etter hvor en feil ligger: hva sier Fiks selv om
// en forsendelse, et mottakersystem eller en person, satt opp mot det Neo gjorde. Bare lesing: ingen kall som sender,
// kvitterer eller endrer noe. Hemmelighetene sladdes, og fødselsnummer maskeres i alt som skrives ut.
//
// To måter å logge inn på:
// - SvarUt og Folkeregisteret: Maskinporten-token med scopet ks:fiks, og integrasjonen fra Fiks forvaltning i
//   headerne IntegrasjonId og IntegrasjonPassord. Organisasjonen i tokenet må være integrasjonens autoriserte
//   organisasjon, ellers svarer Fiks 401.
// - SvarInn: HTTP Basic med mottakersystemets id og service-passordet. Ikke Maskinporten, ikke integrasjonen.
//
//   node fiks.mjs [--miljo <miljø>] svarut forsendelsestyper
//   node fiks.mjs [--miljo <miljø>] svarut mottakersystem <orgnr> [--forsendelsestype <type>]
//   node fiks.mjs [--miljo <miljø>] svarut status <forsendelses-id> [<id> …]
//   node fiks.mjs [--miljo <miljø>] svarut hendelser <forsendelses-id>
//   node fiks.mjs [--miljo <miljø>] svarinn liste
//   node fiks.mjs [--miljo <miljø>] folkeregister person <fnr> [--part <part>,<part>] [--rolle <rolle-id>]
//   node fiks.mjs [--miljo <miljø>] folkeregister hendelser [--seq <n>] [--rolle <rolle-id>]
import { dirname, isAbsolute, join } from "node:path";
import { load, pluginKeys, resolve } from "./lib/neo-config.mjs";
import { loadEnvLocal, MissingSecret, secretValues, value } from "./lib/hemmeligheter.mjs";
import { basic, call, redact, report } from "./lib/http.mjs";
import { token } from "./lib/maskinporten.mjs";

// Vertene per miljø. SvarInn ligger under SvarUt sin vert. `api.fiks.test.ks.no/svarut` svarer 404 for SvarUt.
export const HOSTS = {
  test: { svarut: "https://test.svarut.ks.no/api", fiksApi: "https://api.fiks.test.ks.no" },
  produksjon: { svarut: "https://svarut.ks.no/api", fiksApi: "https://api.fiks.ks.no" },
};

export const SCOPE = "ks:fiks";

// Fødsels- og d-nummer: de seks første sifrene står, de fem siste maskeres.
export const maskFnr = (text) => String(text).replace(/(?<!\d)(\d{6})\d{5}(?!\d)/g, "$1*****");

export class Usage extends Error {}

const get = (o, path) => path.split(".").reduce((x, k) => (x && typeof x === "object" ? x[k] : undefined), o);

// Miljøet, vertene og verdiene fra config-fila for det miljøet. Hemmelighetene slås opp først når et kall trenger dem.
export function context(data, { miljo, root, keys = pluginKeys(), fetchImpl = fetch } = {}) {
  const envs = get(data, "fiks.environments") ?? [];
  if (!envs.length) throw new Usage("fiks.environments mangler i config-fila. Kjør /fiks:env");
  const env = miljo ?? get(data, "fiks.defaultEnv") ?? envs[0];
  if (!envs.includes(env)) throw new Usage(`«${env}» er ikke et miljø i fiks.environments. Miljøene: ${envs.join(", ")}`);
  const hosts = HOSTS[env];
  if (!hosts) throw new Usage(`Miljøet «${env}» har ingen kjent vert i Fiks. Miljøene må hete ${Object.keys(HOSTS).join(" eller ")}`);
  const raw = (path) => resolve(data, path, { keys, env });
  const need = (path, why) => {
    const r = raw(path);
    if (r.source === "usatt") throw new Usage(`${r.path} mangler i config-fila: ${why}. Kjør /fiks:env`);
    return value(r.value);
  };
  const optional = (path) => {
    const r = raw(path);
    return r.source === "usatt" ? undefined : value(r.value);
  };
  const secrets = secretValues(data?.fiks);
  let cached;
  const bearer = async () => {
    if (!cached) {
      const clientId = need("maskinporten.klientId", "klient-ID-en til Maskinporten-klienten med ks:fiks");
      const keyFile = need("maskinporten.nokkel", "den private nøkkelen til Maskinporten-klienten");
      const t = await token({ miljo: env, clientId, scopes: [SCOPE], keyFile: isAbsolute(keyFile) ? keyFile : join(root ?? process.cwd(), keyFile), kid: optional("maskinporten.kid"), fetchImpl });
      secrets.push(t.accessToken);
      cached = t.accessToken;
    }
    return cached;
  };
  // SvarUt og Folkeregisteret: token og integrasjonen.
  const fiksHeaders = async () => ({
    authorization: `Bearer ${await bearer()}`,
    IntegrasjonId: need("integrasjon.id", "id-en til integrasjonen i Fiks forvaltning"),
    IntegrasjonPassord: need("integrasjon.passord", "integrasjonens servicepassord"),
    accept: "application/json",
  });
  // SvarInn: Basic med mottakersystemet.
  const svarinnHeaders = () => ({
    authorization: basic(need("svarinn.mottakersystemId", "id-en til SvarInn-mottakersystemet"), need("svarinn.passord", "service-passordet til mottakersystemet")),
    accept: "application/json",
  });
  return { miljo: env, hosts, secrets, need, optional, fiksHeaders, svarinnHeaders, fetchImpl };
}

const segment = (id, what) => {
  if (!id || !/^[A-Za-z0-9-]+$/.test(id)) throw new Usage(`Oppgi ${what} (bokstaver, tall og bindestrek).`);
  return encodeURIComponent(id);
};

// Hvert kall: metoden, adressen og headerne. Returnerer det som skal kalles, så det kan testes uten nettverk.
export const COMMANDS = {
  "svarut forsendelsestyper": {
    about: "Forsendelsestypene SvarUt kjenner (v2). Et ufarlig første kall: svarer det, virker token og integrasjon",
    build: async (ctx) => ({ method: "GET", url: `${ctx.hosts.svarut}/v2/forsendelsestyper`, headers: await ctx.fiksHeaders() }),
  },
  "svarut mottakersystem": {
    about: "Mottakersystemene en organisasjon har i SvarInn (v2). Tom liste: en forsendelse dit går til Altinn eller print",
    build: async (ctx, { positionals, flags }) => {
      const orgnr = positionals[0];
      if (!orgnr || !/^\d{9}$/.test(orgnr)) throw new Usage("Oppgi et organisasjonsnummer med ni sifre.");
      const q = new URLSearchParams({ organisasjonsnummer: orgnr });
      if (flags.forsendelsestype) q.set("forsendelseType", flags.forsendelsestype);
      return { method: "GET", url: `${ctx.hosts.svarut}/v2/mottakersystem?${q}`, headers: await ctx.fiksHeaders() };
    },
  },
  "svarut status": {
    about: "Status for én eller flere forsendelser fra avsenderkontoen (v3, status/sok). POST, men bare et søk",
    build: async (ctx, { positionals }) => {
      if (!positionals.length) throw new Usage("Oppgi minst én forsendelses-id.");
      positionals.forEach((id) => segment(id, "forsendelses-id-en"));
      const konto = segment(ctx.need("svarut.kontoId", "id-en til SvarUt-kontoen (avsenderkontoen)"), "svarut.kontoId");
      return { method: "POST", url: `${ctx.hosts.svarut}/v3/kontoer/${konto}/forsendelser/status/sok`, headers: { ...(await ctx.fiksHeaders()), "content-type": "application/json" }, body: JSON.stringify({ id: positionals }) };
    },
  },
  "svarut hendelser": {
    about: "Hendelsesloggen for én forsendelse (v2)",
    build: async (ctx, { positionals }) => ({ method: "GET", url: `${ctx.hosts.svarut}/v2/forsendelser/${segment(positionals[0], "forsendelses-id-en")}/hendelser`, headers: await ctx.fiksHeaders() }),
  },
  "svarinn liste": {
    about: "Nye forsendelser til mottakersystemet som ikke er kvittert (høyst 200). Kvitterer ikke",
    build: async (ctx) => ({ method: "GET", url: `${ctx.hosts.svarut}/svarinn/v2/forsendelser`, headers: ctx.svarinnHeaders() }),
  },
  "folkeregister person": {
    about: "Én person i Folkeregisteret gjennom rollen. Uten --part kommer bare grunnsettet",
    build: async (ctx, { positionals, flags }) => {
      const fnr = positionals[0];
      if (!fnr || !/^\d{11}$/.test(fnr)) throw new Usage("Oppgi et fødsels- eller d-nummer med 11 sifre.");
      const rolle = segment(flags.rolle ?? ctx.need("folkeregister.rolleId", "rollen i Fiks forvaltning, eller --rolle"), "rolle-id-en");
      const q = new URLSearchParams();
      for (const p of (flags.part ?? "").split(",").map((s) => s.trim()).filter(Boolean)) q.append("part", p);
      return { method: "GET", url: `${ctx.hosts.fiksApi}/folkeregister/api/v1/${rolle}/v1/personer/${fnr}${q.size ? `?${q}` : ""}`, headers: await ctx.fiksHeaders() };
    },
  },
  "folkeregister hendelser": {
    about: "Hendelseslisten i Folkeregisteret fra et sekvensnummer (standard 1)",
    build: async (ctx, { flags }) => {
      const seq = flags.seq ?? "1";
      if (!/^\d+$/.test(seq)) throw new Usage("--seq er et heltall.");
      const rolle = segment(flags.rolle ?? ctx.need("folkeregister.rolleId", "rollen i Fiks forvaltning, eller --rolle"), "rolle-id-en");
      return { method: "GET", url: `${ctx.hosts.fiksApi}/folkeregister/api/v1/${rolle}/v1/hendelser/feed?seq=${seq}`, headers: await ctx.fiksHeaders() };
    },
  },
};

const FLAGS = new Set(["miljo", "forsendelsestype", "part", "rolle", "seq"]);

export function parse(argv) {
  const positionals = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const name = a.slice(2);
      if (!FLAGS.has(name)) throw new Usage(`Ukjent flagg --${name}.`);
      const v = argv[++i];
      if (v === undefined || v.startsWith("--")) throw new Usage(`--${name} trenger en verdi.`);
      flags[name] = v;
    } else positionals.push(a);
  }
  return { positionals, flags };
}

export const usage = () => `Bruk: fiks.mjs [--miljo <miljø>] <kommando>\n\n${Object.entries(COMMANDS).map(([k, c]) => `  ${k.padEnd(26)}${c.about}`).join("\n")}`;

// 401 fra Fiks har nesten alltid samme årsak; si den.
export function hint(status, command) {
  if (status !== 401) return null;
  return command.startsWith("svarinn")
    ? "401 fra SvarInn: mottakersystemets id eller service-passordet stemmer ikke, eller organisasjonen er ikke lagt til på mottakersystemet."
    : "401 fra KS Fiks: organisasjonen i tokenet er ikke integrasjonens autoriserte organisasjon i Fiks forvaltning, eller integrasjonens passord stemmer ikke.";
}

// Hele kjøringen. Returnerer exit-koden: 0 for 2xx, 1 når Fiks svarer noe annet eller noe mangler, 2 for feil bruk.
export async function run(argv, { cwd = process.cwd(), fetchImpl = fetch, out = console.log, err = console.error } = {}) {
  let ctx;
  try {
    const { positionals, flags } = parse(argv);
    const name = positionals.slice(0, 2).join(" ");
    const command = COMMANDS[name];
    if (!command) throw new Usage(positionals.length ? `Ukjent kommando «${name}».` : "Oppgi en kommando.");
    const { found, data, errors } = load(cwd);
    if (!data) {
      err(errors.join("\n"));
      return 1;
    }
    const root = found.root ?? dirname(dirname(found.path));
    loadEnvLocal(root);
    ctx = context(data, { miljo: flags.miljo, root, fetchImpl });
    const req = await command.build(ctx, { positionals: positionals.slice(2), flags });
    out(`Miljø: ${ctx.miljo}`);
    const result = await call(req.url, { method: req.method, headers: req.headers, body: req.body, fetchImpl });
    out(maskFnr(report(req.method, req.url, result, ctx.secrets)));
    if (result.ok) return 0;
    const why = hint(result.status, name);
    if (why) err(why);
    return 1;
  } catch (e) {
    if (e instanceof Usage) {
      err(`${e.message}\n\n${usage()}`);
      return 2;
    }
    // En manglende hemmelighet sier navnet og kilden; alt annet sladdes og maskeres før det skrives ut.
    const msg = e instanceof MissingSecret ? e.message : (e?.message ?? String(e));
    err(maskFnr(redact(msg, ctx?.secrets ?? [])));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await run(process.argv.slice(2));
}
