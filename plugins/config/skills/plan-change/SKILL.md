---
name: plan-change
description: Lager planen for en endring i konfigen - formsjekken og mønstrene først, så plan_config per fil mot sandkassen i rekkefølgen Neo gir, og config_not_in_files for det som er i Neo uten fil - og skriver planen i klartekst i PR-en, så godkjenningen av PR-en er godkjenningen av endringen. Skriver ingenting i Neo. Bruk når en endring i 5-oppsett/ er klar til å godkjennes.
---

# Planen

Planen er det godkjenneren sier ja til. Den skal kunne leses av den som eier prosessen, ikke bare av den som har
gjort endringen. Tre lag sjekkes før noe skrives: formen, kvaliteten og virkningen.

## Før du starter

1. Endringen står på en gren med en PR.
2. Slå opp MCP-serveren for miljøet (`node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/mcp-server.mjs"`). Planen virker bare
   mot en sandkasse: svarer Neo `sandbox_only`, er innloggingen ikke i sandkassen til org-en, og planen stopper.

## 1. Formen

Kjør repoets sjekk (`check`), som validerer hver fil mot skjemaet fra Neo, og lista over filene:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/konfigfiler.mjs"
```

Lista har stien Neo får for hver fil, i rekkefølgen Neo skriver dem i. Samme nøkkel to steder, feil mappe eller et
filnavn som ikke stemmer med nøkkelen, stopper planen til det er rettet.

## 2. Kvaliteten

Kjør mønstrene på filene, med reglene som er slått av i config-fila:

```bash
node "$(node "${CLAUDE_PLUGIN_ROOT}/scripts/check-setup.mjs" --sti solution)/scripts/rules.mjs"
```

Rødt stopper planen. Gult står i PR-en med regelen det gjelder; et brudd med vilje står i sporingen med grunnen.

## 3. Virkningen

1. **`plan_config` for hver fil,** i rekkefølgen fra lista, med `file: { path: <stien i Neo>, text: <fila> }`. Svaret
   er `create`, `update` (med `changes`, feltene før og etter), `unchanged` eller `rejected` (med `reasons`).
2. **`deferredSteps`** betyr at stegene i et nytt oppgavemal-sett venter på sakstypen som kobler det. Si det i planen:
   settet skrives på nytt etter sakstypen.
3. **`notRemoved`** er det fila har fjernet, som Neo ikke fjerner. Si hva det er, og at det må fjernes i Neo om det
   skal bort.
4. **`config_not_in_files`** med stiene fra lista (`konfigfiler.mjs --stier`): objektene i Neo uten fil i repoet. De
   røres ikke av endringen; nevn dem, så ingen tror repoet styrer dem.

## 4. Planen i PR-en

Skriv planen øverst i PR-beskrivelsen, i klartekst:

- **Per løsning og fil:** hva som opprettes, endres eller står uendret, og hva saksbehandlerne vil merke. En endring i
  et felt sies med ord («fristen blir 14 dager, var 21»), ikke som JSON.
- **Det som avvises,** med grunnene fra Neo. En plan med en avvist fil godkjennes ikke før fila er rettet.
- **Det som ikke fjernes, det som venter, og det som er i Neo uten fil.**
- **Mønstrene:** funnene som er gule, med regelen.
- **Under, sammenfoldet:** stien, handlingen og `planHash` for hver fil, i rekkefølgen. Skrivingen bruker disse, så
  det som skrives, er det som ble godkjent.

Lages planen på nytt etter en ny commit, byttes hele planen ut.

## Regler

- **Planen skriver ingenting** i Neo.
- **Hver fil har sin plan.** En plan for en annen versjon av fila gjelder ikke.
