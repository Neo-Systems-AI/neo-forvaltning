import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { main, run, version } from "./sjekk.mjs";
import { citations, claims, items } from "./les.mjs";
import { render } from "./hos-kunden.mjs";
import { RULES, ruleIds } from "./regler.mjs";
import { CONFIG, GOOD, LOSNING, REGISTER, REPO, URL, caseType, down, fake, git, krav, repo, write } from "./hjelp.test-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const check = (root, opts = {}) => run(root, { base: "HEAD", fetchJson: fake(), ...opts });
const msgs = (f, name, level) => f.filter((x) => x.check === name && (!level || x.level === level)).map((x) => `${x.file}: ${x.message}`).sort();

test("et repo slik det skal være, gir ingen funn", async () => {
  const root = repo(GOOD());
  assert.deepEqual(await check(root), []);
  rmSync(root, { recursive: true });
});

test("et tomt repo fra malen kaller ikke Neo, og et standardrepo uten felles/kilder er grønt", async () => {
  const calls = [];
  const root = repo({ "repo.yaml": REPO("standard"), ".claude/neo.config.json": CONFIG, ".github/CODEOWNERS": "* @x/y\n" });
  assert.deepEqual(await check(root, { fetchJson: fake(calls) }), []);
  assert.deepEqual(calls, []);
  rmSync(root, { recursive: true });
});

test("strukturen: mappene har navn, ikke tall, og det som ikke har en form, finnes ikke", async () => {
  const root = repo({
    ...GOOD(),
    "repo.yaml": `${REPO("standard")}godkjenner: { navn: G }\n`,
    "profil.yaml": "",
    "organisasjon/README.md": "",
    "losninger/parkering/2-forstaelse/x.md": "",
    "losninger/parkering/notater.md": "",
    "losninger/parkering/oppsett/spor.yaml": "a: [b]\n",
    "integrasjoner/altinn/neo.yaml": "app: x\n",
    "integrasjoner/altinn/notat.txt": "",
  });
  const f = msgs(await check(root), "repo");
  assert.deepEqual(f, [
    "felles/forstaelse: Et repo for standardløsninger har ingen kunde å forstå, så felles/ har ikke kilder eller forstaelse",
    "felles/kilder: Et repo for standardløsninger har ingen kunde å forstå, så felles/ har ikke kilder eller forstaelse",
    "integrasjoner/altinn/neo.yaml: neo.yaml har ingen form i Neo ennå. Ta den bort",
    "integrasjoner/altinn/notat.txt: En integrasjon har hos-kunden.md, hemmeligheter.yaml, og artefaktene systemet trenger i en egen mappe",
    "losninger/parkering/2-forstaelse: Mappene har navn, ikke tall: 2-forstaelse heter forstaelse",
    "losninger/parkering/notater.md: En løsning har README.md, design, forstaelse, kilder, krav, losning.yaml, oppsett, test. Det som ikke har en form, finnes ikke",
    "losninger/parkering/oppsett/spor.yaml: Hva hvert krav ble, står i kravet selv (blir). Det finnes ingen sporingsfil",
    "organisasjon: Det som er felles, står i felles/ (felles/design/, felles/oppsett/)",
    "profil.yaml: profil.yaml har ingen form i Neo ennå. Ta den bort",
    "repo.yaml: godkjenner står bare i .github/CODEOWNERS, som er det GitHub håndhever. Ta den bort her",
  ]);
  rmSync(root, { recursive: true });
});

test("config-fila: ett miljø, og ingen hemmelighet eller referanse", async () => {
  const root = repo({
    ...GOOD(),
    ".claude/neo.config.json": JSON.stringify({ version: 1, neo: { environments: ["development"], byEnv: { development: { url: URL } } }, fiks: { passord: "hemmelig", nokkel: { $env: "X" } } }),
  });
  const f = msgs(await check(root), "config");
  assert.deepEqual(f, [
    ".claude/neo.config.json: fiks.nokkel er en referanse til en hemmelighet. Referansene står i integrasjoner/<system>/hemmeligheter.yaml, ikke her",
    ".claude/neo.config.json: fiks.passord står med verdi. Config-fila har ingen hemmeligheter",
    ".claude/neo.config.json: neo har ett miljø: url, org og mcpServer rett under neo, uten environments, defaultEnv eller byEnv",
    ".claude/neo.config.json: neo.mcpServer mangler: navnet på MCP-serveren i .mcp.json",
    ".claude/neo.config.json: neo.org er ikke fylt ut: org-en i Neo med sandkassen konfigen skrives til",
    ".claude/neo.config.json: neo.url mangler: adressen til Neo (https://…). Skjemaet for konfigfilene hentes derfra",
    ".claude/neo.config.json: version må være 2: versjon 1 hadde miljøer per nøkkel (byEnv). Nå er det ett miljø: neo.url, neo.org og neo.mcpServer",
  ]);
  rmSync(root, { recursive: true });
});

test("kildene på endringen: en endret kilde er rød, en slettet bare når den ikke er trukket tilbake, og det før basen telles ikke", async () => {
  const root = repo(GOOD());
  const L = "losninger/parkering/kilder";
  // Før basen: en kilde som ble endret i historikken, er ikke en del av endringen.
  write(root, `${L}/filer/K1_forskriften.md`, "§ 1 Fristen er fire uker.\n");
  git(root, "commit", "-qam", "endret før basen");
  git(root, "tag", "base");
  assert.deepEqual(msgs(await check(root, { base: "base" }), "kilder"), []);
  write(root, `${L}/filer/K1_forskriften.md`, "§ 1 Fristen er fem uker.\n");
  assert.deepEqual(msgs(await check(root, { base: "base" }), "kilder"), [`${L}/filer/K1_forskriften.md: En lagret kilde er endret. En kilde endres aldri: en ny versjon får en ny id og en ny fil`]);
  git(root, "checkout", "-q", "--", ".");
  unlinkSync(join(root, `${L}/filer/K1_forskriften.md`));
  write(root, `${L}/kilder.md`, REGISTER);
  assert.match(msgs(await check(root, { base: "base" }), "kilder")[0], /En lagret kilde er slettet. En kilde slettes ikke; den trekkes tilbake/);
  write(root, `${L}/kilder.md`, REGISTER.replace("[`filer/K1_forskriften.md`](filer/K1_forskriften.md)", "`filer/K1_forskriften.md` Trukket tilbake: hadde personopplysninger"));
  const f = await check(root, { base: "base" });
  assert.deepEqual(msgs(f, "kilder"), []);
  assert.deepEqual(msgs(f, "forstaelse"), ["losninger/parkering/forstaelse/forlop.md: K1 er trukket tilbake (hadde personopplysninger). Skriv påstanden fra en annen kilde, eller ta den bort"]);
  assert.match(msgs(f, "krav")[0], /frist: K1 er trukket tilbake/);
  rmSync(root, { recursive: true });
});

test("uten basen er kildene ikke sjekket, og det er rødt", async () => {
  const root = repo(GOOD());
  assert.deepEqual(msgs(await check(root, { base: "origin/main" }), "kilder"), [".: Fant ikke basen «origin/main» i git, så det er ikke sjekket at kildene er uendret. Si basen med --base <ref> (i en PR: origin/<grenen den skal inn i>; før første commit: HEAD)"]);
  rmSync(root, { recursive: true });
});

test("forståelsen: en påstand uten kilde, eller med en kilde som ikke er i registeret på samme sted", async () => {
  const root = repo({ ...GOOD(), "losninger/parkering/forstaelse/data.md": "# Data\n\n- Maks 1 400.\n- Maks 1 850. [K99]\n- Fristene står i `forlop.md`.\n", "felles/forstaelse/systemer.md": "- Arkivet er Documaster. [K2]\n", "losninger/parkering/kilder/filer/K2_x.pdf": "x" });
  const f = await check(root);
  assert.deepEqual(msgs(f, "forstaelse"), [
    "felles/forstaelse/systemer.md: K2 står ikke i registeret (felles/kilder/kilder.md)",
    "losninger/parkering/forstaelse/data.md: K99 står ikke i registeret (losninger/parkering/kilder/kilder.md)",
    "losninger/parkering/forstaelse/data.md: Påstanden viser ikke til en kilde: «Maks 1 400.»",
  ]);
  assert.deepEqual(msgs(f, "kilder"), ["losninger/parkering/kilder/filer/K2_x.pdf: Fila står ikke i registeret (losninger/parkering/kilder/kilder.md). En lagret kilde har en id og opphav"]);
  rmSync(root, { recursive: true });
});

test("kravene: flyt, hvorfor, kilde, id én gang, og blir når løsningen er ute av utkast", async () => {
  const root = repo({
    ...GOOD(),
    "losninger/parkering/krav/dokumenter.md": [
      krav("vedtak"),
      "## frist Igjen\n\n```yaml\nflyt: automatisk\nkilde: [K9, forstaelse/forlop.md#borte]\nblir:\n  - steg: Noe\n  - fil: oppsett/case-types/borte.yaml\n  - fil: ../../README.md\n  - onske: x\n    hvorfor: y\n    fil: z\n```\n",
      "## felles-felt Feltet\n\n```yaml\nflyt: menneske\nhvorfor: x\nkilde: [forstaelse/forlop.md#forløpet]\nblir:\n  - fil: felles/oppsett/custom-fields/case-gnr.yaml\n```\n",
    ].join("\n"),
    "felles/oppsett/custom-fields/case-gnr.yaml": "apiVersion: neo-config/v1\nkind: customFieldDefinition\nspec:\n  name: gnr\n  entityType: case\n",
  });
  assert.deepEqual(msgs(await check(root), "krav").map((m) => m.replace(/^[^:]+: /, "")).sort(), [
    "Id-en frist er brukt før, i losninger/parkering/krav/dokumenter.md",
    "frist: K9 står ikke i registeret (losninger/parkering/kilder/kilder.md)",
    "frist: blir.fil ../../README.md ligger ikke i en oppsett/-mappe",
    "frist: blir.fil oppsett/case-types/borte.yaml finnes ikke (losninger/parkering/oppsett/case-types/borte.yaml)",
    "frist: hver linje i blir er én av { fil: <sti> }, { steg: <tekst>, hvorfor: <tekst> } eller { onske: <tekst>, hvorfor: <tekst> }",
    "frist: blir.steg trenger hvorfor: hvorfor kravet ikke ble konfig",
    "frist: flyt må være deterministisk, agentisk, menneske",
    "frist: hvorfor mangler",
    "frist: overskriften #borte finnes ikke i forstaelse/forlop.md",
    "vedtak: blir mangler. Løsningen er i-test, så hvert krav sier hva det ble: { fil: oppsett/… }, { steg: …, hvorfor: … } eller { onske: …, hvorfor: … }",
  ].sort());
  write(root, "losninger/parkering/losning.yaml", LOSNING("utkast"));
  assert.ok(!msgs(await check(root), "krav").some((m) => /vedtak: blir mangler/.test(m)), "i utkast kan blir stå tomt");
  rmSync(root, { recursive: true });
});

test("konfigfilene mot skjemaet: formen, mappa for typen, og samme objekt to steder etter nøkkelen, ikke filnavnet", async () => {
  const d = "losninger/parkering/oppsett";
  const root = repo({
    ...GOOD(),
    [`${d}/case-types/tom.yaml`]: "apiVersion: neo-config/v1\nkind: caseType\nspec:\n  name: \"\"\n  slug: tom\n  farge: rod\n",
    [`${d}/custom-fields/x.yaml`]: caseType("x"),
    [`${d}/ukjent/x.yaml`]: caseType("y"),
    [`${d}/case-types/dobbel.yaml`]: "kind: caseType\nkind: caseType\n",
    [`${d}/case-types/gammel.yml`]: caseType("z"),
    "felles/oppsett/case-types/et-annet-navn.yaml": caseType("parkering"),
  });
  assert.deepEqual(msgs(await check(root), "oppsett"), [
    `felles/oppsett/case-types/et-annet-navn.yaml: Samme objekt (caseType «parkering») står også i ${d}/case-types/parkering.yaml. Et objekt står ett sted: i felles/oppsett/ når flere løsninger bruker det`,
    `${d}/case-types/dobbel.yaml: Kan ikke leses som YAML (linje 2: Map keys must be unique)`,
    `${d}/case-types/gammel.yml: Neo leser bare .yaml. Gi fila endelsen .yaml`,
    `${d}/case-types/parkering.yaml: Samme objekt (caseType «parkering») står også i felles/oppsett/case-types/et-annet-navn.yaml. Et objekt står ett sted: i felles/oppsett/ når flere løsninger bruker det`,
    `${d}/case-types/tom.yaml: /spec must NOT have additional properties (farge)`,
    `${d}/case-types/tom.yaml: /spec/name must NOT have fewer than 1 characters`,
    `${d}/custom-fields/x.yaml: Fila er caseType, men ligger i mappa for customFieldDefinition. Flytt den til case-types/`,
    `${d}/ukjent/x.yaml: ukjent/ er ikke en mappe for en type i Neo. Mappene: case-types, custom-fields, workflows, case-wizards`,
  ]);
  rmSync(root, { recursive: true });
});

test("når skjemaet ikke kan hentes, er det rødt med adressen og feilen", async () => {
  const root = repo(GOOD());
  assert.deepEqual(msgs(await check(root, { fetchJson: down }), "oppsett", "fail"), [`.claude/neo.config.json: Fikk ikke hentet skjemaet fra ${URL}/api/config/schema (fetch failed), så 1 fil i oppsett/ er ikke validert`]);
  rmSync(root, { recursive: true });
});

test("en fil i oppsett/ uten krav bak seg er gul", async () => {
  const root = repo({ ...GOOD(), "losninger/parkering/oppsett/workflows/varsel.yaml": "apiVersion: neo-config/v1\nkind: workflow\nspec:\n  name: Varsel\n" });
  const f = await check(root);
  assert.deepEqual(msgs(f, "brukt", "warn"), ["losninger/parkering/oppsett/workflows/varsel.yaml: Ingen krav har denne fila som blir. En fil uten krav bak seg lages ikke"]);
  assert.deepEqual(msgs(f, "monstre", "warn"), ["losninger/parkering/oppsett/workflows/varsel.yaml: Flyten «Varsel» lander som utkast: les gapene og aktiver den i Neo etter skrivingen (07-flyt.md#flyt-aktivering)"]);
  rmSync(root, { recursive: true });
});

test("mønstrene: rødt stopper, et avvik i design/ med grunnen meldes ikke på nytt, og et avvik må vise til en regel som finnes", async () => {
  const root = repo({ ...GOOD(), "felles/oppsett/case-types/annen.yaml": caseType("annen", "Parkering") });
  assert.equal(msgs(await check(root), "monstre", "fail").length, 2);
  write(root, "felles/design/valg.md", "## to-parkering To sakstyper med samme navn\n\n```yaml\navvik: navn-er-nokkelen\ngrunn: Kunden vil ha det slik i overgangen.\n```\n");
  write(root, "losninger/parkering/design/valg.md", "## samme Samme\n\n```yaml\navvik: navn-er-nokkelen\nfil: case-types/parkering.yaml\ngrunn: Overgangen.\n```\n\n## feil Feil\n\n```yaml\navvik: finnes-ikke\n```\n");
  const f = await check(root);
  assert.deepEqual(msgs(f, "monstre", "fail"), []);
  assert.deepEqual(msgs(f, "avvik"), ["losninger/parkering/design/valg.md: feil: grunn mangler: hvorfor regelen brytes med vilje", "losninger/parkering/design/valg.md: feil: regelen «finnes-ikke» finnes ikke i mønstrene"]);
  rmSync(root, { recursive: true });
});

test("hver sjekk er en regel i mønstrene, og hver regel som sier at den sjekkes maskinelt, har en sjekk", () => {
  const MONSTRE = join(here, "..", "plugins", "solution", "docs", "monstre");
  for (const r of RULES) assert.match(readFileSync(join(MONSTRE, r.doc), "utf8"), new RegExp(`^id: ${r.name}\\n(?:.*\\n)*?sjekkes: maskinelt`, "m"), `${r.doc}#${r.name}`);
  const marked = readdirSync(MONSTRE).filter((f) => f.endsWith(".md")).flatMap((f) => readFileSync(join(MONSTRE, f), "utf8").split(/^```yaml$/m).slice(1).map((b) => b.split("```")[0]).filter((b) => /^sjekkes: maskinelt$/m.test(b)).map((b) => b.match(/^id: (\S+)/m)[1]));
  assert.deepEqual(marked.sort(), RULES.map((r) => r.name).sort());
  assert.ok(ruleIds().has("navn-er-nokkelen") && ruleIds().size > 50);
});

test("integrasjonene, personaene og testcasene: referanser uten $env, og ingen verdi", async () => {
  const root = repo({
    ...GOOD(),
    "integrasjoner/altinn/hemmeligheter.yaml": "a: abc123\nb: { $env: X, kilde: azure-keyvault:kv/b }\nc: { kilde: 1password:x }\n",
    "integrasjoner/altinn/app/oppsett.yaml": "klient:\n  secret: abc\n",
    "test/personaer/leder.yaml": "navn: Lea\nrolle: leder\nhemmeligheter:\n  passord: hemmelig\n",
    "losninger/parkering/test/testcaser/b.yaml": "beskrivelse: b\nforventet: { krav: [frist, borte] }\npersona: ukjent\ninn: { password: x }\n",
    "test/innboks.yaml": "beskrivelse: x\nlosninger: [parkering]\nforventet: { krav: [frist] }\n",
  });
  const f = await check(root);
  assert.deepEqual(msgs(f, "integrasjon").map((m) => m.replace(/^[^:]+: /, "")).sort(), [
    "a må være { kilde: azure-keyvault:<hvelv>/<navn> } (og fil: true for en nøkkelfil), uten verdien",
    "b referansen har ikke $env lenger: skriptene henter verdien fra hvelvet ved hvert kall. Ta bort $env",
    "c må være { kilde: azure-keyvault:<hvelv>/<navn> } (og fil: true for en nøkkelfil), uten verdien",
    "klient.secret står med verdi. En hemmelighet står som { kilde: azure-keyvault:<hvelv>/<navn> } (og fil: true for en nøkkelfil), og verdien ligger i hvelvet",
  ]);
  assert.equal(msgs(f, "persona").length, 2);
  assert.deepEqual(msgs(f, "test").map((m) => m.replace(/^[^:]+: /, "")).sort(), [
    "En test i test/ går gjennom flere løsninger: losninger må ha minst to",
    "Kravet borte finnes ikke i noen krav/",
    "Personaen ukjent finnes ikke (test/personaer/ukjent.yaml)",
    "inn.password står med verdi. En hemmelighet står som { kilde: azure-keyvault:<hvelv>/<navn> } (og fil: true for en nøkkelfil), og verdien ligger i hvelvet",
  ]);
  rmSync(root, { recursive: true });
});

test("losning.yaml: bygger-pa kreves når løsningen er ute av utkast", async () => {
  const root = repo({ ...GOOD(), "losninger/klage/losning.yaml": "formal: Klager\nstatus: ferdig\nintegrasjoner: [fiks]\nbygger-pa: { standard: klage }\n", "losninger/ny/README.md": "" });
  assert.deepEqual(msgs(await check(root), "losning").map((m) => m.replace(/^[^:]+: /, "")).sort(), [
    "bygger-pa må være «egen», eller { standard: <navn>, versjon: <versjon> }, når løsningen er ute av utkast",
    "eier mangler",
    "losning.yaml mangler: formålet, eieren, statusen, integrasjonene og hva den bygger på",
    "status må være utkast, i-test, i-bruk, avviklet",
    "Integrasjonen fiks står ikke i integrasjoner/",
  ].sort());
  rmSync(root, { recursive: true });
});

test("lista over det kunden må gjøre: nå, senere og ferdig, med lenker", () => {
  const root = repo({
    ".claude/settings.json": JSON.stringify({ extraKnownMarketplaces: { "neo-forvaltning": { source: { source: "github", repo: "eier/plugins" } } } }),
    "integrasjoner/entra/hos-kunden.md": "## sso Sett opp SSO\n\n```yaml\nstatus: i-gang\nhvem: IT\n```\n\n## postboks Felles postboks\n\n```yaml\nstatus: ferdig\nhvem: IT\n```\n",
    "integrasjoner/altinn/hos-kunden.md": "## delegering Deleger | rollen\n\n```yaml\nstatus: ikke-startet\nhvem: Hovedadministratoren\netter: [entra/sso, entra/postboks]\n```\n",
  });
  const md = render(root);
  assert.match(md, /## Nå\n\n.*\n.*\n\| entra \| \[Sett opp SSO\]\(integrasjoner\/entra\/hos-kunden.md#sso-sett-opp-sso\) \| i-gang \| IT \| \[entra\]\(https:\/\/github.com\/eier\/plugins\/blob\/main\/docs\/README.md\) \|/);
  assert.match(md, /## Senere\n\n.*\n.*\n\| altinn \| \[Deleger \\\| rollen\]/);
  assert.match(md, /1 av 3 oppgaver er ferdige/);
  rmSync(root, { recursive: true });
});

test("CLI: versjonen, feil bruk, filene i rekkefølgen Neo gir, og mønstrene med det som ikke er vurdert", async () => {
  const lines = [];
  const io = { out: (s) => lines.push(s), err: (s) => lines.push(s), fetchJson: fake() };
  assert.equal(await main(["--versjon"], io), 0);
  assert.equal(lines.pop(), version());
  assert.equal(await main(["--ukjent"], io), 2);
  assert.equal(await main(["slett"], io), 2);
  const root = repo({ ...GOOD(), "losninger/parkering/oppsett/case-wizards/parkering.yaml": "apiVersion: neo-config/v1\nkind: caseWizard\nspec:\n  caseType: parkering\n", "felles/oppsett/custom-fields/case-gnr.yaml": "apiVersion: neo-config/v1\nkind: customFieldDefinition\nspec:\n  name: gnr\n  entityType: case\n" });
  lines.length = 0;
  assert.equal(await main(["filer", "--root", root, "--stier"], io), 0);
  assert.deepEqual(JSON.parse(lines[0]), ["custom-fields/case-gnr.yaml", "case-types/parkering.yaml", "case-wizards/parkering.yaml"]);
  lines.length = 0;
  assert.equal(await main(["regler", "--root", root], io), 0);
  assert.match(lines.join("\n"), /Ikke vurdert, fordi repoet ikke har filer av typen \(det er ikke grønt\): flyt-aktivering \(workflow\)/);
  write(root, "felles/oppsett/case-types/feil.yaml", "a: [1\n");
  assert.equal(await main(["regler", "--root", root], io), 1, "en lesefeil er rødt, aldri ikke vurdert");
  lines.length = 0;
  assert.equal(await main(["--root", root, "--base", "HEAD"], { ...io, fetchJson: down }), 1);
  assert.match(lines.join("\n"), /Fikk ikke hentet skjemaet/);
  rmSync(root, { recursive: true });
});

test("leserne: kildene i en tekst, påstandene og items", () => {
  assert.deepEqual(citations("Fristen [K1] og [K14 § 7], [E1, K3] og [K7–K9]."), ["K1", "K14", "E1", "K3", "K7", "K8", "K9"]);
  assert.deepEqual(citations("En lenke [tekst](K1) er ikke en kilde"), []);
  assert.deepEqual(claims("## A\n\n- En [K1]:\n  - under\n- To\n").map((x) => [x.section, x.text.split("\n").length]), [["A", 2], ["A", 1]]);
  const [b] = items("## b B\n\n```yaml\nhvorfor: Fordi: det står der.\n```\n");
  assert.match(b.error, /^linje 1: /, "YAML er YAML: et kolon med mellomrom i en tekst uten anførselstegn er en feil");
});

test("den bygde fila er den samme sjekken, uten avhengigheter", () => {
  const built = join(here, "..", "plugins", "solution", "scripts", "sjekk.mjs");
  assert.equal(execFileSync("node", [built, "--versjon"], { encoding: "utf8" }).trim(), version());
  assert.doesNotMatch(readFileSync(built, "utf8"), /from "(yaml|ajv)"/);
});
