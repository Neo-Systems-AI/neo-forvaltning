import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { main, run, version } from "./sjekk.mjs";
import { citations, claims, items, points } from "./les.mjs";
import { render } from "./hos-kunden.mjs";
import { ruleIds } from "./avvik.mjs";
import { checkConfigFile } from "./oppsett.mjs";
import { CONFIG, GOOD, KUNDE, LOSNING, REGISTER, caseType, git, krav, repo, write } from "./hjelp.test-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const BUILT = join(here, "..", "plugins", "forvaltning", "scripts", "sjekk.mjs");
const check = (root, opts = {}) => run(root, { base: "HEAD", ...opts });
const msgs = (f, name, level) => f.filter((x) => x.check === name && (!level || x.level === level)).map((x) => `${x.file}: ${x.message}`).sort();
const EMPTY = (type = "standard") => ({ "kunde.yaml": KUNDE(type), ".claude/neo.config.json": CONFIG, ".github/CODEOWNERS": "* @x/y\n" });

test("et repo slik det skal være, gir ingen funn", () => {
  const root = repo(GOOD());
  assert.deepEqual(check(root), []);
  rmSync(root, { recursive: true });
});

test("et tomt standardrepo uten felles/kilder er grønt", () => {
  const root = repo(EMPTY());
  assert.deepEqual(check(root), []);
  rmSync(root, { recursive: true });
});

test("kunde.yaml: typen, kunden, godkjenneren, forvalteren og versjonene, og repo.yaml er blitt kunde.yaml", () => {
  const root = repo({ ...GOOD(), "kunde.yaml": "type: kommune\nkunde: { navn: K }\nforvalter: { navn: \"\" }\n", "repo.yaml": "type: kunde\n" });
  assert.deepEqual(msgs(check(root), "kunde"), [
    "kunde.yaml: forvalter.navn er ikke fylt ut",
    "kunde.yaml: godkjenner mangler. Legg det inn i kunde.yaml, slik malen viser",
    "kunde.yaml: type må være kunde eller standard. Sett type: kunde for én kommune eller virksomhet, type: standard for standardløsninger",
    "kunde.yaml: verktoy mangler: versjonene av malen og forvaltning repoet er laget for. Legg inn verktoy: { mal: <VERSION i malen>, forvaltning: <versjonen av pluginen> }",
  ]);
  assert.deepEqual(msgs(check(root), "repo"), ["repo.yaml: Fila heter kunde.yaml, med type (kunde eller standard). Gi den nytt navn til kunde.yaml, og legg til type"]);
  rmSync(root, { recursive: true });
});

test("strukturen: konfigen i oppsett/ i roten, mappene har navn, ikke tall, og det som ikke har en form, finnes ikke", () => {
  const root = repo({
    ...GOOD(),
    "kunde.yaml": KUNDE("standard"),
    "profil.yaml": "",
    "organisasjon/README.md": "",
    "state/sandkasse.lock.json": "{}",
    "notater/x.md": "",
    "integrasjoner/README.md": "",
    "losninger/parkering/2-forstaelse/x.md": "",
    "losninger/parkering/notater.md": "",
    "losninger/parkering/oppsett/case-types/x.yaml": caseType("x"),
    "felles/oppsett/custom-fields/x.yaml": caseType("y"),
    "losninger/parkering/test/notat.md": "",
    "losninger/parkering/test/runder/runde-1.md": "",
    "losninger/parkering/test/runder/2026-11-20-2.md": "",
    "snapshots/test/x.yaml": caseType("z"),
    "snapshots/x.yaml": caseType("z"),
    "integrasjoner/altinn/neo.yaml": "app: x\n",
    "integrasjoner/altinn/notat.txt": "",
    "integrasjoner/altinn/hemmeligheter.yaml": "altinn-nokkel: { $env: A, kilde: azure-keyvault:kv/a }\n",
  });
  const oppsett = "Konfigen står i oppsett/ i roten, slik Neo eksporterer den, og kravene peker på fila der (blir: fil: oppsett/…). En løsning og felles/ har ingen egen oppsett/. Flytt filene til oppsett/ i roten, og rett blir i kravene";
  assert.deepEqual(msgs(check(root), "repo"), [
    "felles/forstaelse: Et repo for standardløsninger har ingen kunde å forstå, så felles/ har ikke kilder eller forstaelse. Flytt det som gjelder én løsning, inn i løsningen, og ta bort mappa",
    "felles/kilder: Et repo for standardløsninger har ingen kunde å forstå, så felles/ har ikke kilder eller forstaelse. Flytt det som gjelder én løsning, inn i løsningen, og ta bort mappa",
    `felles/oppsett: ${oppsett}`,
    "integrasjoner/README.md: Lista over det kunden må gjøre, lages av sjekken (sjekk.mjs hos-kunden) og committes ikke. Ta den bort fra git",
    "integrasjoner/altinn/hemmeligheter.yaml: Nøklene ligger bare i hvelvet, med faste navn som pluginene bestemmer, og config-fila sier bare hvilket hvelv (hvelv). Ta den bort, og legg nøkkelen inn med /forvaltning:nokler",
    "integrasjoner/altinn/neo.yaml: neo.yaml har ingen form i Neo ennå. Ta den bort",
    "integrasjoner/altinn/notat.txt: En integrasjon har hos-kunden.md, og artefaktene systemet trenger i en egen mappe. Flytt fila inn i en mappe under integrasjonen",
    "losninger/parkering/2-forstaelse: Mappene har navn, ikke tall: 2-forstaelse heter forstaelse. Gi mappa nytt navn",
    "losninger/parkering/notater.md: En løsning har README.md, design, forstaelse, kilder, krav, losning.yaml, test. Det som ikke har en form, finnes ikke. Flytt innholdet inn i en av dem etter reglene i .claude/rules/, og ta bort notater.md",
    `losninger/parkering/oppsett: ${oppsett}`,
    "losninger/parkering/test/notat.md: test/ i en løsning har testcaser/, testplan.md og runder/. Det som ikke har en form, finnes ikke. Flytt innholdet inn i en av dem, og ta bort resten",
    "losninger/parkering/test/runder/runde-1.md: En runde heter etter datoen, ÅÅÅÅ-MM-DD.md, og ÅÅÅÅ-MM-DD-2.md for neste runde samme dag. Gi fila nytt navn",
    "notater: En mappe på roten er en av felles, losninger, integrasjoner, test, oppsett, snapshots, reports. Det som ikke har en form, finnes ikke. Flytt innholdet dit det hører hjemme etter reglene i .claude/rules/, og ta bort mappa",
    "organisasjon: Det som er felles, står i felles/ (felles/krav/, felles/design/), og konfigen i oppsett/. Flytt innholdet dit, og ta bort mappa",
    "profil.yaml: profil.yaml har ingen form i Neo ennå. Ta den bort",
    "snapshots/test: test er ikke et miljø i neo.environments (sandkasse, produksjon). Ta bort mappa, eller rett navnet til miljøet",
    "snapshots/x.yaml: snapshots/ har én mappe per miljø, med filene Neo eksporterte. Ta bort fila, og ta et nytt snapshot med /forvaltning:snapshot",
    "state: Id-ene per miljø finnes ikke lenger: Neo skriver filene med nøkler (forvaltning 0.2.0). Ta bort state/",
  ]);
  rmSync(root, { recursive: true });
});

test("config-fila: version 1 med sandkasse og produksjon under neo.byEnv, hvelvet, og ingen hemmeligheter eller referanser", () => {
  const root = repo({
    ...GOOD(),
    ".claude/neo.config.json": JSON.stringify({
      version: 2,
      hvelv: "<hvelv>",
      neo: { url: "https://neo.test", org: "o", mcpServer: "neo-dev", environments: ["sandkasse", "test"], byEnv: { sandkasse: { url: "https://<neo-adresse>", apiClient: { clientId: "<klient-id>", clientSecret: { $env: "NEO_K", kilde: "azure-keyvault:kv/neo" } } }, annen: {} } },
      fiks: { passord: "hemmelig", nokkel: { $env: "X" }, hemmeligheter: { ok: { $env: "OK", kilde: "azure-keyvault:kv/ok" } } },
      documaster: { klient: { hemmeligheter: "abc" } },
      oppsettDir: "oppsett",
    }),
  });
  const f = check(root);
  assert.deepEqual(msgs(f, "config", "fail"), [
    ".claude/neo.config.json: documaster.klient.hemmeligheter: Nøklene ligger bare i hvelvet, med faste navn som pluginene bestemmer, og config-fila sier bare hvilket hvelv (hvelv). Ta den bort, og legg nøkkelen inn med /forvaltning:nokler",
    ".claude/neo.config.json: fiks.hemmeligheter: Nøklene ligger bare i hvelvet, med faste navn som pluginene bestemmer, og config-fila sier bare hvilket hvelv (hvelv). Ta den bort, og legg nøkkelen inn med /forvaltning:nokler",
    ".claude/neo.config.json: fiks.nokkel er en referanse. Nøklene ligger bare i hvelvet, med faste navn som pluginene bestemmer, og config-fila sier bare hvilket hvelv (hvelv). Ta den bort, og legg nøkkelen inn med /forvaltning:nokler",
    ".claude/neo.config.json: fiks.passord står med verdi. Config-fila har ingen hemmeligheter",
    ".claude/neo.config.json: neo.byEnv.annen er ikke et miljø i neo.environments. Ta den bort, eller legg miljøet til i neo.environments",
    ".claude/neo.config.json: neo.byEnv.sandkasse.apiClient.clientSecret: Nøklene ligger bare i hvelvet, med faste navn som pluginene bestemmer, og config-fila sier bare hvilket hvelv (hvelv). Ta den bort, og legg nøkkelen inn med /forvaltning:nokler (neo--sandkasse-klient)",
    ".claude/neo.config.json: neo.environments har ikke produksjon. Miljøene er sandkasse og produksjon: legg det til",
    ".claude/neo.config.json: neo.url, neo.org, neo.mcpServer står rett under neo. Miljøene står under neo.byEnv.<miljø> med mcpServer og url, og org-en er miljøet. Flytt dem dit, slik malen viser",
    ".claude/neo.config.json: version må være 1: versjon 2 hadde ett miljø (neo.url, neo.org, neo.mcpServer). Nå er det sandkasse og produksjon under neo.byEnv. Sett version: 1, i formen malen har",
  ]);
  assert.deepEqual(msgs(f, "config", "warn"), [
    ".claude/neo.config.json: Adressen til Neo for sandkasse er ikke fylt ut (neo.byEnv.sandkasse.url)",
    ".claude/neo.config.json: Adressen til Neo for test er ikke fylt ut (neo.byEnv.test.url)",
    ".claude/neo.config.json: Hvelvet er ikke fylt ut (hvelv): navnet på Key Vault-hvelvet nøklene ligger i",
    ".claude/neo.config.json: Maskinklienten for sandkasse er ikke fylt ut (neo.byEnv.sandkasse.apiClient). Skriptene i forvaltning trenger den",
  ]);
  rmSync(root, { recursive: true });
});

test("konfigfilene i oppsett/ og snapshots/ er Neos filer: den gamle JSON-formen, en fil som ikke er fra Neo, og et rått svar er rødt", () => {
  const root = repo({
    ...GOOD(),
    "oppsett/list_case_types.json": "[]",
    "oppsett/case-types/x.yaml": "name: x\n",
    "oppsett/notat.txt": "",
    "oppsett/manuelt/maler.md": "# Malene\n",
    "snapshots/sandkasse/raw/export_config.json": "{}",
    "snapshots/produksjon/get_workflow--a.json": "{}",
  });
  const old = "Formen fra før forvaltning 0.2.0. Ta et nytt snapshot (/forvaltning:snapshot) og bygg oppsettet fra filene Neo skriver";
  assert.deepEqual(msgs(check(root), "oppsett"), [
    "oppsett/case-types/x.yaml: Ikke en konfigfil fra Neo: den må ha apiVersion: neo-config/v1, kind og spec øverst. Ta et snapshot (/forvaltning:snapshot) og bygg fila fra den Neo skriver",
    `oppsett/list_case_types.json: ${old}`,
    "oppsett/notat.txt: Ikke en konfigfil. Oppsettet er .yaml-filer fra Neo; det som gjøres for hånd, står i oppsett/manuelt/. Ta fila bort, eller flytt den dit",
    `snapshots/produksjon/get_workflow--a.json: ${old}`,
    "snapshots/sandkasse/raw/export_config.json: Et rått svar er committet. raw/ står i .gitignore",
  ]);
  assert.deepEqual(checkConfigFile("oppsett/case-types/a.yaml", "apiVersion: neo-config/v1\nkind: caseType\nspec:\n  slug: a\n  farge: hva som helst\n"), [], "innholdet vurderes ikke: det gjør Neo i planen");
  rmSync(root, { recursive: true });
});

test("en konfigfil i oppsett/ uten krav bak seg er gul", () => {
  const root = repo({ ...GOOD(), "oppsett/workflows/varsel.yaml": "apiVersion: neo-config/v1\nkind: workflow\nspec:\n  name: Varsel\n" });
  assert.deepEqual(msgs(check(root), "brukt", "warn"), ["oppsett/workflows/varsel.yaml: Ingen krav har denne fila som blir. En fil uten krav bak seg lages ikke"]);
  rmSync(root, { recursive: true });
});

test("kildene på endringen: en endret kilde er rød, en slettet bare når den ikke er trukket tilbake, og det før basen telles ikke", () => {
  const root = repo(GOOD());
  const L = "losninger/parkering/kilder";
  write(root, `${L}/filer/K1_forskriften.md`, "§ 1 Fristen er fire uker.\n");
  git(root, "commit", "-qam", "endret før basen");
  git(root, "tag", "base");
  assert.deepEqual(msgs(check(root, { base: "base" }), "kilder"), []);
  write(root, `${L}/filer/K1_forskriften.md`, "§ 1 Fristen er fem uker.\n");
  assert.deepEqual(msgs(check(root, { base: "base" }), "kilder"), [`${L}/filer/K1_forskriften.md: En lagret kilde er endret. En kilde endres aldri: en ny versjon får en ny id og en ny fil. Sett fila tilbake (git checkout), og lagre den nye versjonen som en ny kilde`]);
  git(root, "checkout", "-q", "--", ".");
  unlinkSync(join(root, `${L}/filer/K1_forskriften.md`));
  write(root, `${L}/kilder.md`, REGISTER);
  assert.match(msgs(check(root, { base: "base" }), "kilder")[0], /En lagret kilde er slettet. En kilde slettes ikke; den trekkes tilbake/);
  write(root, `${L}/kilder.md`, REGISTER.replace("[`filer/K1_forskriften.md`](filer/K1_forskriften.md)", "`filer/K1_forskriften.md` Trukket tilbake: hadde personopplysninger"));
  const f = check(root, { base: "base" });
  assert.deepEqual(msgs(f, "kilder"), []);
  assert.deepEqual(msgs(f, "forstaelse"), ["losninger/parkering/forstaelse/forlop.md: K1 er trukket tilbake (hadde personopplysninger). Skriv påstanden fra en annen kilde, eller ta den bort"]);
  assert.match(msgs(f, "krav")[0], /frist: K1 er trukket tilbake/);
  rmSync(root, { recursive: true });
});

test("uten basen er kildene ikke sjekket, og det er rødt", () => {
  const root = repo(GOOD());
  assert.deepEqual(msgs(check(root, { base: "origin/main" }), "kilder"), [".: Fant ikke basen «origin/main» i git, så det er ikke sjekket at kildene er uendret. Si basen med --base <ref> (i en PR: origin/<grenen den skal inn i>; før første commit: HEAD)"]);
  rmSync(root, { recursive: true });
});

test("forståelsen: en påstand uten kilde, eller med en kilde som ikke er i registeret på samme sted", () => {
  const root = repo({ ...GOOD(), "losninger/parkering/forstaelse/data.md": "# Data\n\n- Maks 1 400.\n- Maks 1 850. [K99]\n- Fristene står i `forlop.md`.\n", "felles/forstaelse/systemer.md": "- Arkivet er Documaster. [K2]\n", "losninger/parkering/kilder/filer/K2_x.pdf": "x" });
  const f = check(root);
  assert.deepEqual(msgs(f, "forstaelse"), [
    "felles/forstaelse/systemer.md: K2 står ikke i registeret (felles/kilder/kilder.md). Rett id-en, eller legg kilden inn i registeret",
    "losninger/parkering/forstaelse/data.md: K99 står ikke i registeret (losninger/parkering/kilder/kilder.md). Rett id-en, eller legg kilden inn i registeret",
    "losninger/parkering/forstaelse/data.md: Påstanden viser ikke til en kilde: «Maks 1 400.». Vis til kilden ([K1]), eller flytt den til «Det kildene ikke svarer på»",
  ]);
  assert.deepEqual(msgs(f, "kilder"), ["losninger/parkering/kilder/filer/K2_x.pdf: Fila står ikke i registeret (losninger/parkering/kilder/kilder.md). En lagret kilde har en id og opphav. Legg den inn i registeret med id, lenke og datoene"]);
  rmSync(root, { recursive: true });
});

test("kravene: item med yaml, flyt, hvorfor, kilde, id én gang, og blir på fila i oppsett/ når løsningen er ute av utkast. Sett bygger-pa i losning.yaml", () => {
  const root = repo({
    ...GOOD(),
    "losninger/parkering/krav/dokumenter.md": [
      krav("vedtak"),
      "## frist Igjen\n\n```yaml\nflyt: automatisk\nkilde: [K9, forstaelse/forlop.md#borte]\nblir:\n  - steg: Noe\n  - fil: oppsett/case-types/borte.yaml\n  - fil: ../../README.md\n  - fil: felles/oppsett/custom-fields/x.yaml\n  - fil: oppsett/manuelt/maler.md\n  - onske: x\n    hvorfor: y\n    fil: z\n```\n",
      "## uten-blokk Et krav uten yaml-blokken\n\nTeksten, men ingen blokk.\n",
      "## felt Feltet\n\n```yaml\nflyt: menneske\nhvorfor: x\nkilde: [forstaelse/forlop.md#forløpet]\nblir:\n  - fil: oppsett/custom-fields/case-gnr.yaml\n```\n",
    ].join("\n"),
    "oppsett/custom-fields/case-gnr.yaml": "apiVersion: neo-config/v1\nkind: customFieldDefinition\nspec:\n  name: gnr\n  entityType: case\n",
  });
  assert.deepEqual(msgs(check(root), "krav").map((m) => m.replace(/^[^:]+: /, "")).sort(), [
    "Id-en frist er brukt før, i losninger/parkering/krav/dokumenter.md. Gi dette kravet en ny id",
    "frist: K9 står ikke i registeret (losninger/parkering/kilder/kilder.md). Rett id-en, eller legg kilden inn i registeret",
    "frist: blir.fil ../../README.md er ikke en konfigfil i oppsett/: oppsett/<mappa for typen>/<navn>.yaml, fra roten. Det som gjøres for hånd, er et steg",
    "frist: blir.fil felles/oppsett/custom-fields/x.yaml: konfigen står i oppsett/ i roten, slik Neo eksporterer den. En løsning og felles/ har ingen egen oppsett/. Flytt filene til oppsett/ i roten, og rett blir i kravene",
    "frist: blir.fil oppsett/case-types/borte.yaml finnes ikke. Rett stien til fila i oppsett/",
    "frist: blir.fil oppsett/manuelt/maler.md er ikke en konfigfil i oppsett/: oppsett/<mappa for typen>/<navn>.yaml, fra roten. Det som gjøres for hånd, er et steg",
    "frist: blir.steg trenger hvorfor. Skriv hvorfor kravet ikke ble konfig",
    "frist: flyt må være deterministisk, agentisk, menneske. Sett den som passer (formen står i .claude/rules/krav.md)",
    "frist: hver linje i blir er én av { fil: <sti> }, { steg: <tekst>, hvorfor: <tekst> } eller { onske: <tekst>, hvorfor: <tekst> }. Skriv linja i en av dem",
    "frist: hvorfor mangler. Skriv hvorfor kravet finnes",
    "frist: overskriften #borte finnes ikke i forstaelse/forlop.md. Rett lenken til en overskrift som finnes",
    "vedtak: blir mangler. Løsningen er i-test, så hvert krav sier hva det ble: { fil: oppsett/… }, { steg: …, hvorfor: … } eller { onske: …, hvorfor: … }",
    "«uten-blokk Et krav uten yaml-blokken» har ingen yaml-blokk rett under. Et krav er «## <id> <tittel>» med yaml-blokken (flyt, hvorfor, kilde, blir) rett under. Legg blokken rett under overskriften, eller gjør overskriften til en vanlig tekst",
  ].sort());
  write(root, "losninger/parkering/losning.yaml", LOSNING("utkast"));
  assert.ok(!msgs(check(root), "krav").some((m) => /vedtak: blir mangler/.test(m)), "i utkast kan blir stå tomt");
  rmSync(root, { recursive: true });
});

test("avvikene i design/: en regel som finnes og grunnen, og fila i oppsett/ når løsningen er ute av utkast. Sett bygger-pa i losning.yaml", () => {
  const root = repo({
    ...GOOD(),
    "felles/design/valg.md": "## to-parkering To sakstyper med samme navn\n\n```yaml\navvik: navn-er-nokkelen\nfil: case-types/kommer.yaml\ngrunn: Kunden vil ha det slik i overgangen.\n```\n",
    "losninger/parkering/design/valg.md": "## samme Samme\n\n```yaml\navvik: navn-er-nokkelen\nfil: case-types/parkering.yaml\ngrunn: Overgangen.\n```\n\n## borte Borte\n\n```yaml\navvik: navn-og-slug\nfil: oppsett/case-types/borte.yaml\ngrunn: x\n```\n\n## feil Feil\n\n```yaml\navvik: finnes-ikke\n```\n",
  });
  const f = check(root);
  assert.deepEqual(msgs(f, "avvik", "fail"), [
    "losninger/parkering/design/valg.md: borte: oppsett/case-types/borte.yaml finnes ikke. Avviket kan stå før fila mens løsningen er i utkast; nå er den i-test. Rett stien, eller lag fila i oppsett/",
    "losninger/parkering/design/valg.md: feil: grunn mangler. Skriv hvorfor regelen brytes med vilje",
    "losninger/parkering/design/valg.md: feil: regelen «finnes-ikke» finnes ikke i mønstrene. Rett id-en til en regel som finnes (mønstrene i pluginen solution)",
  ]);
  assert.deepEqual(msgs(f, "avvik", "warn"), ["felles/design/valg.md: to-parkering: oppsett/case-types/kommer.yaml finnes ikke ennå"]);
  write(root, "losninger/parkering/losning.yaml", LOSNING("utkast"));
  assert.ok(!msgs(check(root), "avvik").some((m) => /borte:/.test(m)), "i utkast kan avviket stå før fila");
  assert.ok(ruleIds().has("navn-er-nokkelen") && ruleIds().size > 50);
  rmSync(root, { recursive: true });
});

test("integrasjonene, personaene og testcasene: ingen hemmeligheter", () => {
  const root = repo({
    ...GOOD(),
    "integrasjoner/altinn/app/oppsett.yaml": "klient:\n  secret: abc\n",
    "test/personaer/leder.yaml": "navn: Lea\nrolle: leder\nhemmeligheter:\n  passord: hemmelig\n",
    "losninger/parkering/test/testcaser/b.yaml": "beskrivelse: b\nforventet: { krav: [frist, borte] }\npersona: ukjent\ninn: { password: x }\n",
    "test/innboks.yaml": "beskrivelse: x\nlosninger: [parkering]\nforventet: { krav: [frist] }\n",
  });
  const f = check(root);
  assert.deepEqual(msgs(f, "integrasjon").map((m) => m.replace(/^[^:]+: /, "")).sort(), [
    "klient.secret står med verdi. En hemmelighet står aldri i repoet. Ta verdien ut, be eieren bytte den (den er ikke hemmelig lenger), og legg den nye inn i hvelvet med /forvaltning:nokler",
  ]);
  assert.deepEqual(msgs(f, "persona"), ["test/personaer/leder.yaml: hemmeligheter står ikke i en persona: personen logger inn selv, og passordet ligger der testidentiteten forvaltes. Ta bort hemmeligheter, og be eieren bytte verdier som har stått her"]);
  assert.deepEqual(msgs(f, "test").map((m) => m.replace(/^[^:]+: /, "")).sort(), [
    "En test i test/ går gjennom flere løsninger: losninger må ha minst to. Flytt en test for én løsning til løsningens test/testcaser/",
    "Kravet borte finnes ikke i noen krav/. Rett id-en, eller skriv kravet",
    "Personaen ukjent finnes ikke (test/personaer/ukjent.yaml)",
    "inn.password står med verdi. En hemmelighet står aldri i repoet. Ta verdien ut, be eieren bytte den (den er ikke hemmelig lenger), og legg den nye inn i hvelvet med /forvaltning:nokler",
  ]);
  rmSync(root, { recursive: true });
});

test("testplanen i en minste form: hvert krav har et punkt, og et punkt viser til krav som finnes", () => {
  const root = repo({
    ...GOOD(),
    "losninger/parkering/krav/dokumenter.md": krav("vedtak", "blir:\n  - steg: Malen lages i Neo\n    hvorfor: Malene er ikke med i filene ennå\n"),
    "losninger/parkering/test/testplan.md": "# Testplanen\n\n## Riggen\n\nTekst.\n\n## p1 Fristen\n\n```yaml\nkrav: [frist, borte]\n```\n\n### p2 Tom\n\n```yaml\nkrav: []\n```\n",
  });
  assert.deepEqual(msgs(check(root), "test"), [
    "losninger/parkering/test/testplan.md: Kravet vedtak har ikke et punkt i testplanen. Hvert krav har minst ett punkt: en overskrift med krav: [vedtak] i yaml-blokken under",
    "losninger/parkering/test/testplan.md: p1: kravet borte finnes ikke i noen krav/. Rett id-en, eller skriv kravet",
    "losninger/parkering/test/testplan.md: p2: krav er tomt. Skriv kravene punktet prøver (krav: [<id>])",
  ]);
  rmSync(root, { recursive: true });
});

test("CODEOWNERS: en kommentar som forklarer @ENDRE-MEG, teller ikke; en eierlinje med den gjør", () => {
  const root = repo({ ...GOOD(), ".github/CODEOWNERS": "# Bytt @ENDRE-MEG med godkjenneren.\n* @eier/godkjennere\n" });
  assert.deepEqual(msgs(check(root), "godkjenner"), []);
  write(root, ".github/CODEOWNERS", "# Bytt @ENDRE-MEG med godkjenneren.\n* @ENDRE-MEG\n");
  assert.equal(msgs(check(root), "godkjenner", "warn").length, 1);
  rmSync(root, { recursive: true });
});

test("losning.yaml: bygger-pa kreves når løsningen er ute av utkast. Sett bygger-pa i losning.yaml", () => {
  const root = repo({ ...GOOD(), "losninger/klage/losning.yaml": "formal: Klager\nstatus: ferdig\nintegrasjoner: [fiks]\nbygger-pa: { standard: klage }\n", "losninger/ny/README.md": "" });
  assert.deepEqual(msgs(check(root), "losning").map((m) => m.replace(/^[^:]+: /, "")).sort(), [
    "bygger-pa må være «egen», eller { standard: <navn>, versjon: <versjon> }, når løsningen er ute av utkast. Sett bygger-pa i losning.yaml",
    "eier mangler. Legg det inn i losning.yaml",
    "losning.yaml mangler: formålet, eieren, statusen, integrasjonene og hva den bygger på. Løypa i pluginen solution lager den; formen står i .claude/rules/losninger.md",
    "status må være utkast, i-test, i-bruk, avviklet. Sett den som gjelder",
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

test("CLI: versjonen, feil bruk, og rødt gir exit 1", async () => {
  const lines = [];
  const io = { out: (s) => lines.push(s), err: (s) => lines.push(s) };
  assert.equal(await main(["--versjon"], io), 0);
  assert.equal(lines.pop(), version());
  assert.equal(await main(["--ukjent"], io), 2);
  assert.equal(await main(["regler"], io), 2, "mønstrene på filene er ikke i sjekken: gjennomgangen av konfigen leser uttrekket fra Neo");
  const root = repo(GOOD());
  assert.equal(await main(["--root", root, "--base", "HEAD"], io), 0);
  write(root, "oppsett/case-types/feil.yaml", "a: [1\n");
  lines.length = 0;
  assert.equal(await main(["--root", root, "--base", "HEAD"], io), 1);
  assert.match(lines.join("\n"), /oppsett\/case-types\/feil.yaml: Ikke en konfigfil fra Neo/);
  rmSync(root, { recursive: true });
});

test("leserne: kildene i en tekst, påstandene, items og punktene i en testplan", () => {
  assert.deepEqual(citations("Fristen [K1] og [K14 § 7], [E1, K3] og [K7–K9]."), ["K1", "K14", "E1", "K3", "K7", "K8", "K9"]);
  assert.deepEqual(citations("En lenke [tekst](K1) er ikke en kilde"), []);
  assert.deepEqual(claims("## A\n\n- En [K1]:\n  - under\n- To\n").map((x) => [x.section, x.text.split("\n").length]), [["A", 2], ["A", 1]]);
  const [b] = items("## b B\n\n```yaml\nhvorfor: Fordi: det står der.\n```\n");
  assert.match(b.error, /^linje 1: /, "YAML er YAML: et kolon med mellomrom i en tekst uten anførselstegn er en feil");
  assert.deepEqual(points("## p1 A\n\n```yaml\nkrav: [a, b]\n```\n\n## annet\n\n```yaml\nx: 1\n```\n").map((p) => [p.id, p.krav]), [["p1", ["a", "b"]]]);
});

test("den bygde fila er den samme sjekken, uten avhengigheter", () => {
  assert.equal(execFileSync("node", [BUILT, "--versjon"], { encoding: "utf8" }).trim(), version());
  assert.doesNotMatch(readFileSync(BUILT, "utf8"), /from "(yaml|ajv)"/);
});

// Node gir process.argv[1] slik stien ble sagt, og import.meta.url med symlenkene løst opp. Gjennom en symlenke (som
// mktemp -d på macOS, der /var er en lenke til /private/var) ble de ulike, og sjekken var grønn uten å kjøre.
test("den bygde fila kjører gjennom en symlenke, og sier noe på hver vei", () => {
  const dir = mkdtempSync(join(tmpdir(), "lenke-"));
  const link = join(dir, "sjekk.mjs");
  symlinkSync(BUILT, link);
  const root = repo(EMPTY());
  const runIt = (...args) => {
    try {
      return { code: 0, out: execFileSync("node", [link, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
    } catch (e) {
      return { code: e.status, out: `${e.stdout}${e.stderr}` };
    }
  };
  assert.equal(runIt("--versjon").out.trim(), version());
  assert.deepEqual(runIt("--root", root, "--base", "HEAD"), { code: 0, out: `Ingen funn (sjekken ${version()}).\n` });
  write(root, "profil.yaml", "");
  const red = runIt("--root", root, "--base", "HEAD");
  assert.equal(red.code, 1);
  assert.match(red.out, /profil.yaml/);
  for (const args of [["hos-kunden", "--root", root], ["--ukjent"], ["slett"]]) {
    const r = runIt(...args);
    assert.ok(r.out.trim().length > 0, `${args.join(" ")} gir exit ${r.code} uten utskrift`);
  }
  rmSync(dir, { recursive: true });
  rmSync(root, { recursive: true });
});
