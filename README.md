# neo-forvaltning

Neo Systems sine offentlige plugins til Claude Code: for kommuner, virksomheter og partnere som forvalter oppsettet
sitt i [Neo](https://neosystems.ai), og for den som lager Altinn-skjemaer.

**Mot Neo**: `forvaltning` og `solution` med skript mot Neo sitt API og en maskinklient i sandkassen, `monitoring` og
`data` gjennom Neo sin MCP-server med personens egen innlogging:

| Plugin | Hva |
|---|---|
| [`forvaltning`](./plugins/forvaltning) | Repoet og veien inn og ut av Neo: oppstarten med maskinklienten i sandkassen, snapshot, planen for alle filene samlet og gjennomføringen etter merge med skript mot Neo sitt API, config-fila for alle pluginene, hemmelighetene som referanser til hvelvet, og sjekken av repoet |
| [`solution`](./plugins/solution) | Løypa fra en idé til en løsning som er testet i UI og gitt til kunden: research, krav, design, konfig i Neos format i `oppsett/`, testene og funnene, og gjennomgangen av konfigen mot mønstrene |
| [`monitoring`](./plugins/monitoring) | Flytene og kjøringene i et tidsvindu, og feilsøk av én kjøring |
| [`data`](./plugins/data) | Spørsmål om sakene, bare lesing, med personopplysninger maskert |

**Mot de eksterne systemene**, rå lese-kall til feilsøk: hva sier systemet selv, mot hva Neo gjorde:

| Plugin | Hva |
|---|---|
| [`maskinporten`](./plugins/maskinporten) | Token for kundens klienter: hva ble innvilget, og hvorfor ikke |
| [`fiks`](./plugins/fiks) | KS Fiks: SvarUt, SvarInn og Folkeregisteret |
| [`documaster`](./plugins/documaster) | Arkivet: arkivdeler, mapper, registreringer og dokumenter |
| [`altinn`](./plugins/altinn) | Altinn Studio-apper: Digdirs skills, publiseringen, og instanser, prosess og hendelser |
| [`krr`](./plugins/krr) | Kontakt- og reservasjonsregisteret |
| [`enhetsregisteret`](./plugins/enhetsregisteret) | Enheter og underenheter |

**Oppsett i kundens egne systemer**, med kommandoene et menneske kjører selv:

| Plugin | Hva |
|---|---|
| [`entra`](./plugins/entra) | Microsoft-tenanten: SSO og SCIM med Entra ID, og en felles postboks fra Exchange Online |

De som kaller Neo eller et eksternt system, leser én config-fil i kunderepoet, `.claude/neo.config.json`: miljøene i Neo
(sandkassen og produksjonen, med adressen for hvert, maskinklienten i sandkassen og MCP-serveren for `monitoring` og
`data`) og én del per plugin. Fila har ingen hemmeligheter: referansene til hvelvet står ved siden av
oppsettet av systemet, under `<system>.hemmeligheter`, og skriptene henter verdien fra hvelvet for kjøringen,
med personens egen innlogging. Ingen kopi lagres lokalt; i CI settes variabelen fra jobbens hemmeligheter. Fila er JSON, så ingen plugin trenger en YAML-leser for å kalle et system.

**Dokumentasjonen** står i pluginen som bruker den (`plugins/<plugin>/docs/`), så den følger pluginens versjon.
Inngangen er [`docs/`](./docs/README.md): mønstrene for god konfig og oppskriftene for integrasjonene.

## Kom i gang

```
/plugin marketplace add Neo-Systems-AI/neo-forvaltning
/plugin install forvaltning@neo-forvaltning
```

Skal du forvalte oppsettet i Neo, start med et eget, privat repo fra malen
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal), i din egen organisasjon: en kopi av
malens filer i et tomt repo, med første push av en org-admin. `/forvaltning:oppstart` viser hvordan, og skrur på
resten av pluginene.

## Sjekken av et kunderepo

Én sjekk, ett sted. Kilden står i [`check/`](./check), med `yaml` (den Neo bruker) låst i `check/package.json`, og er
bygget til én fil uten avhengigheter: `plugins/forvaltning/scripts/sjekk.mjs`. Pluginen kjører den lokalt, og malens CI
henter den samme fila i en låst versjon. Malen har ingen egen kopi av logikken.

Sjekken vurderer ikke innholdet i konfigfilene: den ser at filene i `oppsett/` og `snapshots/` er Neos filer
(`apiVersion: neo-config/v1`, `kind` og `spec`), og Neo vurderer innholdet i planen. Den sjekker
strukturen for typen i `kunde.yaml`, config-fila med sandkassen og produksjonen, kildene på endringen, påstandene i
forståelsen, kravene og `blir`, personaene, testene og testplanen, og avvikene i `design/`.

Versjonen står i `check/package.json` (`node sjekk.mjs --versjon`). Malen låser sjekken til commiten der fila er bygget,
og kontrollerer sha256, fordi kunderepoene ligger på GitHub Enterprise og dette repoet på github.com, og et kall på
tvers ikke kan bruke en action fra dette repoet:

```yaml
- name: Hent sjekken
  env:
    REF: "<commiten i neo-forvaltning>"
    SHA256: "<sha256 for fila i commiten>"
  run: |
    curl -fsSL "https://raw.githubusercontent.com/Neo-Systems-AI/neo-forvaltning/$REF/plugins/forvaltning/scripts/sjekk.mjs" -o "$RUNNER_TEMP/sjekk.mjs"
    echo "$SHA256  $RUNNER_TEMP/sjekk.mjs" | sha256sum -c -
- name: Sjekken
  env:
    BASE: ${{ github.event_name == 'pull_request' && format('origin/{0}', github.base_ref) || github.event.before }}
  run: |
    # Første push i et nytt repo har ingen forrige commit: da er det ingen endring å sammenligne kildene med.
    git cat-file -e "$BASE^{commit}" 2>/dev/null || BASE=HEAD
    node "$RUNNER_TEMP/sjekk.mjs" --base "$BASE" --annotate --summary
```

Sjekken leser historikken til basen, så `actions/checkout` trenger `fetch-depth: 0`.

Sha256 for fila i en commit: `curl -fsSL <adressen> | shasum -a 256`. En ny versjon tas inn i malen med en PR som
bytter begge verdiene, i `.github/workflows/check.yml` og i `.claude/method.json`.

```bash
node sjekk.mjs [--base <ref>] [--annotate] [--summary] [--json]   # hele sjekken; rødt gir exit 1, gult står
node sjekk.mjs hos-kunden                                         # lista over det kunden må gjøre (committes ikke)
node sjekk.mjs --versjon
```

`--base` er det endringen sammenlignes med når sjekken ser at ingen lagret kilde er endret: grenen PR-en skal inn i,
og `HEAD` før det finnes noe å sammenligne med. Uten basen er det rødt, ikke hoppet over.

## Hva som ligger her, og hva som ikke gjør det

- **Her:** pluginene vi deler med kunder og partnere, versjonert, og sjekken av et kunderepo. En fiks her treffer alle
  ved neste oppdatering.
- **I malen:** strukturen og reglene for ett kunderepo, og CI som henter sjekken. Ingen plugins, ingen sjekk-logikk og
  ikke noe innhold.
- **Ikke her:** noe om en enkelt kunde, eller det Neo Systems bruker internt.
- **Aldri her eller hos oss:** kundens hemmeligheter, klienter, sertifikater og kontoer. De er kundens, i kundens hvelv.

## Bidra

Endringer går som PR mot `main`, med `check` grønn. Lokalt:

```bash
node --test "scripts/*.test.mjs" "shared/*.test.mjs" "plugins/**/*.test.mjs"
node scripts/check.mjs
(cd check && npm ci && node --test && node build.mjs --check)
```

Etter en endring i `shared/`: `node scripts/sync-shared.mjs`. Etter en endring i `check/`: `node check/build.mjs`, og
bump versjonen i `check/package.json`. Bump versjonen til en plugin både i `plugin.json` og i
`.claude-plugin/marketplace.json`; beskrivelsen står bare i `plugin.json`.

## Lisens

MIT, se [`LICENSE`](./LICENSE). Digdirs skills i `plugins/altinn` har sin egen MIT-lisens i
[`plugins/altinn/LICENSE-DIGDIR`](./plugins/altinn/LICENSE-DIGDIR).
