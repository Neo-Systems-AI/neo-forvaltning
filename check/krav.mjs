// Kravene i felles/krav/ og i hver løsning: hvert krav er et item med yaml-blokken, med flyt, hvorfor, en kilde som
// finnes, en id som er brukt én gang, og hva kravet ble (blir): en konfigfil i oppsett/ i roten, et steg et menneske
// gjør i Neo, eller et ønske til Neo, de to siste med hvorfor. Det finnes ingen egen sporingsfil: sjekken leser blir og
// ser at filene finnes.
import { existsSync, readFileSync } from "node:fs";
import { join, normalize } from "node:path";
import { anchors, headings, isMap, items, list, mdFiles, posix, text } from "./les.mjs";
import { registry } from "./kilder.mjs";

export const CHECKS = [{ name: "krav", about: "Hvert krav er et item med yaml-blokken, har flyt, hvorfor og en kilde som finnes, en id som er brukt én gang, og hva det ble (blir) når løsningen er ute av utkast" }];

export const FLYT = ["deterministisk", "agentisk", "menneske"];
export const BLIR = ["fil", "steg", "onske"];

export function allRequirements(root, places) {
  const out = [];
  for (const p of places) for (const file of mdFiles(root, `${p.dir}/krav`)) for (const r of items(readFileSync(join(root, file), "utf8"))) out.push({ ...r, place: p, file });
  return out;
}

// En sti i blir er fra roten: oppsett/<mappa for typen>/<navn>.yaml, slik Neo eksporterer fila.
export const blirPath = (p) => posix(normalize(String(p)));

// status: løsningens status fra losning.yaml, per navn. I utkast kan blir stå tomt; ute av utkast er det rødt.
export function checkKrav(root, places, { status = () => undefined } = {}) {
  const f = [];
  const seen = new Map();
  const used = new Set();
  // En overskrift i krav/ uten yaml-blokken rett under er et krav sjekken ellers ikke ser: rødt.
  for (const p of places) {
    for (const file of mdFiles(root, `${p.dir}/krav`)) {
      const md = readFileSync(join(root, file), "utf8");
      const withBlock = new Set(items(md).map((r) => r.line));
      for (const h of headings(md)) if (!withBlock.has(h.line)) f.push({ check: "krav", file, line: h.line, message: `«${h.text}» har ingen yaml-blokk rett under. Et krav er «## <id> <tittel>» med yaml-blokken (flyt, hvorfor, kilde, blir) rett under. Legg blokken rett under overskriften, eller gjør overskriften til en vanlig tekst` });
    }
  }
  for (const r of allRequirements(root, places)) {
    const at = { check: "krav", file: r.file, line: r.line };
    if (r.error) {
      f.push({ ...at, message: `${r.id}: yaml-blokken kan ikke leses (${r.error}). Rett YAML-en der feilen sier` });
      continue;
    }
    if (seen.has(r.id)) f.push({ ...at, message: `Id-en ${r.id} er brukt før, i ${seen.get(r.id)}. Gi dette kravet en ny id` });
    else seen.set(r.id, r.file);
    if (!FLYT.includes(r.fields.flyt)) f.push({ ...at, message: `${r.id}: flyt må være ${FLYT.join(", ")}. Sett den som passer (formen står i felles/krav/README.md)` });
    if (!text(r.fields.hvorfor)) f.push({ ...at, message: `${r.id}: hvorfor mangler. Skriv hvorfor kravet finnes` });
    const kilde = list(r.fields.kilde).map(String);
    if (!kilde.length) f.push({ ...at, message: `${r.id}: kilde mangler. Vis til kilden kravet bygger på (kilde: [K1]); finnes den ikke, er det et forslag, ikke et krav` });
    const ids = registry(root, r.place.dir);
    for (const k of kilde) {
      if (/^[EK]\d+$/.test(k)) {
        if (!ids.has(k)) f.push({ ...at, message: `${r.id}: ${k} står ikke i registeret (${r.place.dir}/kilder/kilder.md). Rett id-en, eller legg kilden inn i registeret` });
        else if (ids.get(k).trukket) f.push({ ...at, message: `${r.id}: ${k} er trukket tilbake. Bygg kravet på en annen kilde, eller ta det bort` });
        continue;
      }
      const [path, anchor] = k.split("#");
      const target = join(root, r.place.dir, path);
      if (!existsSync(target)) f.push({ ...at, message: `${r.id}: ${path} finnes ikke (stien er relativ til ${r.place.dir}/). Rett stien` });
      else if (anchor && !anchors(readFileSync(target, "utf8")).has(decodeURIComponent(anchor).toLowerCase())) f.push({ ...at, message: `${r.id}: overskriften #${anchor} finnes ikke i ${path}. Rett lenken til en overskrift som finnes` });
    }

    const blir = list(r.fields.blir);
    if (!blir.length) {
      const s = r.place.felles ? undefined : status(r.place.navn);
      if (["i-test", "i-bruk"].includes(s)) f.push({ ...at, message: `${r.id}: blir mangler. Løsningen er ${s}, så hvert krav sier hva det ble: { fil: oppsett/… }, { steg: …, hvorfor: … } eller { onske: …, hvorfor: … }` });
      else if (r.place.felles) f.push({ ...at, level: "warn", message: `${r.id}: blir står tomt: hva kravet ble (en fil i oppsett/, et steg eller et ønske til Neo)` });
    }
    for (const b of blir) {
      const kinds = isMap(b) ? BLIR.filter((k) => k in b) : [];
      if (kinds.length !== 1) {
        f.push({ ...at, message: `${r.id}: hver linje i blir er én av { fil: <sti> }, { steg: <tekst>, hvorfor: <tekst> } eller { onske: <tekst>, hvorfor: <tekst> }. Skriv linja i en av dem` });
        continue;
      }
      const [k] = kinds;
      if (Object.keys(b).some((x) => ![k, "hvorfor"].includes(x))) f.push({ ...at, message: `${r.id}: blir.${k} har bare ${k} og hvorfor. Ta bort de andre feltene` });
      if (k !== "fil" && !text(b.hvorfor)) f.push({ ...at, message: `${r.id}: blir.${k} trenger hvorfor. Skriv hvorfor kravet ikke ble konfig` });
      if (!text(String(b[k] ?? ""))) f.push({ ...at, message: `${r.id}: blir.${k} er tom. Skriv hva kravet ble, eller ta bort linja` });
      if (k === "fil" && text(String(b.fil ?? ""))) {
        const p = blirPath(b.fil);
        used.add(p);
        if (/^(felles|losninger\/[^/]+)\/oppsett\//.test(p)) f.push({ ...at, message: `${r.id}: blir.fil ${b.fil}: konfigen står i oppsett/ i roten, slik Neo eksporterer den. En løsning og felles/ har ingen egen oppsett/. Flytt filene til oppsett/ i roten, og rett blir i kravene` });
        else if (!/^oppsett\/(?!manuelt\/)[^/]+\/[^/]+\.yaml$/.test(p)) f.push({ ...at, message: `${r.id}: blir.fil ${b.fil} er ikke en konfigfil i oppsett/: oppsett/<mappa for typen>/<navn>.yaml, fra roten. Det som gjøres for hånd, er et steg` });
        else if (!existsSync(join(root, p))) f.push({ ...at, message: `${r.id}: blir.fil ${b.fil} finnes ikke. Rett stien til fila i oppsett/` });
      }
    }
  }
  return { findings: f, used, ids: new Set(seen.keys()) };
}
