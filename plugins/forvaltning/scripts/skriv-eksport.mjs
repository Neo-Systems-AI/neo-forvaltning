// Legger svaret fra `GET /api/config/export` ut som filer (`konfig.mjs export`), slik Neo skrev dem. Skriptet endrer
// ikke innholdet: formen, nøklene og pekerne er Neo sine (konfig som fil, `neo-config/v1`). Det skriver hver fil på
// stien Neo ga, fjerner filene Neo ikke lenger har, og skriver `ikke-med.md` med det Neo sier ikke er med i filene
// ennå, med grunnen.
//
// Svarer Neo `ok: false`, skrives ingenting: problemene skrives ut, og de rettes i Neo.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";

export const IKKE_MED = "ikke-med.md";

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
export function write(svar, outDir) {
  if (!svar || typeof svar !== "object") throw new Error("Svaret er ikke et objekt fra export.");
  if (svar.ok === false) {
    const lines = [
      ...(svar.problems ?? []).map((p) => `- ${p.kind} «${p.name}»: ${p.problems.join("; ")}`),
      ...(svar.layoutProblems ?? []).map((p) => `- ${p}`),
    ];
    throw new Error(`Neo kan ikke skrive oppsettet som filer. Rett dette i Neo og ta snapshot på nytt:\n${lines.join("\n")}`);
  }
  if (svar.ok !== true || !Array.isArray(svar.files)) throw new Error("Svaret er ikke et svar fra export.");
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
