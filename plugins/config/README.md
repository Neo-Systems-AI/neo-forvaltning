# config

Repoet og konfigen inn og ut av Neo. Konfigen står som filer i Neos eget format i repoet, endres med PR, og skrives
til sandkassen når godkjenneren har sagt ja. Brukes i et repo laget fra
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal).

| Skill | Hva | Endrer Neo |
|---|---|---|
| `config:set-up-repo` | Lager og setter opp repoet, eller skrur på en plugin til | nei |
| `config:fetch-config` | Henter konfigen fra en org som filer inn i repoet | nei |
| `config:plan-change` | Formen, mønstrene og planen per fil mot sandkassen, i klartekst i PR-en | nei |
| `config:apply-change` | Skriver en godkjent plan til sandkassen, fil for fil | ja, i sandkassen |
| `config:show-secrets` | Hvilke hemmeligheter repoet trenger, hvor de ligger, og om de er satt (bare navn) | nei |
| `config:check-setup` | Hva hver plugin som er på, trenger i config-fila, og MCP-serveren per miljø | nei |

## Veien inn og ut

Filene er Neos format, uendret: én fil per objekt, i mappa for typen, navngitt etter nøkkelen
(`case-types/hc-parkering.yaml`), under en løsnings `5-oppsett/` eller `organisasjon/5-oppsett/`. Stien Neo får, er
stien under `5-oppsett/`. Formatet og skjemaet er Neos, på `GET <adressen>/api/config/schema` (åpent).

1. **Formen:** `check` i repoet validerer hver fil mot skjemaet, og `konfigfiler.mjs` stiene og nøklene.
2. **Kvaliteten:** mønstrene for god konfig (`rules.mjs` i `solution`).
3. **Virkningen:** `plan_config` per fil i rekkefølgen Neo gir, og `config_not_in_files` for det som er i Neo uten fil.
   Planen står i PR-en.
4. **Skrivingen:** `apply_config` per fil med `planHash`, bare mot en sandkasse. Promoteringen gjør et menneske i Neo.

Alt går gjennom Neos MCP-server, med personens egen innlogging. Miljøet er `development`, med en org som har en
sandkasse.

## Skriptene

Deterministiske, uten avhengigheter:

| Skript | Hva |
|---|---|
| `scripts/lib/konfigfiler.mjs` | Konfigfilene i repoet med stien Neo skal ha, i rekkefølgen for apply; stopper når samme nøkkel står to steder |
| `scripts/lib/mcp-server.mjs` | MCP-serveren, adressen og org-en for et miljø, og om serveren er lagt til i repoet |
| `scripts/lib/yaml.mjs` | YAML-leseren skriptene bruker |
| `scripts/check-setup.mjs` | Hva hver plugin som er på, leser fra `.claude/neo.config.json`, og hva som mangler |
| `scripts/hent-hemmeligheter.mjs` | Hemmelighetene fra hvelvet til `.env.local` og `.keys/`. Et menneske kjører hentingen |
| `scripts/vakt.mjs` | Hooken som stopper agenten fra å lese `.env`, `.env.*` og `.keys/`, og fra å kjøre hentingen |

## Dokumentasjonen

| Fil | Hva |
|---|---|
| [`docs/hvelvet.md`](docs/hvelvet.md) | Hvelvet: oppgavene, navnene, og formen på referansene i repoet |
| [`docs/esignering.md`](docs/esignering.md) | eSignering hos Digdir |

## Config

`config` leser bare den felles delen av `.claude/neo.config.json`: miljøene, og MCP-serveren, adressen og org-en per
miljø. Ingen hemmeligheter.
