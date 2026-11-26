# neo-forvaltning

Neo Systems sine offentlige plugins til Claude Code: for kommuner, virksomheter og partnere som forvalter oppsettet
sitt i [Neo](https://neosystems.ai), og for den som lager Altinn-skjemaer.

**Mot Neo**: `forvaltning` og `solution` med skript mot Neo sitt API og en maskinklient i sandkassen, `monitoring` og
`data` gjennom Neo sin MCP-server med personens egen innlogging:

| Plugin | Hva |
|---|---|
| [`forvaltning`](./plugins/forvaltning) | Oppstarten, snapshot, plan og gjennomføring i sandkassen, og hemmelighetene fra kundens hvelv |
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

De som kaller Neo eller et eksternt system, leser én config-fil i repoet, `.claude/neo.config.json`: miljøene i Neo, og én del per plugin med systemets egne
miljøer (test og produksjon). Hemmelighetene står der bare som referanse til kundens hvelv.

**Dokumentasjonen** i [`docs/`](./docs), som skillene leser og kunder og partnere kan lese her:
[mønstrene for god konfig](./docs/monstre) og [oppskriftene for integrasjonene](./docs/integrasjoner).

## Kom i gang

```
/plugin marketplace add Neo-Systems-AI/neo-forvaltning
/plugin install forvaltning@neo-forvaltning
```

Resten skrus på med `/forvaltning:oppstart` i repoet, eller én og én med `/plugin install <plugin>@neo-forvaltning`.

Skal du forvalte oppsettet i Neo, start med et eget repo fra malen
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal) («Use this template», privat, i din
egen organisasjon). Malen tar inn pluginene selv.

## Hva som ligger her, og hva som ikke gjør det

- **Her:** pluginene vi deler med kunder og partnere, versjonert. En fiks her treffer alle ved neste oppdatering.
- **I malen:** strukturen, reglene og de låste versjonene for ett kunderepo. Ingen plugins og ingen innhold.
- **Ikke her:** noe om en enkelt kunde, eller det Neo Systems bruker internt.
- **Aldri her eller hos oss:** kundens hemmeligheter, klienter, sertifikater og kontoer. De er kundens, i kundens hvelv.

## Bidra

Endringer går som PR mot `main`, med `check` grønn (`node scripts/check.mjs` og `node --test "scripts/*.test.mjs"
"plugins/**/*.test.mjs"` lokalt, og `node scripts/sync-shared.mjs` etter en endring i `shared/`). Bump versjonen både i `plugin.json` og i `.claude-plugin/marketplace.json`.

## Lisens

MIT, se [`LICENSE`](./LICENSE). Digdirs skills i `plugins/altinn` har sin egen MIT-lisens i
[`plugins/altinn/LICENSE-DIGDIR`](./plugins/altinn/LICENSE-DIGDIR).
