// Det sjekkene deler: filene i en mappe, YAML-filer, items i markdown («## <id> <tittel>» med en yaml-blokk under),
// påstandene i forståelsen og kildene de viser til, og stedene i repoet (felles/ og hver løsning).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseYaml } from "./yaml.mjs";

export const posix = (p) => p.split(sep).join("/");
export const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .sort()
        .flatMap((n) => {
          const p = join(dir, n);
          return statSync(p).isDirectory() ? walk(p) : [p];
        })
    : [];
export const dirs = (root, dir) => (existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter((n) => statSync(join(root, dir, n)).isDirectory()).sort() : []);
export const entries = (root, dir) => (existsSync(join(root, dir)) ? readdirSync(join(root, dir)).sort() : []);
export const filesIn = (root, dir) => walk(join(root, dir)).map((f) => posix(relative(root, f)));
export const mdFiles = (root, dir) => filesIn(root, dir).filter((f) => f.endsWith(".md") && !/(^|\/)README\.md$/.test(f));
export const yamlFiles = (root, dir) => filesIn(root, dir).filter((f) => /\.ya?ml$/.test(f));
export const text = (v) => typeof v === "string" && v.trim() !== "";
export const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
export const isMap = (v) => !!v && typeof v === "object" && !Array.isArray(v);

// En YAML-fil. En fil som ikke kan leses, er et rødt funn i sjekken som eier fila, aldri «ikke vurdert».
export function readYaml(root, rel, check, f) {
  try {
    return parseYaml(readFileSync(join(root, rel), "utf8"));
  } catch (e) {
    f.push({ check, file: rel, message: `Kan ikke leses som YAML (${e.message}). Rett YAML-en der feilen sier` });
    return undefined;
  }
}

// Stedene med de samme leddene (kilder, forstaelse, krav, design): felles/ og hver løsning, likt i et kunderepo og i
// et repo for standardløsninger. Konfigen står ikke på et sted, men i oppsett/ i roten, slik Neo eksporterer den.
export function places(root) {
  return [{ dir: "felles", navn: "felles", felles: true }, ...dirs(root, "losninger").map((l) => ({ dir: `losninger/${l}`, navn: l }))];
}

// Items i en markdown-fil: «## <id> <tittel>» med en yaml-blokk rett under. Kravene, avvikene i designet og oppgavene
// hos kunden har denne formen. En blokk leseren ikke forstår, gir `error` i stedet for feltene.
export function items(md) {
  const out = [];
  const re = /^## (\S+)([^\n]*)\n+```yaml\n([\s\S]*?)\n```/gm;
  let m;
  while ((m = re.exec(md))) {
    const line = md.slice(0, m.index).split("\n").length;
    let fields = {};
    let error;
    try {
      fields = parseYaml(m[3]) ?? {};
      if (!isMap(fields)) throw new Error("blokken er ikke et kart");
    } catch (e) {
      error = e.message;
      fields = {};
    }
    out.push({ id: m[1], title: m[2].trim(), line, fields, error });
  }
  return out;
}

// Overskriftene på nivå 2 utenfor kodeblokker, med linja. Et krav er et item; en overskrift uten yaml-blokken rett
// under er et krav sjekken ellers ikke ville sett.
export function headings(md) {
  const out = [];
  let fence = false;
  md.split("\n").forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    else if (!fence && /^## \S/.test(line)) out.push({ line: i + 1, text: line.slice(3).trim() });
  });
  return out;
}

// Punktene i en testplan: en overskrift (## til ####) med en yaml-blokk rett under som har `krav`.
export function points(md) {
  const out = [];
  const re = /^#{2,4} (\S+)([^\n]*)\n+```yaml\n([\s\S]*?)\n```/gm;
  let m;
  while ((m = re.exec(md))) {
    const line = md.slice(0, m.index).split("\n").length;
    let fields;
    try {
      fields = parseYaml(m[3]);
    } catch (e) {
      out.push({ id: m[1], line, error: e.message, krav: [] });
      continue;
    }
    if (!isMap(fields) || !("krav" in fields)) continue;
    out.push({ id: m[1], line, krav: list(fields.krav).map(String) });
  }
  return out;
}

// Id-ene en tekst viser til i hakeparentes: [K1], [K14 § 7], [E1, K3], [K7–K9] (et intervall gir hvert tall i det).
export function citations(t) {
  const out = [];
  for (const [, inner] of t.matchAll(/\[([^\]]*\b[EK]\d+\b[^\]]*)\](?!\()/g)) {
    for (const m of inner.matchAll(/\b([EK])(\d+)(?:\s*[–-]\s*\1?(\d+))?/g)) {
      const [from, to] = [Number(m[2]), m[3] ? Number(m[3]) : Number(m[2])];
      for (let n = from; n <= to && n - from < 100; n++) out.push(`${m[1]}${n}`);
    }
  }
  return out;
}

// De øverste punktene i en markdown-fil, hvert med underpunktene og linjene som hører til, og overskriften det står
// under. Et punkt slutter ved neste punkt på samme nivå, en tom linje eller en overskrift.
export function claims(md) {
  const out = [];
  let section = "";
  let cur = null;
  let fence = false;
  md.split("\n").forEach((line, i) => {
    if (/^\s*```/.test(line)) fence = !fence;
    if (fence) return;
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    if (h) {
      section = h[1].trim();
      cur = null;
      return;
    }
    if (/^- /.test(line)) {
      cur = { line: i + 1, section, text: line };
      out.push(cur);
    } else if (cur && line.trim() && /^\s+/.test(line)) cur.text += `\n${line}`;
    else if (!line.trim()) cur = null;
  });
  return out;
}

// Ankerne i en markdown-fil, slik GitHub lager dem, og id-ene til items («## <id> <tittel>»).
const slug = (h) => h.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
export const anchor = slug;
export function anchors(md) {
  const out = new Set();
  for (const [, h] of md.matchAll(/^#{1,6}\s+(.*?)\s*$/gm)) {
    out.add(slug(h.replace(/[`*_]/g, "")));
    const id = /^([a-z0-9][a-z0-9-]*)\s/.exec(h);
    if (id) out.add(id[1]);
  }
  return out;
}
