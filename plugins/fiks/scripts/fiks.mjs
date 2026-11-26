#!/usr/bin/env node
// Rå lese-kall mot KS Fiks, til feilsøk: hva sier Fiks selv om en forsendelse, et mottakersystem eller en person, satt
// opp mot det Neo gjorde. Bare lesing: ingen kall som sender, kvitterer eller endrer noe. Hemmelighetene sladdes, og
// fødselsnummer maskeres i alt som skrives ut.
//
// To måter å logge inn på:
// - SvarUt og Folkeregisteret: Maskinporten-token med scopet ks:fiks (klienten `fiks.klient`), og integrasjonen fra
//   Fiks forvaltning i headerne IntegrasjonId og IntegrasjonPassord. Organisasjonen i tokenet må være integrasjonens
//   autoriserte organisasjon, ellers svarer Fiks 401.
// - SvarInn: HTTP Basic med mottakersystemets id og service-passordet. Ikke Maskinporten, ikke integrasjonen.
//
//   node fiks.mjs svarut forsendelsestyper
//   node fiks.mjs svarut mottakersystem <orgnr> [--forsendelsestype <type>]
//   node fiks.mjs svarut status <forsendelses-id> [<id> …]
//   node fiks.mjs svarut hendelser <forsendelses-id>
//   node fiks.mjs svarinn liste
//   node fiks.mjs folkeregister person <fnr> [--part <part>,<part>] [--rolle <rolle-id>]
//   node fiks.mjs folkeregister hendelser [--seq <n>] [--rolle <rolle-id>]
//
// Config: `fiks` i .claude/neo.config.json (miljo, klient, integrasjon, svarutKonto, svarinnMottakersystem,
// folkeregisterRolle). Passordene står i integrasjoner/fiks/hemmeligheter.yaml (integrasjon-passord,
// svarinn-passord) og hentes fra hvelvet for kallet.
import { fileURLToPath } from "node:url";
import { parse, Usage } from "./lib/argumenter.mjs";
import { load, miljo, need } from "./lib/config.mjs";
import { maskFnr } from "./lib/fnr.mjs";
import { ref, secret } from "./lib/hemmeligheter.mjs";
import { basic, call, redact, report } from "./lib/http.mjs";
import { tokenFor } from "./lib/maskinporten.mjs";

// Vertene per miljø. SvarInn ligger under SvarUt sin vert. `api.fiks.test.ks.no/svarut` svarer 404 for SvarUt.
export const HOSTS = {
  test: { svarut: "https://test.svarut.ks.no/api", fiksApi: "https://api.fiks.test.ks.no" },
  produksjon: { svarut: "https://svarut.ks.no/api", fiksApi: "https://api.fiks.ks.no" },
};
export const SCOPE = "ks:fiks";

// Det et kall trenger, slått opp først når kallet trenger det.
export function context(data, { root, fetchImpl = fetch, hemmelighet = secret }) {
  const env = miljo(data, "fiks", undefined, HOSTS);
  const secrets = [];
  const hent = (navn) => {
    const v = hemmelighet(ref(root, "fiks", navn));
    secrets.push(v);
    return v;
  };
  let cached;
  const bearer = async () => {
    cached ??= (await tokenFor({ data, root, navn: need(data, "fiks.klient", "navnet på Maskinporten-klienten med ks:fiks under maskinporten.klienter"), miljo: env, scopes: [SCOPE], fetchImpl, hemmelighet, secrets })).accessToken;
    return cached;
  };
  // SvarUt og Folkeregisteret: token og integrasjonen.
  const fiksHeaders = async () => ({
    authorization: `Bearer ${await bearer()}`,
    IntegrasjonId: need(data, "fiks.integrasjon", "id-en til integrasjonen i Fiks forvaltning"),
    IntegrasjonPassord: hent("integrasjon-passord"),
    accept: "application/json",
  });
  // SvarInn: Basic med mottakersystemet.
  const svarinnHeaders = () => ({ authorization: basic(need(data, "fiks.svarinnMottakersystem", "id-en til SvarInn-mottakersystemet"), hent("svarinn-passord")), accept: "application/json" });
  return { miljo: env, hosts: HOSTS[env], secrets, data, fiksHeaders, svarinnHeaders };
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
    validate: ({ positionals }) => {
      if (!/^\d{9}$/.test(positionals[0] ?? "")) throw new Usage("Oppgi et organisasjonsnummer med ni sifre.");
    },
    build: async (ctx, { positionals, flags }) => {
      const q = new URLSearchParams({ organisasjonsnummer: positionals[0] });
      if (flags.forsendelsestype) q.set("forsendelseType", flags.forsendelsestype);
      return { method: "GET", url: `${ctx.hosts.svarut}/v2/mottakersystem?${q}`, headers: await ctx.fiksHeaders() };
    },
  },
  "svarut status": {
    about: "Status for én eller flere forsendelser fra avsenderkontoen (v3, status/sok). POST, men bare et søk",
    validate: ({ positionals }) => {
      if (!positionals.length) throw new Usage("Oppgi minst én forsendelses-id.");
      positionals.forEach((id) => segment(id, "forsendelses-id-en"));
    },
    build: async (ctx, { positionals }) => {
      const konto = segment(need(ctx.data, "fiks.svarutKonto", "id-en til SvarUt-kontoen (avsenderkontoen)"), "fiks.svarutKonto");
      return { method: "POST", url: `${ctx.hosts.svarut}/v3/kontoer/${konto}/forsendelser/status/sok`, headers: { ...(await ctx.fiksHeaders()), "content-type": "application/json" }, body: JSON.stringify({ id: positionals }) };
    },
  },
  "svarut hendelser": {
    about: "Hendelsesloggen for én forsendelse (v2)",
    validate: ({ positionals }) => segment(positionals[0], "forsendelses-id-en"),
    build: async (ctx, { positionals }) => ({ method: "GET", url: `${ctx.hosts.svarut}/v2/forsendelser/${segment(positionals[0], "forsendelses-id-en")}/hendelser`, headers: await ctx.fiksHeaders() }),
  },
  "svarinn liste": {
    about: "Nye forsendelser til mottakersystemet som ikke er kvittert (høyst 200). Kvitterer ikke",
    build: async (ctx) => ({ method: "GET", url: `${ctx.hosts.svarut}/svarinn/v2/forsendelser`, headers: ctx.svarinnHeaders() }),
  },
  "folkeregister person": {
    about: "Én person i Folkeregisteret gjennom rollen. Uten --part kommer bare grunnsettet",
    validate: ({ positionals }) => {
      if (!/^\d{11}$/.test(positionals[0] ?? "")) throw new Usage("Oppgi et fødsels- eller d-nummer med 11 sifre.");
    },
    build: async (ctx, { positionals, flags }) => {
      const rolle = segment(flags.rolle ?? need(ctx.data, "fiks.folkeregisterRolle", "rollen i Fiks forvaltning, eller --rolle"), "rolle-id-en");
      const q = new URLSearchParams();
      for (const p of (flags.part ?? "").split(",").map((s) => s.trim()).filter(Boolean)) q.append("part", p);
      return { method: "GET", url: `${ctx.hosts.fiksApi}/folkeregister/api/v1/${rolle}/v1/personer/${positionals[0]}${q.size ? `?${q}` : ""}`, headers: await ctx.fiksHeaders() };
    },
  },
  "folkeregister hendelser": {
    about: "Hendelseslisten i Folkeregisteret fra et sekvensnummer (standard 1)",
    validate: ({ flags }) => {
      if (!/^\d+$/.test(flags.seq ?? "1")) throw new Usage("--seq er et heltall.");
    },
    build: async (ctx, { flags }) => {
      const rolle = segment(flags.rolle ?? need(ctx.data, "fiks.folkeregisterRolle", "rollen i Fiks forvaltning, eller --rolle"), "rolle-id-en");
      return { method: "GET", url: `${ctx.hosts.fiksApi}/folkeregister/api/v1/${rolle}/v1/hendelser/feed?seq=${flags.seq ?? "1"}`, headers: await ctx.fiksHeaders() };
    },
  },
};

export const usage = () => `Bruk: fiks.mjs <kommando>\n\n${Object.entries(COMMANDS).map(([k, c]) => `  ${k.padEnd(26)}${c.about}`).join("\n")}`;

// 401 fra Fiks har nesten alltid samme årsak; si den.
export function hint(status, command) {
  if (status !== 401) return null;
  return command.startsWith("svarinn")
    ? "401 fra SvarInn: mottakersystemets id eller service-passordet stemmer ikke, eller organisasjonen er ikke lagt til på mottakersystemet."
    : "401 fra KS Fiks: organisasjonen i tokenet er ikke integrasjonens autoriserte organisasjon i Fiks forvaltning, eller integrasjonens passord stemmer ikke.";
}

// Hele kjøringen. Exit: 0 for 2xx, 1 når Fiks svarer noe annet eller noe mangler, 2 for feil bruk.
export async function main(argv, { config, fetchImpl = fetch, hemmelighet = secret, out = console.log, err = console.error } = {}) {
  let ctx;
  let ids = [];
  try {
    const args = parse(argv, { verdier: ["forsendelsestype", "part", "rolle", "seq"] });
    const name = args._.slice(0, 2).join(" ");
    const command = COMMANDS[name];
    if (!command) throw new Usage(args._.length ? `Ukjent kommando «${name}».` : "Oppgi en kommando.");
    const input = { positionals: args._.slice(2), flags: args };
    ids = input.positionals;
    command.validate?.(input);
    const { data, root } = config ?? load();
    ctx = context(data, { root, fetchImpl, hemmelighet });
    const req = await command.build(ctx, input);
    out(`Miljø: ${ctx.miljo}`);
    const result = await call(req.url, { method: req.method, headers: req.headers, body: req.body, fetchImpl });
    out(maskFnr(report(req.method, req.url, result, ctx.secrets), ids));
    if (result.ok) return 0;
    const why = hint(result.status, name);
    if (why) err(why);
    return 1;
  } catch (e) {
    if (e instanceof Usage) {
      err(`${e.message}\n\n${usage()}`);
      return 2;
    }
    err(maskFnr(redact(`Feil: ${e.message}`, ctx?.secrets ?? []), ids));
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
