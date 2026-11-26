// Kravene i felles/krav/ og i hver løsning: flyt, hvorfor, en kilde som finnes, en id som er brukt én gang, og hva
// kravet ble (blir): en fil i oppsett/ (også i felles/oppsett/), et steg et menneske gjør i Neo, eller et ønske til
// Neo, de to siste med hvorfor. Det finnes ingen egen sporingsfil: sjekken leser blir og ser at filene finnes.
import { existsSync, readFileSync } from "node:fs";
import { join, normalize } from "node:path";
import { anchors, isMap, items, list, mdFiles, posix, text } from "./les.mjs";
import { registry } from "./kilder.mjs";

export const CHECKS = [{ name: "krav", about: "Hvert krav har flyt, hvorfor og en kilde som finnes, en id som er brukt én gang, og hva det ble (blir) når løsningen er ute av utkast" }];

export const FLYT = ["deterministisk", "agentisk", "menneske"];
export const BLIR = ["fil", "steg", "onske"];

export function allRequirements(root, places) {
  const out = [];
  for (const p of places) for (const file of mdFiles(root, `${p.dir}/krav`)) for (const r of items(readFileSync(join(root, file), "utf8"))) out.push({ ...r, place: p, file });
  return out;
}

// En sti i blir: fra roten når den starter med felles/, ellers relativ til stedet kravet står (som oppsett/…).
export const blirPath = (place, p) => posix(normalize(String(p).startsWith("felles/") ? String(p) : `${place.dir}/${p}`));

// status: løsningens status fra losning.yaml, per navn. I utkast kan blir stå tomt; ute av utkast er det rødt.
export function checkKrav(root, places, { status = () => undefined } = {}) {
  const f = [];
  const seen = new Map();
  const used = new Set();
  for (const r of allRequirements(root, places)) {
    const at = { check: "krav", file: r.file, line: r.line };
    if (r.error) {
      f.push({ ...at, message: `${r.id}: yaml-blokken kan ikke leses (${r.error})` });
      continue;
    }
    if (seen.has(r.id)) f.push({ ...at, message: `Id-en ${r.id} er brukt før, i ${seen.get(r.id)}` });
    else seen.set(r.id, r.file);
    if (!FLYT.includes(r.fields.flyt)) f.push({ ...at, message: `${r.id}: flyt må være ${FLYT.join(", ")}` });
    if (!text(r.fields.hvorfor)) f.push({ ...at, message: `${r.id}: hvorfor mangler` });
    const kilde = list(r.fields.kilde).map(String);
    if (!kilde.length) f.push({ ...at, message: `${r.id}: kilde mangler` });
    const ids = registry(root, r.place.dir);
    for (const k of kilde) {
      if (/^[EK]\d+$/.test(k)) {
        if (!ids.has(k)) f.push({ ...at, message: `${r.id}: ${k} står ikke i registeret (${r.place.dir}/kilder/kilder.md)` });
        else if (ids.get(k).trukket) f.push({ ...at, message: `${r.id}: ${k} er trukket tilbake` });
        continue;
      }
      const [path, anchor] = k.split("#");
      const target = join(root, r.place.dir, path);
      if (!existsSync(target)) f.push({ ...at, message: `${r.id}: ${path} finnes ikke (stien er relativ til ${r.place.dir}/)` });
      else if (anchor && !anchors(readFileSync(target, "utf8")).has(decodeURIComponent(anchor).toLowerCase())) f.push({ ...at, message: `${r.id}: overskriften #${anchor} finnes ikke i ${path}` });
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
        f.push({ ...at, message: `${r.id}: hver linje i blir er én av { fil: <sti> }, { steg: <tekst>, hvorfor: <tekst> } eller { onske: <tekst>, hvorfor: <tekst> }` });
        continue;
      }
      const [k] = kinds;
      if (Object.keys(b).some((x) => ![k, "hvorfor"].includes(x))) f.push({ ...at, message: `${r.id}: blir.${k} har bare ${k} og hvorfor` });
      if (k !== "fil" && !text(b.hvorfor)) f.push({ ...at, message: `${r.id}: blir.${k} trenger hvorfor: hvorfor kravet ikke ble konfig` });
      if (!text(String(b[k] ?? ""))) f.push({ ...at, message: `${r.id}: blir.${k} er tom` });
      if (k === "fil" && text(String(b.fil ?? ""))) {
        const p = blirPath(r.place, b.fil);
        used.add(p);
        if (!/^(felles|losninger\/[^/]+)\/oppsett\//.test(p)) f.push({ ...at, message: `${r.id}: blir.fil ${b.fil} ligger ikke i en oppsett/-mappe` });
        else if (!existsSync(join(root, p))) f.push({ ...at, message: `${r.id}: blir.fil ${b.fil} finnes ikke (${p})` });
      }
    }
  }
  return { findings: f, used, ids: new Set(seen.keys()) };
}
