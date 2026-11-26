// Strukturen i repoet for typen i repo.yaml, og formen på filene repoet eier: repo.yaml, config-fila, losning.yaml,
// hemmelighetene og oppgavene til hver integrasjon, personaene og testcasene. Det som ikke har en form, finnes ikke:
// en mappe eller fil som ikke står her, er rød, med det den er blitt til.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { dirs, entries, isMap, items, list, places, readYaml, text, yamlFiles } from "./les.mjs";

export const CHECKS = [
  { name: "repo", about: "repo.yaml har typen, eieren og forvalteren, og repoet har mappene typen sier, og ingen andre" },
  { name: "config", about: ".claude/neo.config.json har adressen, org-en og MCP-serveren i Neo, og ingen hemmelighet eller referanse" },
  { name: "godkjenner", about: ".github/CODEOWNERS nevner en ekte godkjenner" },
  { name: "losning", about: "Hver løsning har losning.yaml med formål, eier, status og integrasjonene, og hva den bygger på når den er ute av utkast" },
  { name: "integrasjon", about: "Hemmelighetene er referanser til hvelvet, og oppgavene hos kunden har status, hvem og det de venter på" },
  { name: "persona", about: "Hver persona har navn og rolle, og hemmelighetene er referanser til hvelvet" },
  { name: "test", about: "Hver testcase har en beskrivelse og kravene den prøver, og kravene finnes" },
];

export const TYPER = ["kunde", "standard"];
export const STATUS_LOSNING = ["utkast", "i-test", "i-bruk", "avviklet"];
export const STATUS_OPPGAVE = ["ikke-startet", "i-gang", "ferdig"];
export const PERSONAER = "test/personaer";

// En nøkkel med et navn som dette er en hemmelighet. Den står aldri med verdi i en fil.
export const SECRET_KEY = /(passord|password|secret|hemmelig|token|apikey|api_key|privatekey|private_key|nokkel|nøkkel|^key$|keypem)/i;

// En referanse til hvelvet: { kilde: azure-keyvault:<hvelv>/<navn> }, og fil: true for en nøkkelfil. Skriptene henter
// verdien ved hvert kall med personens egen innlogging, så referansen har ikke noe navn på en variabel.
export const KILDE = /^azure-keyvault:[A-Za-z0-9-]+\/[A-Za-z0-9-]+$/;
export const REF = "{ kilde: azure-keyvault:<hvelv>/<navn> } (og fil: true for en nøkkelfil)";
export const isRef = (v) => isMap(v) && KILDE.test(String(v.kilde ?? "")) && (v.fil === undefined || typeof v.fil === "boolean") && Object.keys(v).every((k) => ["kilde", "fil"].includes(k));
const whyNotRef = (v) => (isMap(v) && "$env" in v ? "referansen har ikke $env lenger: skriptene henter verdien fra hvelvet ved hvert kall. Ta bort $env" : `må være ${REF}, uten verdien`);

// Det som er blitt til noe annet. Står det igjen, sier sjekken hva det er blitt.
const GAMMELT = {
  "profil.yaml": "profil.yaml har ingen form i Neo ennå. Ta den bort",
  virksomheten: "Det som gjelder hele kunden, står i felles/kilder/ og felles/forstaelse/",
  organisasjon: "Det som er felles, står i felles/ (felles/design/, felles/oppsett/)",
};
const NUMMERERT = { "1-kilder": "kilder", "2-forstaelse": "forstaelse", "3-krav": "krav", "4-design": "design", "5-oppsett": "oppsett", "6-test": "test" };
const LEDD = ["kilder", "forstaelse", "krav", "design", "oppsett"];

// repo.yaml: typen, eieren og forvalteren. Godkjenneren står bare i .github/CODEOWNERS, som er det GitHub håndhever.
export function readRepo(root) {
  const file = "repo.yaml";
  const f = [];
  if (!existsSync(join(root, file))) return { type: undefined, findings: [{ check: "repo", file, message: "Mangler. repo.yaml sier hva repoet er (kunde eller standard), og hvem som eier og forvalter det" }] };
  const y = readYaml(root, file, "repo", f);
  if (y === undefined) return { type: undefined, findings: f };
  if (!isMap(y)) return { type: undefined, findings: [{ check: "repo", file, message: "repo.yaml er tom eller ikke et kart" }] };
  if (!TYPER.includes(y.type)) f.push({ check: "repo", file, message: `type må være ${TYPER.join(" eller ")}` });
  for (const k of ["eier", "forvalter"]) {
    if (!isMap(y[k])) f.push({ check: "repo", file, message: `${k} mangler (navn${k === "forvalter" ? " og github" : ""})` });
    else if (!text(y[k].navn)) f.push({ check: "repo", level: "warn", file, message: `${k}.navn er ikke fylt ut` });
  }
  if ("godkjenner" in y) f.push({ check: "repo", file, message: "godkjenner står bare i .github/CODEOWNERS, som er det GitHub håndhever. Ta den bort her" });
  return { type: TYPER.includes(y.type) ? y.type : undefined, findings: f };
}

// Mappene typen sier, og ingen andre.
export function checkLayout(root, type) {
  const f = [];
  const red = (file, message) => f.push({ check: "repo", file, message });
  for (const [p, why] of Object.entries(GAMMELT)) if (existsSync(join(root, p))) red(p, why);
  if (existsSync(join(root, "integrasjoner/README.md"))) red("integrasjoner/README.md", "Lista over det kunden må gjøre, lages av sjekken (sjekk.mjs hos-kunden) og committes ikke. Ta den bort");
  const kunde = type !== "standard";
  for (const p of places(root)) {
    const allowed = new Set(["README.md", ...(p.felles ? [] : ["losning.yaml", "test"]), ...LEDD.filter((l) => !p.felles || kunde || !["kilder", "forstaelse"].includes(l))]);
    for (const n of entries(root, p.dir)) {
      if (allowed.has(n) || n.startsWith(".")) continue;
      const rel = `${p.dir}/${n}`;
      if (NUMMERERT[n]) red(rel, `Mappene har navn, ikke tall: ${n} heter ${NUMMERERT[n]}`);
      else if (n === "spor.yaml") red(rel, "Hva hvert krav ble, står i kravet selv (blir). Det finnes ingen sporingsfil");
      else if (p.felles && ["kilder", "forstaelse"].includes(n)) red(rel, "Et repo for standardløsninger har ingen kunde å forstå, så felles/ har ikke kilder eller forstaelse");
      else red(rel, `${p.felles ? "felles/" : "En løsning"} har ${[...allowed].sort().join(", ")}. Det som ikke har en form, finnes ikke`);
    }
    if (existsSync(join(root, p.dir, "oppsett", "spor.yaml"))) red(`${p.dir}/oppsett/spor.yaml`, "Hva hvert krav ble, står i kravet selv (blir). Det finnes ingen sporingsfil");
  }
  for (const s of dirs(root, "integrasjoner")) {
    for (const n of entries(root, `integrasjoner/${s}`)) {
      const rel = `integrasjoner/${s}/${n}`;
      if (["hos-kunden.md", "hemmeligheter.yaml", "README.md"].includes(n) || n.startsWith(".")) continue;
      if (n === "neo.yaml" || n === "miljoer") red(rel, `${n} har ingen form i Neo ennå. Ta den bort`);
      else if (!dirs(root, `integrasjoner/${s}`).includes(n)) red(rel, "En integrasjon har hos-kunden.md, hemmeligheter.yaml, og artefaktene systemet trenger i en egen mappe");
    }
  }
  return f;
}

// Config-fila pluginene leser: adressen, org-en og MCP-serveren i Neo. Ett miljø. Aldri en hemmelighet, og ingen
// referanser: de står i integrasjoner/<system>/hemmeligheter.yaml.
export function readConfig(root) {
  const file = ".claude/neo.config.json";
  if (!existsSync(join(root, file))) return { findings: [{ check: "config", file, message: "Mangler. Pluginene leser den; /solution:set-up-repo lager den" }] };
  let data;
  try {
    data = JSON.parse(readFileSync(join(root, file), "utf8"));
  } catch (e) {
    return { findings: [{ check: "config", file, message: `Ikke gyldig JSON: ${e.message}` }] };
  }
  const f = [];
  if (data.version !== 2) f.push({ check: "config", file, message: `version må være 2${data.version === 1 ? ": versjon 1 hadde miljøer per nøkkel (byEnv). Nå er det ett miljø: neo.url, neo.org og neo.mcpServer" : ""}` });
  const neo = data.neo ?? {};
  if (neo.byEnv || neo.environments || neo.defaultEnv) f.push({ check: "config", file, message: "neo har ett miljø: url, org og mcpServer rett under neo, uten environments, defaultEnv eller byEnv" });
  if (!/^https:\/\/\S+$/.test(String(neo.url ?? ""))) f.push({ check: "config", file, message: "neo.url mangler: adressen til Neo (https://…). Skjemaet for konfigfilene hentes derfra" });
  if (!text(neo.mcpServer)) f.push({ check: "config", file, message: "neo.mcpServer mangler: navnet på MCP-serveren i .mcp.json" });
  if (!text(neo.org)) f.push({ check: "config", level: "warn", file, message: "neo.org er ikke fylt ut: org-en i Neo med sandkassen konfigen skrives til" });
  const walk = (x, path) => {
    if (!x || typeof x !== "object") return;
    if (!Array.isArray(x) && ("$env" in x || "kilde" in x)) {
      f.push({ check: "config", file, message: `${path} er en referanse til en hemmelighet. Referansene står i integrasjoner/<system>/hemmeligheter.yaml, ikke her` });
      return;
    }
    for (const [k, v] of Object.entries(x)) {
      const p = path ? `${path}.${k}` : k;
      if (SECRET_KEY.test(k) && v != null && typeof v !== "object") f.push({ check: "config", file, message: `${p} står med verdi. Config-fila har ingen hemmeligheter` });
      walk(v, p);
    }
  };
  walk(data, "");
  return { data, url: /^https:\/\//.test(String(neo.url ?? "")) ? String(neo.url).replace(/\/+$/, "") : undefined, findings: f };
}

export function checkCodeowners(root) {
  const co = join(root, ".github/CODEOWNERS");
  if (existsSync(co) && !/@ENDRE-MEG/.test(readFileSync(co, "utf8"))) return [];
  return [{ check: "godkjenner", level: "warn", file: ".github/CODEOWNERS", message: "Godkjenneren er ikke satt. Uten den kan hvem som helst med skrivetilgang godkjenne en endring" }];
}

// En nøkkel som ser ut som en hemmelighet, står aldri med verdi.
export function secretValues(data, path = "") {
  const out = [];
  if (isRef(data)) return out;
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
  for (const p of secretValues(data)) f.push({ check, file, message: `${p} står med verdi. En hemmelighet står som ${REF}, og verdien ligger i hvelvet` });
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
    const sec = `integrasjoner/${system}/hemmeligheter.yaml`;
    if (existsSync(join(root, sec))) {
      const y = readYaml(root, sec, "integrasjon", f);
      if (y != null) {
        if (!isMap(y)) f.push({ check: "integrasjon", file: sec, message: "Fila er et kart fra navnet på hemmeligheten til referansen" });
        else for (const [k, v] of Object.entries(y)) if (!isRef(v)) f.push({ check: "integrasjon", file: sec, message: `${k} ${whyNotRef(v)}` });
      }
    }
    for (const rel of yamlFiles(root, `integrasjoner/${system}`).filter((x) => x !== sec)) {
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
    if (y.hemmeligheter != null) {
      if (!isMap(y.hemmeligheter)) f.push({ check: "persona", file: rel, message: "hemmeligheter er et kart fra navnet til referansen" });
      else for (const [k, v] of Object.entries(y.hemmeligheter)) if (!isRef(v)) f.push({ check: "persona", file: rel, message: `hemmeligheter.${k} ${whyNotRef(v)}` });
    }
    noSecrets(y, "persona", rel, f);
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
