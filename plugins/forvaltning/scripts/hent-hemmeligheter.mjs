#!/usr/bin/env node
// Hemmelighetene fra kundens hvelv til `.env.local` og `.keys/`, slik `bin/lab env` gjør det for oss i labben. Kunden
// eier hemmelighetene og hvelvet; config-fila sier bare hvor hver av dem ligger. Verdiene skrives aldri ut: `--sjekk`
// viser navn og om de er satt, `--hent` skriver dem til filer som aldri committes.
//
//   node hent-hemmeligheter.mjs --sjekk
//   node hent-hemmeligheter.mjs --hent          kjøres av et menneske, med sin egen innlogging mot hvelvet
//
// Kildene, så kunden bruker det den har:
//   azure-keyvault:<hvelv>/<navn>   Azure Key Vault (az keyvault secret show), for den som har Azure
//   1password:op://<hvelv>/<post>/<felt>   1Password (op read), for den som har det
//   manuell                          personen skriver verdien i .env.local selv; hentingen hopper over den
// Andre kilder legges til her, med en test.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { load } from "./lib/neo-config.mjs";
import { ENV_FILE, loadEnvLocal, refs } from "./lib/hemmeligheter.mjs";

export const SOURCES = {
  "azure-keyvault": (rest, exec = execFileSync) => {
    const [vault, name] = rest.split("/");
    if (!vault || !name) throw new Error(`azure-keyvault trenger <hvelv>/<navn>, fikk «${rest}»`);
    return exec("az", ["keyvault", "secret", "show", "--vault-name", vault, "--name", name, "--query", "value", "-o", "tsv"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd();
  },
  "1password": (rest, exec = execFileSync) => {
    if (!rest.startsWith("op://")) throw new Error(`1password trenger op://<hvelv>/<post>/<felt>, fikk «${rest}»`);
    return exec("op", ["read", "--no-newline", rest], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  },
};

export function parseKilde(kilde) {
  const i = kilde?.indexOf(":") ?? -1;
  if (i < 0) return null;
  return { type: kilde.slice(0, i), rest: kilde.slice(i + 1) };
}

// Hva som er satt, uten verdier.
export const status = (list) => list.map((r) => ({ ...r, satt: process.env[r.env] !== undefined && process.env[r.env] !== "" }));

export function fetchAll(list, root, { sources = SOURCES } = {}) {
  const lines = existsSync(join(root, ENV_FILE)) ? readFileSync(join(root, ENV_FILE), "utf8").split("\n").filter((l) => l.trim()) : [];
  const set = (name, v) => {
    const i = lines.findIndex((l) => l.startsWith(`${name}=`));
    const line = `${name}=${v}`;
    if (i >= 0) lines[i] = line;
    else lines.push(line);
  };
  const done = [];
  const failed = [];
  for (const r of list) {
    if (r.kilde === "manuell") {
      done.push({ ...r, manuell: true });
      continue;
    }
    const k = parseKilde(r.kilde);
    if (!k || !sources[k.type]) {
      failed.push({ ...r, why: r.kilde ? `ukjent kilde «${k?.type ?? r.kilde}»` : "ingen kilde i config-fila" });
      continue;
    }
    try {
      const v = sources[k.type](k.rest);
      if (r.fil) {
        mkdirSync(join(root, ".keys"), { recursive: true });
        const f = join(".keys", `${r.env.toLowerCase()}.pem`);
        writeFileSync(join(root, f), v.endsWith("\n") ? v : `${v}\n`, { mode: 0o600 });
        set(r.env, f);
      } else set(r.env, v);
      done.push(r);
    } catch (e) {
      failed.push({ ...r, why: String(e.message).split("\n")[0] });
    }
  }
  writeFileSync(join(root, ENV_FILE), `${lines.join("\n")}\n`, { mode: 0o600 });
  chmodSync(join(root, ENV_FILE), 0o600);
  return { done, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { found, data, errors } = load();
  if (!data) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  const root = found.root ?? process.cwd();
  const list = refs(data);
  if (process.argv.includes("--hent")) {
    const { done, failed } = fetchAll(list, root);
    const fetched = done.filter((r) => !r.manuell);
    console.log(`${fetched.length} hentet til ${ENV_FILE}${fetched.some((r) => r.fil) ? " og .keys/" : ""}. Verdiene er ikke skrevet ut.`);
    for (const r of done.filter((x) => x.manuell)) console.log(`– ${r.env} settes for hånd i ${ENV_FILE} (kilde: manuell)`);
    for (const f of failed) console.log(`✗ ${f.env} (${f.path}): ${f.why}`);
    process.exit(failed.length ? 1 : 0);
  }
  loadEnvLocal(root);
  console.log("| Hemmelighet | Står i config | Kilde | Satt |\n|---|---|---|---|");
  for (const r of status(list)) console.log(`| \`${r.env}\` | \`${r.path}\` | ${r.kilde ?? "—"} | ${r.satt ? "ja" : "❌ nei"} |`);
  process.exit(status(list).every((r) => r.satt) ? 0 : 1);
}
