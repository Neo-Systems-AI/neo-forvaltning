---
name: ki
description: Viser og endrer KI-oppsettet i Neo per sakstype - modellen, verktøyene agenten har, og feltene der KI-en foreslår verdier eller henter dem ut etter et kriterium. Leser siste snapshot; en endring skrives i oppsett/ og går gjennom /forvaltning:plan.
---

# KI-oppsettet

## Oversikten

1. Ta et ferskt snapshot (`/forvaltning:snapshot <miljø>`) om det siste er gammelt.
2. Les fra `<snapshotDir>/<miljø>/oppsett/`:
   - `list_case_types.json`: `defaultAgentModelId` (modellen) og `defaultAgentToolIds` (verktøyene) per sakstype.
   - `list_custom_fields.json`: `aiSuggestions` (KI-en foreslår verdien) og `extractionCriterion` (det KI-en henter
     ut etter) per felt.
3. Svar per sakstype: modell, verktøy, og feltene med KI. Si fra om det som skiller seg ut: en sakstype uten modell,
   en modell som bare én sakstype bruker, et felt med forslag men uten kriterium.

## En endring

1. Endre i `oppsett/list_case_types.json` eller `oppsett/list_custom_fields.json` på en branch (kopier fra
   snapshotet om fila ikke er styrt ennå).
2. Skriv hvorfor i `beslutninger.md`. Et bytte av modell kan endre hva saksbehandlerne får foreslått: si hva som bør
   testes.
3. `/forvaltning:plan`, PR, godkjenning, `/forvaltning:gjennomfor`.

## Det som ikke er med ennå

Modellpolicyen for organisasjonen og instruksene har ikke MCP-verktøy ennå. De beskrives i `oppsett/manuelt/` og
endres i Neo.
