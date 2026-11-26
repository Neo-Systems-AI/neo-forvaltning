// Strukturen i repoet for typen i kunde.yaml, og formen på filene repoet eier: kunde.yaml, config-fila, losning.yaml,
// hemmelighetene og oppgavene til hver integrasjon, personaene og testcasene. Det som ikke har en form, finnes ikke:
// en mappe eller fil som ikke står her, er rød, med det den er blitt til.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { dirs, entries, isMap, items, list, mdFiles, places, points, readYaml, text, yamlFiles } from "./les.mjs";

export const CHECKS = [
  { name: "kunde", about: "kunde.yaml har typen, kunden, godkjenneren, forvalteren og versjonene" },
  { name: "repo", about: "Repoet har mappene typen sier, og ingen andre: konfigen i oppsett/ i roten, snapshotene per miljø, og ingen oppsett/ i en løsning eller i felles/" },
  { name: "config", about: ".claude/neo.config.json er version 1 med miljøene sandkasse og produksjon, adressen, maskinklienten og hvelvet, og ingen hemmeligheter, heller ikke referanser" },
  { name: "hemmeligheter", about: "Ingen filer med hemmeligheter (.env, .keys/) er committet" },
  { name: "godkjenner", about: ".github/CODEOWNERS nevner en ekte godkjenner" },
  { name: "losning", about: "Hver løsning har losning.yaml med formål, eier, status og integrasjonene, og hva den bygger på når den er ute av utkast" },
  { name: "integrasjon", about: "Ingen hemmelighet står med verdi, og oppgavene hos kunden har status, hvem og det de venter på" },
  { name: "persona", about: "Hver persona har navn og rolle, og ingen hemmeligheter: personen logger inn selv" },
  { name: "test", about: "Hver testcase har en beskrivelse og kravene den prøver, testplanen har et punkt per krav, og hver runde heter etter datoen" },
];

export const TYPER = ["kunde", "standard"];
export const STATUS_LOSNING = ["utkast", "i-test", "i-bruk", "avviklet"];
export const STATUS_OPPGAVE = ["ikke-startet", "i-gang", "ferdig"];
export const PERSONAER = "test/personaer";

// En nøkkel med et navn som dette er en hemmelighet. Den står aldri med verdi i en fil.
export const SECRET_KEY = /(passord|password|secret|hemmelig|token|apikey|api_key|privatekey|private_key|nokkel|nøkkel|^key$|keypem)/i;

// Nøklene ligger bare i hvelvet, med faste navn som pluginene bestemmer (<system>--<navn>), og config-fila sier bare
// hvilket hvelv (`hvelv`). En referanse ({ $env, kilde }) og `<system>.hemmeligheter` er den gamle formen.
export const NOKLER = "Nøklene ligger bare i hvelvet, med faste navn som pluginene bestemmer, og config-fila sier bare hvilket hvelv (hvelv). Ta den bort, og legg nøkkelen inn med /forvaltning:nokler";

// Det som er blitt til noe annet. Står det igjen, sier sjekken hva det er blitt.
const GAMMELT = {
  "repo.yaml": "Fila heter kunde.yaml, med type (kunde eller standard)",
  state: "Id-ene per miljø finnes ikke lenger: Neo skriver filene med nøkler (forvaltning 0.2.0). Ta bort state/",
  "profil.yaml": "profil.yaml har ingen form i Neo ennå. Ta den bort",
  virksomheten: "Det som gjelder hele kunden, står i felles/kilder/ og felles/forstaelse/",
  organisasjon: "Det som er felles, står i felles/ (felles/krav/, felles/design/), og konfigen i oppsett/",
};
const NUMMERERT = { "1-kilder": "kilder", "2-forstaelse": "forstaelse", "3-krav": "krav", "4-design": "design", "5-oppsett": "oppsett", "6-test": "test" };
const LEDD = ["kilder", "forstaelse", "krav", "design"];
// Mappene på roten. Det som starter med punktum (.claude, .github), og filene på roten, står utenfor.
export const ROTEN = ["felles", "losninger", "integrasjoner", "test", "oppsett", "snapshots", "reports"];
// En runde i UI: datoen, og et løpenummer når det er flere runder samme dag.
export const RUNDE = /^\d{4}-\d{2}-\d{2}(-\d+)?\.md$/;
const EGEN_OPPSETT = "Konfigen står i oppsett/ i roten, slik Neo eksporterer den, og kravene peker på fila der (blir: fil: oppsett/…). En løsning og felles/ har ingen egen oppsett/";

// kunde.yaml: typen, kunden (eieren av oppsettet), godkjenneren, forvalteren og versjonene repoet er laget for.
export function readKunde(root) {
  const file = "kunde.yaml";
  const f = [];
  if (!existsSync(join(root, file))) return { type: undefined, findings: [{ check: "kunde", file, message: "Mangler. kunde.yaml sier hva repoet er (kunde eller standard), hvem det er for, og hvem som godkjenner og forvalter" }] };
  const y = readYaml(root, file, "kunde", f);
  if (y === undefined) return { type: undefined, findings: f };
  if (!isMap(y)) return { type: undefined, findings: [{ check: "kunde", file, message: "kunde.yaml er tom eller ikke et kart" }] };
  if (!TYPER.includes(y.type)) f.push({ check: "kunde", file, message: `type må være ${TYPER.join(" eller ")}` });
  for (const k of ["kunde", "godkjenner", "forvalter"]) {
    if (!isMap(y[k])) f.push({ check: "kunde", file, message: `${k} mangler` });
    else if (!text(y[k].navn)) f.push({ check: "kunde", level: "warn", file, message: `${k}.navn er ikke fylt ut` });
  }
  if (!isMap(y.verktoy) || !text(String(y.verktoy.mal ?? "")) || !text(String(y.verktoy.forvaltning ?? ""))) f.push({ check: "kunde", file, message: "verktoy mangler: versjonene av malen og forvaltning repoet er laget for" });
  return { type: TYPER.includes(y.type) ? y.type : undefined, findings: f };
}

// Mappene typen sier, og ingen andre.
export function checkLayout(root, type, envs = []) {
  const f = [];
  const red = (file, message) => f.push({ check: "repo", file, message });
  for (const [p, why] of Object.entries(GAMMELT)) if (existsSync(join(root, p))) red(p, why);
  if (existsSync(join(root, "integrasjoner/README.md"))) red("integrasjoner/README.md", "Lista over det kunden må gjøre, lages av sjekken (sjekk.mjs hos-kunden) og committes ikke. Ta den bort");
  for (const n of dirs(root, ".")) {
    if (n.startsWith(".") || ROTEN.includes(n) || n in GAMMELT) continue;
    red(n, `En mappe på roten er en av ${ROTEN.join(", ")}. Det som ikke har en form, finnes ikke`);
  }
  for (const n of entries(root, "snapshots")) {
    if (n === "README.md" || n.startsWith(".")) continue;
    if (!dirs(root, "snapshots").includes(n)) red(`snapshots/${n}`, "snapshots/ har én mappe per miljø, med filene Neo eksporterte");
    else if (envs.length && !envs.includes(n)) red(`snapshots/${n}`, `${n} er ikke et miljø i neo.environments (${envs.join(", ")})`);
  }
  const kunde = type !== "standard";
  for (const p of places(root)) {
    const allowed = new Set(["README.md", ...(p.felles ? [] : ["losning.yaml", "test"]), ...LEDD.filter((l) => !p.felles || kunde || !["kilder", "forstaelse"].includes(l))]);
    for (const n of entries(root, p.dir)) {
      if (allowed.has(n) || n.startsWith(".")) continue;
      const rel = `${p.dir}/${n}`;
      if (NUMMERERT[n]) red(rel, `Mappene har navn, ikke tall: ${n} heter ${NUMMERERT[n]}`);
      else if (n === "spor.yaml") red(rel, "Hva hvert krav ble, står i kravet selv (blir). Det finnes ingen sporingsfil");
      else if (n === "oppsett") red(rel, EGEN_OPPSETT);
      else if (p.felles && ["kilder", "forstaelse"].includes(n)) red(rel, "Et repo for standardløsninger har ingen kunde å forstå, så felles/ har ikke kilder eller forstaelse");
      else red(rel, `${p.felles ? "felles/" : "En løsning"} har ${[...allowed].sort().join(", ")}. Det som ikke har en form, finnes ikke`);
    }
    if (!p.felles) {
      for (const n of entries(root, `${p.dir}/test`)) {
        if (["testcaser", "runder", "testplan.md", "README.md"].includes(n) || n.startsWith(".")) continue;
        red(`${p.dir}/test/${n}`, "test/ i en løsning har testcaser/, testplan.md og runder/. Det som ikke har en form, finnes ikke");
      }
      for (const n of entries(root, `${p.dir}/test/runder`)) {
        if (n.startsWith(".") || RUNDE.test(n)) continue;
        red(`${p.dir}/test/runder/${n}`, "En runde heter etter datoen, ÅÅÅÅ-MM-DD.md, og ÅÅÅÅ-MM-DD-2.md for neste runde samme dag");
      }
    }
  }
  for (const s of dirs(root, "integrasjoner")) {
    for (const n of entries(root, `integrasjoner/${s}`)) {
      const rel = `integrasjoner/${s}/${n}`;
      if (["hos-kunden.md", "README.md"].includes(n) || n.startsWith(".")) continue;
      if (n === "neo.yaml" || n === "miljoer") red(rel, `${n} har ingen form i Neo ennå. Ta den bort`);
      else if (n === "hemmeligheter.yaml") red(rel, NOKLER);
      else if (!dirs(root, `integrasjoner/${s}`).includes(n)) red(rel, "En integrasjon har hos-kunden.md, og artefaktene systemet trenger i en egen mappe");
    }
  }
  return f;
}

// Config-fila pluginene leser: version 1, miljøene i Neo (sandkasse og produksjon) med MCP-serveren og adressen per
// miljø under neo.byEnv, og hvelvet nøklene ligger i. Aldri en hemmelighet, heller ikke en referanse til en.
export const MILJOER = ["sandkasse", "produksjon"];
export function readConfig(root) {
  const file = ".claude/neo.config.json";
  if (!existsSync(join(root, file))) return { envs: [], findings: [{ check: "config", file, message: "Mangler. Pluginene leser den; /forvaltning:oppstart lager den" }] };
  let data;
  try {
    data = JSON.parse(readFileSync(join(root, file), "utf8"));
  } catch (e) {
    return { envs: [], findings: [{ check: "config", file, message: `Ikke gyldig JSON: ${e.message}` }] };
  }
  const f = [];
  if (data.version !== 1) f.push({ check: "config", file, message: `version må være 1${data.version === 2 ? ": versjon 2 hadde ett miljø (neo.url, neo.org, neo.mcpServer). Nå er det sandkasse og produksjon under neo.byEnv" : ""}` });
  const neo = isMap(data.neo) ? data.neo : {};
  const old = ["url", "org", "mcpServer"].filter((k) => k in neo);
  if (old.length) f.push({ check: "config", file, message: `${old.map((k) => `neo.${k}`).join(", ")} står rett under neo. Miljøene står under neo.byEnv.<miljø> med mcpServer og url, og org-en er miljøet` });
  const envs = Array.isArray(neo.environments) ? neo.environments.map(String) : [];
  if (!envs.length) f.push({ check: "config", file, message: `neo.environments mangler: ${MILJOER.join(" og ")}` });
  else for (const e of MILJOER) if (!envs.includes(e)) f.push({ check: "config", file, message: `neo.environments har ikke ${e}. Miljøene er ${MILJOER.join(" og ")}` });
  if (neo.defaultEnv !== undefined && !envs.includes(neo.defaultEnv)) f.push({ check: "config", file, message: `neo.defaultEnv «${neo.defaultEnv}» er ikke et miljø i neo.environments` });
  for (const env of Object.keys(isMap(neo.byEnv) ? neo.byEnv : {})) if (!envs.includes(env)) f.push({ check: "config", file, message: `neo.byEnv.${env} er ikke et miljø i neo.environments` });
  for (const env of envs) {
    const v = isMap(neo.byEnv?.[env]) ? neo.byEnv[env] : {};
    if (!/^https:\/\/[^<>\s]+$/.test(String(v.url ?? ""))) f.push({ check: "config", level: "warn", file, message: `Adressen til Neo for ${env} er ikke fylt ut (neo.byEnv.${env}.url)` });
    if (v.apiClient !== undefined && !/^[^<>\s]+$/.test(String(v.apiClient?.clientId ?? ""))) f.push({ check: "config", level: "warn", file, message: `Maskinklienten for ${env} er ikke fylt ut (neo.byEnv.${env}.apiClient). Skriptene i forvaltning trenger den` });
    if (isMap(v.apiClient) && "clientSecret" in v.apiClient) f.push({ check: "config", file, message: `neo.byEnv.${env}.apiClient.clientSecret: ${NOKLER} (neo--${env}-klient)` });
  }
  if (data.hvelv === undefined || /<[^>]*>/.test(String(data.hvelv))) f.push({ check: "config", level: "warn", file, message: "Hvelvet er ikke fylt ut (hvelv): navnet på Key Vault-hvelvet nøklene ligger i" });
  else if (typeof data.hvelv !== "string" || !/^[A-Za-z0-9-]{3,24}$/.test(data.hvelv)) f.push({ check: "config", file, message: `hvelv er navnet på et Key Vault-hvelv (3–24 tegn: bokstaver, tall og bindestrek), ikke ${JSON.stringify(data.hvelv)}` });
  const walk = (x, path) => {
    if (!x || typeof x !== "object") return;
    if (!Array.isArray(x) && ("$env" in x || "kilde" in x)) {
      if (!path.endsWith(".clientSecret")) f.push({ check: "config", file, message: `${path} er en referanse. ${NOKLER}` });
      return;
    }
    for (const [k, v] of Object.entries(x)) {
      const p = path ? `${path}.${k}` : k;
      if (k === "hemmeligheter") {
        f.push({ check: "config", file, message: `${p}: ${NOKLER}` });
        continue;
      }
      if (SECRET_KEY.test(k) && v != null && typeof v !== "object" && !/Dir$|File$/i.test(k)) f.push({ check: "config", file, message: `${p} står med verdi. Config-fila har ingen hemmeligheter` });
      walk(v, p);
    }
  };
  walk(data, "");
  return { data, envs, findings: f };
}

// Filer med hemmeligheter (.env, .keys/) blant filene git følger. Ingen skript lager dem, men en person kan; i CI er
// det det som er committet, og lokalt er en slik fil ikke et funn før den legges til.
export function checkCommitted(root) {
  let files = [];
  try {
    files = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean);
  } catch {
    return [];
  }
  return files
    .filter((p) => /(^|\/)(\.env(\.[^/]*)?|\.keys\/.*)$/.test(p) && !p.endsWith(".example"))
    .map((p) => ({ check: "hemmeligheter", file: p, message: "Hemmeligheter er committet. Fjern fila fra git, og bytt verdiene i hvelvet: de er ikke hemmelige lenger" }));
}

// Godkjenneren står i eierlinjene; en kommentar som forklarer @ENDRE-MEG, teller ikke.
export function checkCodeowners(root) {
  const co = join(root, ".github/CODEOWNERS");
  const owners = existsSync(co) ? readFileSync(co, "utf8").split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")) : [];
  if (owners.length && !owners.some((l) => /@ENDRE-MEG/.test(l))) return [];
  return [{ check: "godkjenner", level: "warn", file: ".github/CODEOWNERS", message: "Godkjenneren er ikke satt. Uten den kan hvem som helst med skrivetilgang godkjenne en endring" }];
}

// En nøkkel som ser ut som en hemmelighet, står aldri med verdi.
export function secretValues(data, path = "") {
  const out = [];
  if (isMap(data) || Array.isArray(data)) {
    for (const [k, v] of Object.entries(data)) {
      const p = path ? `${path}.${k}` : k;
      if (SECRET_KEY.test(k) && v != null && typeof v !== "object") out.push(p);
      else out.push(...secretValues(v, p));
    }
  }
  return out;
}
const noSecrets = (data, check, file, f) => {
  for (const p of secretValues(data)) f.push({ check, file, message: `${p} står med verdi. En hemmelighet står aldri i repoet; den ligger i hvelvet` });
};

export function solutionStatus(root, navn) {
  try {
    const y = readYaml(root, `losninger/${navn}/losning.yaml`, "losning", []);
    return isMap(y) ? y.status : undefined;
  } catch {
    return undefined;
  }
}

export function checkLosninger(root) {
  const f = [];
  const systems = new Set(dirs(root, "integrasjoner"));
  for (const s of dirs(root, "losninger")) {
    const file = `losninger/${s}/losning.yaml`;
    if (!existsSync(join(root, file))) {
      f.push({ check: "losning", file: `losninger/${s}`, message: "losning.yaml mangler: formålet, eieren, statusen, integrasjonene og hva den bygger på" });
      continue;
    }
    const y = readYaml(root, file, "losning", f);
    if (y === undefined) continue;
    if (!isMap(y)) {
      f.push({ check: "losning", file, message: "Fila er tom eller ikke et kart" });
      continue;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) f.push({ check: "losning", file: `losninger/${s}`, message: "Navnet på løsningen har små bokstaver, tall og bindestrek" });
    for (const k of ["formal", "eier"]) if (!text(y[k])) f.push({ check: "losning", file, message: `${k} mangler` });
    if (!STATUS_LOSNING.includes(y.status)) f.push({ check: "losning", file, message: `status må være ${STATUS_LOSNING.join(", ")}` });
    if (!Array.isArray(y.integrasjoner)) f.push({ check: "losning", file, message: "integrasjoner må være en liste (tom når løsningen ikke bruker noen)" });
    else for (const i of y.integrasjoner) if (!systems.has(String(i))) f.push({ check: "losning", level: "warn", file, message: `Integrasjonen ${i} står ikke i integrasjoner/` });
    // Hva løsningen bygger på, avgjøres i designet, så det kreves først når løsningen er ute av utkast. En løsning som
    // bygger på en standard, er en full kopi: Neo krever hele fila.
    const b = y["bygger-pa"];
    const valid = b === "egen" || (isMap(b) && text(b.standard) && text(String(b.versjon ?? "")));
    if (!valid && !(y.status === "utkast" && b == null)) f.push({ check: "losning", file, message: `bygger-pa må være «egen», eller { standard: <navn>, versjon: <versjon> }${y.status === "utkast" ? "" : ", når løsningen er ute av utkast"}` });
  }
  return f;
}

// Oppgavene hos kunden, fra integrasjoner/<system>/hos-kunden.md.
export function tasks(root) {
  const out = [];
  for (const system of dirs(root, "integrasjoner")) {
    const file = `integrasjoner/${system}/hos-kunden.md`;
    if (!existsSync(join(root, file))) continue;
    for (const it of items(readFileSync(join(root, file), "utf8"))) out.push({ ...it, system, file, ref: `${system}/${it.id}`, etter: list(it.fields.etter).map(String).map((e) => (e.includes("/") ? e : `${system}/${e}`)) });
  }
  return out;
}

export function checkIntegrasjoner(root) {
  const f = [];
  for (const system of dirs(root, "integrasjoner")) {
    for (const rel of yamlFiles(root, `integrasjoner/${system}`).filter((x) => x !== `integrasjoner/${system}/hemmeligheter.yaml`)) {
      const y = readYaml(root, rel, "integrasjon", f);
      if (y !== undefined) noSecrets(y, "integrasjon", rel, f);
    }
  }
  const all = tasks(root);
  const refs = new Set();
  for (const t of all) {
    const at = { check: "integrasjon", file: t.file, line: t.line };
    if (t.error) {
      f.push({ ...at, message: `${t.id}: yaml-blokken kan ikke leses (${t.error})` });
      continue;
    }
    if (refs.has(t.ref)) f.push({ ...at, message: `Id-en ${t.id} er brukt før i ${t.file}` });
    refs.add(t.ref);
    if (!STATUS_OPPGAVE.includes(t.fields.status)) f.push({ ...at, message: `${t.id}: status må være ${STATUS_OPPGAVE.join(", ")}` });
    if (!text(t.fields.hvem)) f.push({ ...at, message: `${t.id}: hvem mangler (rollen hos kunden som gjør det)` });
  }
  for (const t of all) for (const e of t.etter) if (!refs.has(e)) f.push({ check: "integrasjon", file: t.file, line: t.line, message: `${t.id}: venter på ${e}, som ikke finnes` });
  return f;
}

export const personas = (root) => yamlFiles(root, PERSONAER).map((rel) => ({ rel, id: rel.split("/").pop().replace(/\.ya?ml$/, "") }));

export function checkPersonaer(root) {
  const f = [];
  for (const { rel } of personas(root)) {
    const y = readYaml(root, rel, "persona", f);
    if (y === undefined) continue;
    if (!isMap(y)) {
      f.push({ check: "persona", file: rel, message: "Fila er tom eller ikke et kart" });
      continue;
    }
    for (const k of ["navn", "rolle"]) if (!text(y[k])) f.push({ check: "persona", file: rel, message: `${k} mangler` });
    if (y.hemmeligheter != null) f.push({ check: "persona", file: rel, message: "hemmeligheter står ikke i en persona: personen logger inn selv, og passordet ligger der testidentiteten forvaltes" });
    else noSecrets(y, "persona", rel, f);
  }
  return f;
}

// Testcasene i hver løsning (test/testcaser/), og testene i test/ som går gjennom flere løsninger.
export function checkTester(root, kravIder) {
  const f = [];
  const known = new Set(personas(root).map((p) => p.id));
  const sols = new Set(dirs(root, "losninger"));
  const files = [...dirs(root, "losninger").flatMap((s) => yamlFiles(root, `losninger/${s}/test/testcaser`)), ...yamlFiles(root, "test").filter((x) => !x.startsWith(`${PERSONAER}/`))];
  for (const rel of files) {
    const y = readYaml(root, rel, "test", f);
    if (y === undefined) continue;
    if (!isMap(y)) {
      f.push({ check: "test", file: rel, message: "Fila er tom eller ikke et kart" });
      continue;
    }
    if (!text(y.beskrivelse)) f.push({ check: "test", file: rel, message: "beskrivelse mangler" });
    if (!isMap(y.forventet)) f.push({ check: "test", file: rel, message: "forventet mangler: det oppsettet skal gjøre med saken" });
    else {
      const ids = list(y.forventet.krav).map(String);
      if (!ids.length) f.push({ check: "test", file: rel, message: "forventet.krav mangler: kravene testcasen prøver" });
      for (const id of ids) if (!kravIder.has(id)) f.push({ check: "test", file: rel, message: `Kravet ${id} finnes ikke i noen krav/` });
    }
    for (const p of list(y.persona).map(String)) if (!known.has(p)) f.push({ check: "test", level: "warn", file: rel, message: `Personaen ${p} finnes ikke (${PERSONAER}/${p}.yaml)` });
    if (rel.startsWith("test/")) {
      const ls = list(y.losninger).map(String);
      if (ls.length < 2) f.push({ check: "test", file: rel, message: "En test i test/ går gjennom flere løsninger: losninger må ha minst to" });
      for (const l of ls) if (!sols.has(l)) f.push({ check: "test", file: rel, message: `Løsningen ${l} finnes ikke i losninger/` });
    }
    noSecrets(y, "test", rel, f);
  }
  return f;
}

// Testplanen i en løsning, i en minste form: punktene, hvert med kravene det prøver (en overskrift med en yaml-blokk med
// `krav`). Når testplanen finnes, har hvert krav i løsningen minst ett punkt, og hvert krav et punkt viser til, finnes.
export function checkTestplan(root, kravIder) {
  const f = [];
  for (const s of dirs(root, "losninger")) {
    const file = `losninger/${s}/test/testplan.md`;
    if (!existsSync(join(root, file))) continue;
    const covered = new Set();
    for (const p of points(readFileSync(join(root, file), "utf8"))) {
      if (p.error) f.push({ check: "test", file, line: p.line, message: `${p.id}: yaml-blokken kan ikke leses (${p.error})` });
      else if (!p.krav.length) f.push({ check: "test", file, line: p.line, message: `${p.id}: krav er tomt: kravene punktet prøver` });
      for (const k of p.krav) {
        covered.add(k);
        if (!kravIder.has(k)) f.push({ check: "test", file, line: p.line, message: `${p.id}: kravet ${k} finnes ikke i noen krav/` });
      }
    }
    const own = mdFiles(root, `losninger/${s}/krav`).flatMap((k) => items(readFileSync(join(root, k), "utf8")).map((r) => r.id));
    for (const id of own) if (!covered.has(id)) f.push({ check: "test", file, message: `Kravet ${id} har ikke et punkt i testplanen. Hvert krav har minst ett punkt: en overskrift med krav: [${id}] i yaml-blokken under` });
  }
  return f;
}
