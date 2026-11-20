# data

Spørsmål om sakene i Neo, gjennom Neo sin MCP-server med personens egne rettigheter. Bare lesing.

| Skill | Hva |
|---|---|
| `data:query-cases` | Svar på et spørsmål om sakene, maskert, med miljøet |
| `data:env` | Config-fila slik pluginen leser den |

`scripts/mask.mjs` maskerer fødselsnummer (med kontrollsiffer), telefonnummer og e-post. Skru på pluginen bare når
kunden vil det: den leser saker med personopplysninger.

## Config

| Nøkkel | Standard | Hva |
|---|---|---|
| `data.maxRows` | `50` | Flest rader pluginen viser i ett svar |
