---
name: datalag
description: Svarer på spørsmål om sakene i Neo - hvor mange, hvilke, hvor står saken, statushistorikken, partene og oppgavene - uten at du skriver spørringen. Bare lesing, med personens egne rettigheter. Maskerer personopplysninger i svaret og sier alltid hvilket miljø svaret kom fra.
---

# Spørsmål om sakene

## Før du starter

1. Miljøet (standard `neo.defaultEnv`). Spørsmål om ekte saker gjelder ofte produksjonen: spør hvis det ikke er sagt.
2. Slå opp MCP-serveren for miljøet før du kaller et verktøy:
   
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/neo-config.mjs" --miljo <miljø>
   ```
   
   Svaret gir `mcpServer`; verktøyene heter `mcp__<mcpServer>__<verktøy>`. Si alltid hvilket miljø svaret kom fra.

## Verktøyene

`list_cases`, `get_case`, `get_case_status_history`, `list_case_parties`, `list_case_tasks`. Bare disse.

## Slik gjør du det

1. Ett kall er normalen. Bygg på svaret bare når spørsmålet krever det, og si hvor mange kall du gjorde.
2. Vis høyst `datalag.maxRows` rader (`neo-config.mjs --get maxRows`), og tell opp resten.
3. Masker svaret før det vises:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/mask.mjs" < svar.json
   ```

## Regler

- **Bare lesing.** Kall aldri et verktøy som endrer noe, heller ikke om spørsmålet ber om det; si at det går gjennom
  `forvaltning`.
- **Personopplysninger:** vis ikke mer enn spørsmålet trenger. Fødselsnummer, telefon og e-post maskeres alltid.
  Lagre aldri et svar med personopplysninger i repoet.
- **Si hvilket miljø og når.** Et tall uten miljø er verre enn ingen tall.
