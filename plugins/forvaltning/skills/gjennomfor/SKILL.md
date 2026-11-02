---
name: gjennomfor
description: Gjennomfører en godkjent plan i Neo sin sandkasse gjennom MCP, én endring om gangen, med snapshot før og etter. Promoteringen til produksjon gjøres av kundens org-admin i Neo. Bruk bare når PR-en med planen er godkjent.
---

# Gjennomføringen

## Før du starter

- PR-en med planen er godkjent av den som står som godkjenner i `kunde.yaml` (og i `CODEOWNERS`). Er den ikke det,
  stopp og si det.
- Du bruker MCP-serveren `neo-sandkasse`. Gjennomføring rett i produksjon gjøres ikke herfra: endringen promoteres fra
  sandkassen av kundens org-admin i Neo, og den står da i revisjonsloggen.

## Slik gjør du det

1. Snapshot av sandkassen (`/forvaltning:snapshot sandkasse`). Er det ulikt det planen ble laget mot, lag planen på
   nytt og få den godkjent før du går videre.
2. Gjør endringene i planen, én om gangen, med verktøyet planen nevner. Bruk låsefila (`state/sandkasse.lock.json`)
   for å finne id-en til et objekt fra nøkkelen.
3. Stopp ved første feil. Skriv hva som er gjort og hva som gjenstår.
4. Snapshot etter. Planen mot sandkassen skal nå være tom for det som er gjort.
5. Før en rad i `beslutninger.md`: dato, hva, hvem som godkjente (PR-en), hvem som gjennomførte.
6. Si til kunden at endringen ligger i sandkassen og kan promoteres, og hva som bør testes før det.

## Det som ikke kan gjøres herfra ennå

- Gjennomføring fra pipelinen i GitHub uten en person: Neo har ennå ingen skrivevei for en maskinklient.
- Endringer uten MCP-verktøy (maler, instrukser, tagger, arkivoppsettet, tilgangsgruppene): de gjøres i Neo, og
  snapshotet etterpå viser at de er gjort.
