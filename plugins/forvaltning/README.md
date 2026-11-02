# forvaltning

Forvaltning av oppsettet i Neo fra Claude Code. Pluginen brukes i et repo laget fra
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal), der oppsettet ligger som filer og
endres med PR.

| Skill | Hva | Endrer Neo |
|---|---|---|
| `forvaltning:snapshot` | Henter det som kjører, til filer | nei |
| `forvaltning:plan` | Viser forskjellen mellom repoet og det som kjører, til PR-en | nei |
| `forvaltning:gjennomfor` | Gjør en godkjent plan i sandkassen, én endring om gangen | ja, i sandkassen |

Alt går gjennom Neo sin MCP-server, med personens egen innlogging. Skriptene i `scripts/` er deterministiske og
har ingen avhengigheter:

- `normalize.mjs` fjerner id-er og tidsstempler, skriver referanser med nøkkel og sorterer, så sandkasse og
  produksjon kan sammenlignes. Id-ene står i låsefila per miljø.
- `diff.mjs` lager planen: nytt, endret og fjernet, matchet på nøkkel.

## Kommer senere

`helse`, `feilsok` og `rapport` kommer når Neo har en samlet liste over feil og varsling til forvalteren. Gjennomføring
fra pipelinen i GitHub kommer når Neo har en skrivevei for den.
