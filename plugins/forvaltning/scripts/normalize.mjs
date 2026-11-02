#!/usr/bin/env node
// Gjør svarene fra Neo sine MCP-verktøy om til filer som kan ligge i git og sammenlignes: id-er og tidsstempler
// fjernes, en referanse til et annet objekt skrives med objektets nøkkel, og lister sorteres på nøkkelen. Id-ene
// står bare i låsefila, per miljø, så sandkassen og produksjonen kan sammenlignes selv om id-ene er ulike.
//
//   node normalize.mjs <rå-mappe> <ut-mappe> [--lock <låsefil>]
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

// Feltene som endres uten at oppsettet endres.
export const VOLATILE = /^(id|createdAt|updatedAt|deletedAt|publishedAt|archivedAt|createdBy(Id)?|updatedBy(Id)?|organizationId|orgId|etag|version|versionId)$/;
// Nøkkelen et objekt kjennes igjen på, i denne rekkefølgen.
export const NATURAL = ["slug", "key", "name", "title", "label"];

export const naturalKey = (o) => {
  if (!o || typeof o !== "object" || Array.isArray(o)) return undefined;
  for (const k of NATURAL) if (typeof o[k] === "string" && o[k]) return o[k];
  return undefined;
};

// Alle objekter med både id og nøkkel: id → nøkkel.
export function collectIds(value, ids = new Map()) {
  if (Array.isArray(value)) value.forEach((v) => collectIds(v, ids));
  else if (value && typeof value === "object") {
    const key = naturalKey(value);
    if (typeof value.id === "string" && key) ids.set(value.id, key);
    Object.values(value).forEach((v) => collectIds(v, ids));
  }
  return ids;
}

export function normalize(value, ids) {
  if (Array.isArray(value)) {
    const items = value.map((v) => normalize(v, ids));
    const keys = items.map(naturalKey);
    return keys.every(Boolean) ? items.sort((a, b) => naturalKey(a).localeCompare(naturalKey(b), "nb")) : items;
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value).sort()) {
      if (VOLATILE.test(k)) continue;
      out[k] = normalize(value[k], ids);
    }
    return out;
  }
  if (typeof value === "string" && ids.has(value)) return `ref:${ids.get(value)}`;
  return value;
}

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : n.endsWith(".json") ? [p] : [];
  });

// MCP-svaret kan være selve JSON-en, eller {content:[{type:"text",text:"<json>"}]} slik verktøyet returnerer det.
export function unwrap(raw) {
  const text = raw?.content?.find?.((c) => c.type === "text")?.text;
  if (typeof text === "string") {
    try {
      return JSON.parse(text);
    } catch {
      return raw;
    }
  }
  return raw?.structuredContent ?? raw;
}

export function run(rawDir, outDir) {
  const files = walk(rawDir).map((f) => ({ f, data: unwrap(JSON.parse(readFileSync(f, "utf8"))) }));
  const ids = new Map();
  files.forEach(({ data }) => collectIds(data, ids));
  for (const { f, data } of files) {
    const out = join(outDir, relative(rawDir, f));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(normalize(data, ids), null, 2) + "\n");
  }
  return { files: files.length, ids };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [rawDir, outDir] = process.argv.slice(2);
  if (!rawDir || !outDir) {
    console.error("Bruk: node normalize.mjs <rå-mappe> <ut-mappe> [--lock <låsefil>]");
    process.exit(2);
  }
  const { files, ids } = run(rawDir, outDir);
  const li = process.argv.indexOf("--lock");
  if (li > 0) {
    const lock = Object.fromEntries([...ids].map(([id, key]) => [key, id]).sort(([a], [b]) => a.localeCompare(b, "nb")));
    mkdirSync(dirname(process.argv[li + 1]), { recursive: true });
    writeFileSync(process.argv[li + 1], JSON.stringify(lock, null, 2) + "\n");
  }
  console.log(`${files} filer normalisert til ${outDir}, ${ids.size} objekter i låsefila.`);
}
