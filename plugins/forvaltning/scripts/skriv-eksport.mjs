#!/usr/bin/env node
// Legger svaret fra `export_config` ut som filer, slik Neo skrev dem. Skriptet endrer ikke innholdet: formen, nøklene
// og pekerne er Neo sine (konfig som fil, `neo-config/v1`). Det skriver hver fil på stien Neo ga, fjerner filene Neo
// ikke lenger har, og skriver `ikke-med.md` med det Neo sier ikke er med i filene ennå, med grunnen.
//
//   node skriv-eksport.mjs <svar.json> <ut-mappe>
//
// Svaret er JSON-en fra verktøyet, eller MCP-innpakningen rundt den ({ content: [{ type: "text", text }] }).
// Svarer Neo `ok: false`, skrives ingenting: problemene skrives ut, og de rettes i Neo.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";

export const IKKE_MED = "ikke-med.md";

// Svaret fra verktøyet, med eller uten MCP-innpakningen.
export function unwrap(value) {
  if (value && Array.isArray(value.content)) {
    const text = value.content.find((c) => c?.type === "text")?.text;
    if (typeof text !== "string") throw new Error("MCP-svaret har ingen tekst.");
    return JSON.parse(text);
  }
  return value;
}

// En sti fra Neo skal være relativ, ligge under ut-mappa og være en .yaml-fil. Alt annet er en feil, ikke noe som
// rettes stille.
export function checkPath(path) {
  if (typeof path !== "string" || !path.endsWith(".yaml")) return `«${path}» er ikke en .yaml-fil`;
  const n = normalize(path);
  if (n.startsWith("/") || n.startsWith("..") || n.split(sep).includes("..") || n !== path) return `«${path}» er ikke en relativ sti under mappa`;
  return null;
}

const yamlFiles = (dir) => {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "raw") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...yamlFiles(p));
    else if (name.endsWith(".yaml")) out.push(p);
  }
  return out;
};

export function ikkeMed(notExported) {
  if (notExported.length === 0) return "# Ikke med i filene\n\nAlt i organisasjonen er med.\n";
  const rows = [...notExported]
    .sort((a, b) => a.rootType.localeCompare(b.rootType) || a.name.localeCompare(b.name, "nb"))
    .map((n) => `| ${n.rootType} | ${n.name} | ${n.reason} |`);
  return [
    "# Ikke med i filene",
    "",
    "Dette finnes i organisasjonen, men Neo skriver det ikke som fil ennå. Det styres i Neo, ikke fra repoet.",
    "",
    "| Type | Navn | Hvorfor |",
    "|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

// Skriver eksporten til `outDir`. Returnerer hva som ble gjort, eller kaster med problemene.
export function write(answer, outDir) {
  const svar = unwrap(answer);
  if (!svar || typeof svar !== "object") throw new Error("Svaret er ikke et objekt fra export_config.");
  if (svar.ok === false) {
    const lines = [
      ...(svar.problems ?? []).map((p) => `- ${p.kind} «${p.name}»: ${p.problems.join("; ")}`),
      ...(svar.layoutProblems ?? []).map((p) => `- ${p}`),
    ];
    throw new Error(`Neo kan ikke skrive oppsettet som filer. Rett dette i Neo og ta snapshot på nytt:\n${lines.join("\n")}`);
  }
  if (svar.ok !== true || !Array.isArray(svar.files)) throw new Error("Svaret er ikke et svar fra export_config.");
  const bad = svar.files.map((f) => checkPath(f.path)).filter(Boolean);
  if (bad.length) throw new Error(`Svaret har stier som ikke kan skrives:\n${bad.map((b) => `- ${b}`).join("\n")}`);

  const result = { nye: [], endret: [], uendret: [], fjernet: [] };
  const wanted = new Set();
  for (const { path, text } of svar.files) {
    const dest = join(outDir, path);
    wanted.add(dest);
    const before = existsSync(dest) ? readFileSync(dest, "utf8") : null;
    if (before === text) {
      result.uendret.push(path);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, text);
    (before === null ? result.nye : result.endret).push(path);
  }
  for (const file of yamlFiles(outDir)) {
    if (wanted.has(file)) continue;
    rmSync(file);
    result.fjernet.push(relative(outDir, file));
  }
  writeFileSync(join(outDir, IKKE_MED), ikkeMed(svar.notExported ?? []));
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [input, outDir] = process.argv.slice(2);
  if (!input || !outDir) {
    console.error("Bruk: node skriv-eksport.mjs <svar.json> <ut-mappe>");
    process.exit(2);
  }
  try {
    const r = write(JSON.parse(readFileSync(input, "utf8")), outDir);
    console.log(`nye ${r.nye.length}, endret ${r.endret.length}, uendret ${r.uendret.length}, fjernet ${r.fjernet.length}`);
    for (const [what, list] of [["ny", r.nye], ["endret", r.endret], ["fjernet", r.fjernet]]) for (const p of list) console.log(`  ${what}: ${p}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
