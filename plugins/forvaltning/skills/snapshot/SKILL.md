---
name: snapshot
description: Henter oppsettet som kjører i Neo som filer i repoet, slik Neo selv skriver dem (export_config gjennom MCP), og viser hva som er endret siden forrige snapshot. Bare lesing. Kjør før og etter hver endring, og når du skal se hva som har endret seg utenom repoet.
---

# Snapshot av oppsettet

Et snapshot er backup, grunnlag for oppsettet i repoet og historikk: git-historikken til snapshotene er historikken
til oppsettet. Det endrer ingenting i Neo.

Neo skriver filene selv (`export_config`). Formen, nøklene og pekerne er Neo sine, så filene kan legges rett i
`oppsett/`, og plan og gjennomføring forstår dem uten at noe oversettes her.

## Før du starter

1. Spør hvilket miljø, om det ikke er sagt. Standard er `neo.defaultEnv` i config-fila.
2. Slå opp MCP-serveren for miljøet før du kaller et verktøy:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/neo-config.mjs" --miljo <miljø>
   ```

   Svaret gir `mcpServer`; verktøyene heter `mcp__<mcpServer>__<verktøy>`. Si alltid hvilket miljø svaret kom fra.
3. Mappa: `node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/neo-config.mjs" --get snapshotDir`.

## Slik gjør du det

1. Kall `export_config` (ingen argumenter). Lagre svaret uendret som JSON i `<snapshotDir>/<miljø>/raw/export_config.json`.
2. Legg det ut som filer:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/skriv-eksport.mjs" <snapshotDir>/<miljø>/raw/export_config.json <snapshotDir>/<miljø>
   ```

   Skriptet skriver hver fil på stien Neo ga, fjerner filene Neo ikke lenger har, og skriver `ikke-med.md`: det som
   finnes i Neo, men ikke er med i filene ennå, med grunnen.
3. Svarer Neo at oppsettet ikke kan skrives som filer (exit 1), skrives ingenting. Vis problemene til personen. De
   rettes i Neo, for eksempel to oppgavemal-sett med samme navn, og så tas snapshotet på nytt.
4. `raw/` committes ikke (den står i `.gitignore`). Filene og `ikke-med.md` committes, med meldingen
   `snapshot: <miljø> <dato>`.
5. Si kort hva som er endret siden forrige snapshot (`git diff --stat`). En endring ingen har gjort gjennom repoet, er
   et avvik: skriv det i `beslutninger.md` som «avvik funnet», så kunden kan avgjøre om det skal tas inn i oppsettet
   eller rulles tilbake.

## Sandkassen og produksjonen

`export_config` virker i begge. Filene er like når oppsettet er likt, fordi Neo skriver dem uten id-er: `git diff
--no-index <snapshotDir>/sandkasse <snapshotDir>/produksjon` viser hva som ikke er promotert ennå.

## Det som ikke er med ennå

`ikke-med.md` sier hva, per objekt. Typer Neo ikke skriver som fil ennå (behandlingsregler, maler, tagger og flere),
styres i Neo og beskrives for hånd i `oppsett/manuelt/`. Når Neo tar dem med, kommer de med i neste snapshot av seg
selv.

Er svaret for stort for Claude Code (en organisasjon med mange flyter), kan grensen heves med miljøvariabelen
`MAX_MCP_OUTPUT_TOKENS` før Claude Code startes.
