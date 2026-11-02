---
name: helse
description: Helsa til oppsettet i Neo for ett miljø og et tidsvindu - flytene, kjøringene, hva som har feilet og det som stikker seg ut. Svarer med en kort oversikt og teller opp resten, så du kan spørre etter detaljene uten at alt hentes på nytt («detaljer» gir alt med én gang). Bare lesing.
---

# Helsa

## Før du starter

1. Miljøet (standard `neo.defaultEnv`) og vinduet (standard `helse.window`, eller det som er sagt: døgn = 24h,
   uke = 7d, måned = 30d).
2. Slå opp MCP-serveren for miljøet før du kaller et verktøy:
   
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/neo-config.mjs" --miljo <miljø>
   ```
   
   Svaret gir `mcpServer`; verktøyene heter `mcp__<mcpServer>__<verktøy>`. Si alltid hvilket miljø svaret kom fra.

## Slik gjør du det

1. `list_workflows`. For hver aktiv flyt: `list_workflow_executions`. Lagre svarene i en midlertidig mappe
   (`<reportsDir>/helse/raw/`, som ikke committes), ett svar per flyt: `<flytens nøkkel>.json`.
2. Oppsummer deterministisk:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/summarize-runs.mjs" <reportsDir>/helse/raw --window <vindu>
   ```
3. For de feilede: `get_workflow_execution` på den siste per flyt, og si hvilket steg som feilet og med hvilken
   melding.

## Svaret

- **Verdikt først:** grønt, gult, rødt eller UKJENT, og miljøet og vinduet det gjelder.
- **Én linje per flyt med noe å se på**, så det som krever handling, med forslag (`/helse:feilsok <flyt>`).
- **Tell opp resten** («12 flyter uten feil, 3 uten kjøringer i vinduet»).

## Regler

- **UKJENT, aldri OK, når du ikke kan se.** Mangler et verktøy for tokenet (kjøringene i produksjonen er ikke åpne
  for MCP ennå), si det, og si hva som ikke ble sett.
- Bare lese-verktøyene. Helsa endrer ingenting.
- En feil i produktet (ikke i oppsettet) meldes til Neo, og rettes ikke i oppsettet.
