#!/usr/bin/env node
// Planen: hva er nytt, endret og fjernet i det ønskede oppsettet (oppsett/) mot det som kjører (et normalisert
// snapshot). Objekter i lister matches på nøkkelen (slug, key, name, title, label), ikke på plassen i lista.
//
//   node diff.mjs <ønsket-mappe> <snapshot-mappe> [--json]
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { naturalKey } from "./normalize.mjs";

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : n.endsWith(".json") ? [p] : [];
      })
    : [];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Feltstiene som er ulike mellom to verdier.
export function changedPaths(a, b, path = "") {
  if (same(a, b)) return [];
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort().flatMap((k) => changedPaths(a[k], b[k], path ? `${path}.${k}` : k));
  }
  return [path || "(hele)"];
}

// Endringene i én fil: objektene på toppnivå, eller i den første lista med nøkler.
export function diffValue(want, have) {
  const list = (v) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v).find((x) => Array.isArray(x) && x.every(naturalKey)) : undefined);
  const w = list(want);
  const h = list(have);
  if (w && w.every(naturalKey) && (!h || h.every(naturalKey))) {
    const hm = new Map((h ?? []).map((o) => [naturalKey(o), o]));
    const wm = new Map(w.map((o) => [naturalKey(o), o]));
    const out = [];
    for (const [k, o] of wm) {
      if (!hm.has(k)) out.push({ kind: "ny", key: k });
      else if (!same(o, hm.get(k))) out.push({ kind: "endret", key: k, fields: changedPaths(hm.get(k), o) });
    }
    for (const k of hm.keys()) if (!wm.has(k)) out.push({ kind: "fjernet", key: k });
    return out;
  }
  return same(want, have) ? [] : [{ kind: have === undefined ? "ny" : "endret", key: "(fila)", fields: changedPaths(have, want) }];
}

export function plan(wantDir, haveDir) {
  const files = new Set([...walk(wantDir).map((f) => relative(wantDir, f)), ...walk(haveDir).map((f) => relative(haveDir, f))]);
  const read = (d, f) => (existsSync(join(d, f)) ? JSON.parse(readFileSync(join(d, f), "utf8")) : undefined);
  const out = [];
  for (const f of [...files].sort()) {
    const want = read(wantDir, f);
    // En fil som bare finnes i snapshotet, er ikke en del av det ønskede oppsettet ennå: den nevnes, men fjernes ikke.
    if (want === undefined) {
      out.push({ file: f, changes: [{ kind: "ikke-styrt", key: "(fila)" }] });
      continue;
    }
    const changes = diffValue(want, read(haveDir, f));
    if (changes.length) out.push({ file: f, changes });
  }
  return out;
}

export function markdown(result) {
  if (!result.length) return "Ingen endringer: oppsettet er likt det som kjører.\n";
  const rows = result.flatMap(({ file, changes }) => changes.map((c) => `| \`${file}\` | ${c.kind} | ${c.key} | ${(c.fields ?? []).join(", ")} |`));
  return `| Fil | Endring | Objekt | Felt |\n|---|---|---|---|\n${rows.join("\n")}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [wantDir, haveDir] = process.argv.slice(2);
  if (!wantDir || !haveDir) {
    console.error("Bruk: node diff.mjs <ønsket-mappe> <snapshot-mappe> [--json]");
    process.exit(2);
  }
  const result = plan(wantDir, haveDir);
  console.log(process.argv.includes("--json") ? JSON.stringify(result, null, 2) : markdown(result));
}
