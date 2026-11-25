# forvaltning

Oppsettet i Neo som filer i et repo, endret med PR og godkjent av kunden. Brukes i et repo laget fra
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal).

| Skill | Hva | Endrer Neo |
|---|---|---|
| `forvaltning:oppstart` | Setter opp repoet, eller skrur på en plugin til | nei |
| `forvaltning:snapshot` | Henter det som kjører, til filer | nei |
| `forvaltning:plan` | Viser forskjellen mellom repoet og det som kjører, til PR-en | nei |
| `forvaltning:gjennomfor` | Gjør en godkjent plan i sandkassen, én endring om gangen | ja, i sandkassen |
| `forvaltning:hemmeligheter` | Hvilke hemmeligheter som trengs, hvor de ligger, og om de er satt (bare navn) | nei |
| `forvaltning:env` | Viser config-fila slik pluginen leser den | nei |

Alt går gjennom Neo sin MCP-server, med personens egen innlogging. Skriptene i `scripts/` er deterministiske og
har ingen avhengigheter:

- `normalize.mjs` fjerner id-er og tidsstempler, skriver referanser med nøkkel og sorterer, så sandkasse og
  produksjon kan sammenlignes. Id-ene står i låsefila per miljø.
- `diff.mjs` lager planen: nytt, endret og fjernet, matchet på nøkkel.

- `hent-hemmeligheter.mjs` henter hemmelighetene fra kundens hvelv (Azure Key Vault, 1Password, eller manuelt) til
  `.env.local` og `.keys/`. Et menneske kjører hentingen.
- `vakt.mjs` er en hook som stopper agenten fra å lese `.env.local` og `.keys/`, og fra å kjøre hentingen.
