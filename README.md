# neo-forvaltning

Neo Systems sine offentlige plugins til Claude Code: for kommuner, virksomheter og partnere som forvalter oppsettet
sitt i [Neo](https://neosystems.ai), og for den som lager Altinn-skjemaer.

**Mot Neo**, gjennom Neo sin MCP-server med personens egen innlogging:

| Plugin | Hva |
|---|---|
| [`config`](./plugins/config) | Repoet og konfigen inn og ut av Neo: oppsettet, hentingen som filer i Neos format, planen og skrivingen til sandkassen, hemmelighetene fra hvelvet, og sjekken av oppsettet |
| [`solution`](./plugins/solution) | Løpet fra en idé til en løsning som er testet i UI og gitt til kunden: research, krav, design, konfig med KI-oppsettet, testene og funnene, og gjennomgangen av konfigen mot mønstrene |
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

**Oppsett i kundens egne systemer**, steg for steg, med kommandoene et menneske kjører selv:

| Plugin | Hva |
|---|---|
| [`entra`](./plugins/entra) | Microsoft-tenanten: SSO og SCIM med Entra ID, og en felles postboks fra Exchange Online |

De som kaller Neo eller et eksternt system, leser én config-fil i repoet, `.claude/neo.config.json`: miljøet i Neo med
MCP-serveren, adressen og org-en, og én del per plugin med systemets egne miljøer (test og produksjon). Fila har ingen
hemmeligheter; referansene til hvelvet står i kunderepoet der de brukes.

**Dokumentasjonen** står i pluginen som bruker den (`plugins/<plugin>/docs/`), så den følger pluginens versjon.
Inngangen er [`docs/`](./docs/README.md): mønstrene for god konfig og oppskriftene for integrasjonene.

## Kom i gang

```
/plugin marketplace add Neo-Systems-AI/neo-forvaltning
/plugin install config@neo-forvaltning
```

Resten skrus på med `/config:set-up-repo` i repoet, eller én og én med `/plugin install <plugin>@neo-forvaltning`.

Skal du forvalte oppsettet i Neo, start med et eget, privat repo fra malen
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal), i din egen organisasjon: en kopi av
malens filer i et tomt repo, med første push av en org-admin (`/config:set-up-repo` viser hvordan). Malen tar inn
pluginene selv.

## Hva som ligger her, og hva som ikke gjør det

- **Her:** pluginene vi deler med kunder og partnere, versjonert. En fiks her treffer alle ved neste oppdatering.
- **I malen:** strukturen og reglene for ett kunderepo. Ingen plugins og ingen innhold.
- **Ikke her:** noe om en enkelt kunde, eller det Neo Systems bruker internt.
- **Aldri her eller hos oss:** kundens hemmeligheter, klienter, sertifikater og kontoer. De er kundens, i kundens hvelv.

## Bidra

Endringer går som PR mot `main`, med `check` grønn (`node scripts/check.mjs` og `node --test "scripts/*.test.mjs" "shared/**/*.test.mjs"
"plugins/**/*.test.mjs"` lokalt, og `node scripts/sync-shared.mjs` etter en endring i `shared/`). Bump versjonen både i `plugin.json` og i `.claude-plugin/marketplace.json`.

## Lisens

MIT, se [`LICENSE`](./LICENSE). Digdirs skills i `plugins/altinn` har sin egen MIT-lisens i
[`plugins/altinn/LICENSE-DIGDIR`](./plugins/altinn/LICENSE-DIGDIR).
