#!/usr/bin/env node
// Filene i oppsettet i den rekkefølgen Neo må skrive dem (statusene før feltene, sakstypene før flytene). Rekkefølgen
// og mappene står i Neo sitt manifest (`GET <adresse>/api/config/schema`), ikke her, så pluginen følger Neo når en ny
// type kommer med.
//
//   node rekkefolge.mjs --manifest <adresse|fil> <oppsett-mappe>
//
// Skriver én sti per linje, relativ til mappa. En fil i en mappe manifestet ikke kjenner, er en feil.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export async function loadManifest(source, fetchImpl = fetch) {
  if (existsSync(source)) return JSON.parse(readFileSync(source, "utf8"));
  const url = `${source.replace(/\/+$/, "")}/api/config/schema`;
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Manifestet fra ${url} svarte ${res.status}.`);
  return res.json();
}

export const yamlFiles = (root, dir = root) => {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...yamlFiles(root, p));
    else if (name.endsWith(".yaml")) out.push(relative(root, p));
  }
  return out;
};

// Stiene sortert etter `applyOrder`, så alfabetisk innenfor en type. Kaster med alle filene som ikke hører til en type.
export function order(paths, manifest) {
  const kindOf = new Map(manifest.kinds.map((k) => [k.directory.replace(/\/+$/, ""), k.kind]));
  const rank = new Map(manifest.applyOrder.map((kind, i) => [kind, i]));
  const unknown = [];
  const known = [];
  for (const path of paths) {
    const kind = kindOf.get(path.split("/").slice(0, -1).join("/"));
    if (kind === undefined || !rank.has(kind)) unknown.push(path);
    else known.push({ path, rank: rank.get(kind) });
  }
  if (unknown.length) {
    throw new Error(`Disse filene ligger ikke i en mappe Neo kjenner (${[...kindOf.keys()].join(", ")}):\n${unknown.map((p) => `- ${p}`).join("\n")}`);
  }
  return known.sort((a, b) => a.rank - b.rank || a.path.localeCompare(b.path, "nb")).map((x) => x.path);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--manifest");
  const source = i >= 0 ? args[i + 1] : undefined;
  const dir = args.filter((_, j) => j !== i && j !== i + 1)[0];
  if (!source || !dir) {
    console.error("Bruk: node rekkefolge.mjs --manifest <adresse|fil> <oppsett-mappe>");
    process.exit(2);
  }
  try {
    console.log(order(yamlFiles(dir), await loadManifest(source)).join("\n"));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
