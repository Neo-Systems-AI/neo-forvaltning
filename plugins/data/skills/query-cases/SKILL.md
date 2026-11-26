---
name: query-cases
description: Svarer på spørsmål om sakene i Neo - hvor mange, hvilke, hvor står saken, statushistorikken, partene og oppgavene - uten at du skriver spørringen. Bare lesing, med personens egne rettigheter. Maskerer personopplysninger i svaret og sier alltid hvilken org svaret kom fra.
---

# Spørsmål om sakene

## Før du starter

1. Slå opp Neo før du kaller et verktøy, og bruk verktøyene den gir. Gjelder spørsmålet en annen org enn den
   config-fila sier, si det og stopp:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/config.mjs"
   ```

## Verktøyene

`list_cases`, `get_case`, `get_case_status_history`, `list_case_parties`, `list_case_tasks`. Bare disse.

## Slik gjør du det

1. Ett kall er normalen. Bygg på svaret bare når spørsmålet krever det, og si hvor mange kall du gjorde.
2. Vis høyst så mange rader som `node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/config.mjs" data.maxRows` sier, og
   tell opp resten.
3. Masker svaret før det vises:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/mask.mjs" < svar.json
   ```

## Regler

- **Bare lesing.** Kall aldri et verktøy som endrer noe, heller ikke om spørsmålet ber om det; si at endringer
  går gjennom repoet.
- **Personopplysninger:** vis ikke mer enn spørsmålet trenger. Fødselsnummer, telefon og e-post maskeres alltid.
  Lagre aldri et svar med personopplysninger i repoet.
- **Si hvilken org og når.** Et tall uten org er verre enn ingen tall.
