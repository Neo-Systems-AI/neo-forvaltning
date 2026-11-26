---
name: plan
description: Viser hva oppsettet i repoet vil gjøre i Neo sin sandkasse, fil for fil, så kunden kan godkjenne endringen i en PR før den gjennomføres. Et skript sender filene til Neo med maskinklienten; Neo prøver hver fil uten å lagre og sier hva som er nytt, endret, uendret eller avvist. Bare lesing. Kjør på en branch med endringen, og legg planen i PR-en. Brukes også på én fil mens den skrives.
---

# Planen

Planen er det kunden godkjenner. Den skal kunne leses av den som eier prosessen, ikke bare av den som har gjort
endringen.

Neo lager planen. For hver fil prøver Neo skrivingen i sandkassen og ruller den tilbake, så en fil som ikke kan
gjennomføres (en peker som ikke finnes, en status som står to ganger), står som avvist i planen og ikke som en feil
under gjennomføringen. Skriptet sender filene og samler svarene; ingenting går gjennom modellen.

## Før du starter

- Planen lages mot **sandkassen**. Neo planlegger og skriver bare der; produksjonen får endringen når kundens
  org-admin promoterer sandkassen i Neo.
- En flyt som bruker en integrasjon eller sender fra en postboks, skriver den som nøkkel. Hent de gyldige i stedet for
  å skrive navnet eller adressen for hånd:

  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/scripts/konfig.mjs" miljo
  ```

  Tokenet står i `ref`.

## Én fil, mens den skrives

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/konfig.mjs" plan --fil <sti under oppsett/>
```

Svaret er Neo sitt for fila: `create`, `update` med endringene, `unchanged`, eller `rejected` med grunnene. Rett fila
til den ikke er avvist.

## Planen til PR-en

1. Lag planen for alle filene:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/konfig.mjs" plan
   ```

   Skriptet sender filene i rekkefølgen fra Neo sitt manifest, spør hva sandkassen har uten fil, og skriver
   `<reportsDir>/plan-<miljø>.md` og `.json`. Exit 1 betyr at minst én fil er avvist; grunnen står i planen. En fil i
   en mappe Neo ikke kjenner, stopper skriptet: flytt den, eller legg den i `oppsett/manuelt/` om den beskriver noe som
   gjøres for hånd.
2. Skriv over planen, i klartekst og per sakstype: hva endres, hvorfor (lenke til raden i `beslutninger.md`), og hva
   saksbehandlerne vil merke.
3. Commit `plan-<miljø>.md` og `plan-<miljø>.json`, og legg planen i PR-beskrivelsen. Godkjenningen av PR-en er kundens
   godkjenning av akkurat denne planen: gjennomføringen sjekker mot `plan-<miljø>.json`.

## Det planen sier

- **ny / endret / uendret / avvist:** Neo sitt svar per fil. En endring viser feltet, verdien før og etter.
- **Blir stående i Neo:** det fila har fjernet, men som Neo ikke fjerner (statuser, felt og koblinger på en
  sakstype). Det er alltid et spørsmål til kunden: skal det fjernes for hånd i Neo?
- **Skrives etter sakstypene:** et nytt oppgavemal-sett med steg som venter på en sakstype som kobler det.
- **Ikke styrt fra repoet:** det som finnes i sandkassen uten en fil her. Gjennomføringen rører det ikke.

## Regler

- Planen endrer ingenting i Neo.
- En fjerning er alltid et spørsmål til kunden, aldri noe som tas med stille.
