---
name: plan
description: Viser hva oppsettet i repoet vil gjøre i Neo sin sandkasse, fil for fil, så kunden kan godkjenne endringen i en PR før den gjennomføres. Neo prøver hver fil uten å lagre (plan_config gjennom MCP) og sier hva som er nytt, endret, uendret eller avvist. Bare lesing. Kjør på en branch med endringen, og legg planen i PR-en.
---

# Planen

Planen er det kunden godkjenner. Den skal kunne leses av den som eier prosessen, ikke bare av den som har gjort
endringen.

Neo lager planen. For hver fil prøver Neo skrivingen i sandkassen og ruller den tilbake, så en fil som ikke kan
gjennomføres (en peker som ikke finnes, en status som står to ganger), står som avvist i planen og ikke som en feil
under gjennomføringen.

## Før du starter

- Planen lages mot **sandkassen**. Neo planlegger og skriver bare der; produksjonen får endringen når kundens
  org-admin promoterer sandkassen i Neo.
- MCP-serveren for sandkassen: `node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/neo-config.mjs" --miljo sandkasse` (`mcpServer`
  og `url`).
- Mappene: `neo-config.mjs --get oppsettDir` og `--get reportsDir`.

## Slik gjør du det

1. Filene i rekkefølgen Neo må ha dem:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/rekkefolge.mjs" --manifest <url> <oppsettDir>
   ```

   Manifestet hentes fra Neo (`<url>/api/config/schema`). En fil i en mappe Neo ikke kjenner, stopper skriptet: flytt
   den, eller legg den i `oppsett/manuelt/` om den beskriver noe som gjøres for hånd.
2. Tøm `<reportsDir>/plan-sandkasse/raw/`. For hver fil, i rekkefølgen: kall `plan_config` med `file: { path, text }`,
   der `path` er stien relativt til `<oppsettDir>` og `text` er innholdet i fila uendret. Lagre svaret uendret i
   `<reportsDir>/plan-sandkasse/raw/<sti med / byttet med __>.json`.
3. Kall `config_not_in_files` med `paths`: alle stiene fra steg 1. Lagre svaret i
   `<reportsDir>/plan-sandkasse/raw/ikke-styrt.json`.
4. Sett sammen planen:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/planrapport.mjs" <reportsDir>/plan-sandkasse/raw --md <reportsDir>/plan-sandkasse.md --json <reportsDir>/plan-sandkasse.json
   ```

   Exit 1 betyr at minst én fil er avvist. Grunnen står i planen; rett fila og lag planen på nytt.
5. Skriv over planen, i klartekst og per sakstype: hva endres, hvorfor (lenke til raden i `beslutninger.md`), og hva
   saksbehandlerne vil merke.
6. Commit `plan-sandkasse.md` og `plan-sandkasse.json` (ikke `raw/`), og legg planen i PR-beskrivelsen. Godkjenningen
   av PR-en er kundens godkjenning av akkurat denne planen: gjennomføringen sjekker mot `plan-sandkasse.json`.

## Det planen sier

- **ny / endret / uendret / avvist:** Neo sitt svar per fil. En endring viser feltet, verdien før og etter.
- **Blir stående i Neo:** det fila har fjernet, men som Neo ikke fjerner (statuser, felt og koblinger på en
  sakstype). Det er alltid et spørsmål til kunden: skal det fjernes for hånd i Neo?
- **Skrives etter sakstypene:** et nytt oppgavemal-sett med steg som venter på en sakstype som kobler det.
- **Ikke styrt fra repoet:** det som finnes i sandkassen uten en fil her. Gjennomføringen rører det ikke.

## Regler

- Planen endrer ingenting i Neo.
- En fjerning er alltid et spørsmål til kunden, aldri noe som tas med stille.
