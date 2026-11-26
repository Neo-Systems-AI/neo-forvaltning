---
name: 06-deploy-to-sandbox
description: Får konfigen til en løsning inn i sandkassen i Neo - formen og mønstrene i sjekken, planen per fil mot sandkassen (plan_config i rekkefølgen Neo gir, og config_not_in_files) i klartekst i PR-en, og etter at PR-en er godkjent, skrivingen fil for fil med planHash fra planen. Bare sandkassen; promoteringen gjør et menneske i Neo. Bruk når konfigen i oppsett/ er klar til å godkjennes, og når en godkjent plan skal skrives.
---

# I sandkassen

Planen er det godkjenneren sier ja til, og det som skrives, er det som ble godkjent: filene på commiten planen ble
laget for, med `planHash` fra planen. Tre lag sjekkes før noe skrives: formen, kvaliteten og virkningen.

## Før du starter

1. Endringen står på en gren med en PR.
2. Slå opp Neo (`node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/config.mjs"`). Planen og skrivingen virker bare mot en
   sandkasse: svarer Neo `sandbox_only`, er innloggingen ikke i sandkassen til org-en, og du stopper.

## 1. Formen og kvaliteten

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/sjekk.mjs" --base origin/main
```

Sjekken validerer hver fil mot skjemaet fra Neo, ser at samme objekt ikke står to steder, og kjører mønstrene. Rødt
stopper planen. Gult står i PR-en med regelen det gjelder. Et brudd med vilje står i `design/` med regelens id og
grunnen, og meldes ikke på nytt.

## 2. Virkningen

1. **Filene i rekkefølgen Neo skriver dem i,** med stien Neo får:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/sjekk.mjs" filer --losning <løsning>
   ```

2. **`plan_config` for hver fil,** i den rekkefølgen, med `file: { path: <stien i Neo>, text: <fila> }`. Svaret er
   `create`, `update` (med `changes`, feltene før og etter), `unchanged` eller `rejected` (med `reasons`). Stien
   avgjør Neo: en fil på feil sti avvises med grunnen.
3. **`deferredSteps`** betyr at stegene i et nytt oppgavemal-sett venter på sakstypen som kobler det: settet skrives
   på nytt etter sakstypen.
4. **`notRemoved`** er det fila har fjernet, som Neo ikke fjerner. Si hva det er, og at det fjernes i Neo om det skal
   bort.
5. **`config_not_in_files`** med stiene fra `sjekk.mjs filer --stier`: objektene i Neo uten fil i repoet. De røres ikke
   av endringen; nevn dem, så ingen tror repoet styrer dem.

## 3. Planen i PR-en

Øverst i PR-beskrivelsen, i klartekst, så den som eier prosessen kan lese den:

- **Per fil:** hva som opprettes, endres eller står uendret, og hva saksbehandlerne vil merke. En endring i et felt
  sies med ord («fristen blir 14 dager, var 21»), ikke som JSON.
- **Det som avvises,** med grunnene fra Neo. En plan med en avvist fil godkjennes ikke før fila er rettet.
- **Det som ikke fjernes, det som venter, og det som er i Neo uten fil.**
- **Mønstrene:** det gule, med regelen.
- **Sammenfoldet under:** stien, handlingen og `planHash` for hver fil, i rekkefølgen.

Lages planen på nytt etter en ny commit, byttes hele planen ut.

## 4. Skrivingen, etter godkjenningen

Bare når PR-en er godkjent av godkjenneren i `.github/CODEOWNERS`, og planen gjelder commiten du står på. Er en fil
endret etter planen, lag planen på nytt og få den godkjent.

1. **Fil for fil,** i rekkefølgen planen har: `apply_config` med `file: { path, text }` og `planHash` for fila. En fil
   planen sa var `unchanged`, hoppes over.
2. **Stopp ved første feil.**
   - `PLAN_STALE` (409): fila eller objektet i sandkassen er endret siden planen. Lag planen for resten på nytt, og få
     den godkjent før du går videre.
   - Avvist (422): vis grunnene fra Neo. Fila rettes i repoet, med en ny plan.
   - `SANDBOX_NOT_READY`: sandkassen er ikke ferdig klonet. Vent, og prøv igjen.
3. **`deferredSteps`:** når sakstypen som kobler et nytt oppgavemal-sett er skrevet, lag planen for settet på nytt og
   skriv det, så stegene kommer med.
4. **Hent konfigen fra sandkassen etterpå** (`export_config`), og se at `git diff` er tom for filene som er skrevet. En
   diff betyr at Neo har noe annet enn repoet; si hva.

## Etterpå

Skriv i PR-en hva som er skrevet (filene og id-ene Neo ga), hva som gjenstår, og hva som ikke ble skrevet og hvorfor.
Si så til den som skal teste og promotere:

- **En flyt lander som utkast.** Den aktiveres i Neo, av en person med rett til det, etter at gapene er lest.
- **Det som er fjernet fra en fil** (`notRemoved`), står i sandkassen til det fjernes i Neo.
- **Promoteringen** fra sandkassen til org-en gjør et menneske i Neo, og den står i revisjonsloggen der. Si hva som
  bør testes før det.

## Regler

- **Planen skriver ingenting.** Skrivingen skjer bare mot sandkassen, og bare med `planHash` fra den godkjente planen.
- **Hver fil har sin plan.** En plan for en annen versjon av fila gjelder ikke.
- **Team, roller og tilgang** er miljø, ikke konfig: de settes opp av et menneske i Neo.
