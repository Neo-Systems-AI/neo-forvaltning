// Kildene og forståelsen, i felles/ og i hver løsning: hver lagret fil står i registeret, en lagret kilde er ikke
// endret eller slettet på endringen (git <base>, ikke hele historikken), og hver påstand i forståelsen viser til en
// kilde i registeret på samme sted. En kilde kan trekkes tilbake med grunnen i registeret; da kan fila tas bort, og
// ingen påstand kan bygge på den. Om en påstand stemmer med kilden, avgjør ingen sjekk: det gjør kontrollen mot kildene.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { citations, claims, filesIn, mdFiles } from "./les.mjs";

export const CHECKS = [
  { name: "kilder", about: "En lagret kilde er ikke endret eller slettet på endringen (bare trukket tilbake med grunnen), og hver fil står i registeret" },
  { name: "forstaelse", about: "Hver påstand i forståelsen viser til en kilde i registeret som ikke er trukket tilbake" },
];

// Spørsmålene til kunden står under denne overskriften, og er ikke påstander.
const QUESTIONS = /^det kildene ikke svarer på/i;

// Registeret: én rad per kilde i kilder.md, med id-en først (K1 for et dokument, E1 for en e-post, en samtale eller et
// møte). «Trukket tilbake: <grunnen>» i raden trekker kilden tilbake.
export function registry(root, dir) {
  const file = join(root, dir, "kilder", "kilder.md");
  const ids = new Map();
  if (!existsSync(file)) return ids;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      const m = /^\|\s*([EK]\d+)\s*\|/.exec(line);
      if (!m) return;
      const t = /trukket tilbake\s*:?\s*([^|]*)/i.exec(line);
      ids.set(m[1], { line: i + 1, row: line, trukket: !!t, grunn: t?.[1].trim() ?? "" });
    });
  return ids;
}

// Filene som er endret eller slettet siden basen, i arbeidstreet, under kilder/filer/ på hvert sted.
export function changed(root, base, dirsWithSources) {
  const git = (...args) => execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  try {
    git("rev-parse", "--verify", "--quiet", `${base}^{commit}`);
  } catch {
    return { error: `Fant ikke basen «${base}» i git, så det er ikke sjekket at kildene er uendret. Si basen med --base <ref> (i en PR: origin/<grenen den skal inn i>; før første commit: HEAD)` };
  }
  const out = git("diff", "--name-status", "--no-renames", base, "--", ...dirsWithSources.map((d) => `${d}/kilder/filer`));
  return { list: out.split("\n").filter((l) => /^[MD]\t/.test(l)).map((l) => ({ status: l[0], file: l.slice(2) })) };
}

export function checkKilder(root, places, { base }) {
  const f = [];
  const regs = new Map(places.map((p) => [p.dir, registry(root, p.dir)]));

  // 1. Det som er endret eller slettet på endringen.
  const ch = changed(root, base, places.map((p) => p.dir));
  if (ch.error) f.push({ check: "kilder", file: ".", message: ch.error });
  for (const c of ch.list ?? []) {
    if (c.status === "M") {
      f.push({ check: "kilder", file: c.file, message: "En lagret kilde er endret. En kilde endres aldri: en ny versjon får en ny id og en ny fil. Sett fila tilbake (git checkout), og lagre den nye versjonen som en ny kilde" });
      continue;
    }
    const place = places.find((p) => c.file.startsWith(`${p.dir}/kilder/`));
    const name = c.file.slice(`${place.dir}/kilder/`.length);
    const row = [...regs.get(place.dir).values()].find((r) => r.row.includes(name));
    if (!row?.trukket) f.push({ check: "kilder", file: c.file, message: `En lagret kilde er slettet. En kilde slettes ikke; den trekkes tilbake med «Trukket tilbake: <grunnen>» i raden i ${place.dir}/kilder/kilder.md. Sett fila tilbake (git checkout), eller trekk kilden tilbake der med grunnen` });
  }

  for (const p of places) {
    const ids = regs.get(p.dir);
    const regFile = `${p.dir}/kilder/kilder.md`;
    for (const [id, r] of ids) if (r.trukket && !r.grunn) f.push({ check: "kilder", file: regFile, line: r.line, message: `${id} er trukket tilbake uten grunn. Skriv grunnen etter «Trukket tilbake:»` });

    // 2. Hver lagret fil står i registeret.
    const register = existsSync(join(root, regFile)) ? readFileSync(join(root, regFile), "utf8") : "";
    for (const file of filesIn(root, `${p.dir}/kilder/filer`).filter((x) => !x.endsWith(".gitkeep"))) {
      const name = file.slice(`${p.dir}/kilder/`.length);
      if (!register.includes(`(${name})`) && !register.includes(`\`${name}\``)) f.push({ check: "kilder", file, message: `Fila står ikke i registeret (${regFile}). En lagret kilde har en id og opphav. Legg den inn i registeret med id, lenke og datoene` });
    }

    // 3. Forståelsen: hvert punkt viser til en kilde i registeret på samme sted, som ikke er trukket tilbake.
    for (const rel of mdFiles(root, `${p.dir}/forstaelse`)) {
      for (const c of claims(readFileSync(join(root, rel), "utf8"))) {
        if (QUESTIONS.test(c.section)) continue;
        const cited = citations(c.text);
        // En henvisning til en annen dimensjon («står i `03-forlop.md`») er ikke en påstand, og trenger ingen kilde.
        if (!cited.length && /`[\w-]+\.md`/.test(c.text)) continue;
        if (!cited.length) f.push({ check: "forstaelse", file: rel, line: c.line, message: `Påstanden viser ikke til en kilde: «${c.text.split("\n")[0].slice(2, 80)}». Vis til kilden ([K1]), eller flytt den til «Det kildene ikke svarer på»` });
        for (const id of cited) {
          if (!ids.has(id)) f.push({ check: "forstaelse", file: rel, line: c.line, message: `${id} står ikke i registeret (${regFile}). Rett id-en, eller legg kilden inn i registeret` });
          else if (ids.get(id).trukket) f.push({ check: "forstaelse", file: rel, line: c.line, message: `${id} er trukket tilbake (${ids.get(id).grunn || "uten grunn"}). Skriv påstanden fra en annen kilde, eller ta den bort` });
        }
      }
    }
  }
  return f;
}
