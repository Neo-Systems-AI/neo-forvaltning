---
name: plan
description: Viser hva som er nytt, endret og fjernet i det ønskede oppsettet i repoet (oppsett/) mot det som kjører i Neo, så kunden kan godkjenne endringen i en PR før den gjennomføres. Bare lesing. Kjør på en branch med endringen, og legg planen i PR-en.
---

# Planen

Planen er det kunden godkjenner. Den skal kunne leses av den som eier prosessen, ikke bare av den som har gjort
endringen.

## Slik gjør du det

1. Ta et ferskt snapshot av miljøet planen gjelder (`/forvaltning:snapshot`), så planen er mot det som kjører nå.
2. Lag planen:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/diff.mjs" oppsett snapshots/<miljø>/oppsett > reports/plan-<miljø>.md
   ```
3. Skriv over tabellen, i klartekst og per sakstype: hva endres, hvorfor (lenke til raden i `beslutninger.md`), og
   hva saksbehandlerne vil merke.
4. For hver endring: hvilket MCP-verktøy som gjør den (`create_case_type`, `update_case_status`, `add_custom_field_to_case_type`
   og så videre). En endring uten verktøy merkes **manuelt** med hvor i Neo den gjøres.
5. `ikke-styrt` betyr at noe kjører som repoet ikke styrer ennå. Det er ikke en feil, men nevn det.
6. Legg planen i PR-beskrivelsen. Godkjenningen av PR-en er kundens godkjenning av endringen.

## Regler

- Planen endrer ingenting. Den kaller bare lese-verktøyene.
- En fjerning i planen er alltid et spørsmål til kunden, aldri noe som tas med stille.
