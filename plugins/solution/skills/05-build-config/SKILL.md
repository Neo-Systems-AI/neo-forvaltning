---
name: 05-build-config
description: Bygger konfigen til en løsning som filer i Neos eget format, fra kravene, designet, mønstrene for god konfig og skjemaet fra Neo - sakstypen med statusene, feltene, veiviseren og KI-oppsettet, oppgavene, flytene, instruksene, malene, innboksen og visningene - med spor.yaml som sier hvilke krav hver fil oppfyller. En fil uten krav bak seg lages ikke. Bruk når designet er godkjent, og når funn fra en testrunde skal rettes i konfigen.
---

# Konfigen

Konfigen er løsningen slik Neo skal ha den, i filene Neo selv leser og skriver. Den bygges fra kravene med mønstrene,
aldri ved å kopiere dagens prosess eller et annet oppsett, og hver fil sier hvilke krav den er der for.

**Inn:** kravene, designet og `losning.yaml`, det som er felles i `organisasjon/`, mønstrene for god konfig i
`${CLAUDE_PLUGIN_ROOT}/docs/monstre/`, og skjemaet fra Neo. **Ut:** filene i `5-oppsett/` i løsningen med `spor.yaml`,
og det som er felles i `organisasjon/5-oppsett/`.

## Formatet

- **Skjemaet er Neos, og hentes:** manifestet på `GET <adressen>/api/config/schema` gir typene, mappa per type,
  feltene nøkkelen er laget av, og rekkefølgen filene skrives i; `GET <adressen>/api/config/schema/<type>.schema.json`
  gir feltene i hver type. Adressen gir `node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/mcp-server.mjs"`. Skjemaet kopieres
  aldri inn i repoet.
- **Én fil per objekt,** i mappa for typen og navngitt etter nøkkelen: `5-oppsett/case-types/hc-parkering.yaml`. Hver
  fil har `apiVersion`, `kind` og `spec`. Stien Neo får, er stien under `5-oppsett/`.
- **Pekere står som navn eller slug,** aldri som id. I en flyt står de som token (`ref:caseType:hc-parkering`).
- **Formen på et objekt som finnes,** gir `export_config` fra Neo. Bruk den når skjemaet alene ikke viser hvordan et
  felt fylles.
- **Det felles** står i `organisasjon/5-oppsett/`: felt uten sakstype, statussett og innboks-tagger flere løsninger
  bruker. Samme nøkkel to steder er en feil: ett objekt i Neo, én fil.
- **Det formatet ikke har ennå,** og det som er miljø og ikke konfig (team, roller, tilgang), står i designet som et
  steg et menneske gjør i Neo, med kravet det oppfyller.

## Mønstrene

- **Grunnreglene går foran alt.** Les `grunnregler.md` først. En regel per flate som går imot dem, er feil.
- **Beslutningstabellene** øverst i hver flate avgjør de vanlige valgene (felt eller saksdata, status eller oppgave,
  flyt eller agent). Følg dem, og les regelen tabellen viser til når valget ikke er åpenbart.
- **Bryter du en regel,** si hvorfor i `spor.yaml`. Mangler en regel, eller er den feil, si det i PR-en; ikke rett den i
  farten.

## Slik gjør du det

1. **For hvert krav:** hvem skal lese eller handle på det, og med hvilken evne (vise, filtrere, flette, telle, bruke som
   kilde)? Hvor kan det stå så den leseren får det? Hvem skriver det der (et menneske, agenten, en flyt), og hva starter
   skrivingen? Når det finnes flere veier, avgjør mønstrene, og valget står i `spor.yaml`.
2. **Bygg i to bølger,** fordi den andre leser det den første har laget:
   - **Først sakstypen:** variantene, statusene, veiviseren, feltene og saksdatamalene.
   - **Så resten:** oppgavemal-settene, flytene og hendelsestypene, instruksene, malene, innboks-taggene og
     relasjonsvisningene. Disse kan bygges i parallell, av hver sin agent med hver sin type, når de leser de samme
     nøklene.
3. **Hendelsene planlegges med flytene.** Det innsikten skal telle over tid, må en flyt skrive når det skjer; en hendelse
   som ikke ble skrevet, kan ikke telles i ettertid.
4. **KI-oppsettet per sakstype** er en del av sakstypen: modellen og verktøyene agenten har (`defaultAgentModelId`,
   `defaultAgentToolIds`), KI-reglene (`aiCapabilityRules`), behandlingsregelen og saksdatainstruksene den kobler, og
   feltene der KI-en foreslår en verdi (`aiSuggestions`), hvert med et kriterium (`extractionCriterion`) for hva den skal
   se etter. Det som gjelder hele org-en (bryterne, de tillatte modellene, modellpolicyen), står i
   `organisasjon/4-design/`. Et bytte av modell endrer hva saksbehandlerne får foreslått: si hva som må testes.
5. **`spor.yaml`:** for hver fil, kravene den oppfyller, og hvorfor den er bygget slik når et mønster gir flere veier.
   Hvert krav får fylt ut hva det blir: fila, et steg i Neo, eller et ønske til Neo når produktet ikke har det.
6. **Sjekk filene** til alt er grønt, og les det som er gult:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/konfigfiler.mjs"     # stiene, nøklene og rekkefølgen, mot manifestet fra Neo
   node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs"               # mønstrene som kan sjekkes maskinelt
   ```

   Kjør også repoets sjekk, som validerer hver fil mot skjemaet.

## Regler

- **Hver ting har en jobb.** En fil uten krav bak seg lages ikke. Omfanget følger kravene, og et krav fra hjemmelen
  tas aldri bort for å forenkle.
- **Ikke spekuler i Neo.** Bruk bare felt og verdier skjemaet tar imot. Det Neo ikke kan, står som et gap med kravet og
  det som mangler, ikke som en vei rundt.
- **Ferdig konfigurert:** hver innstilling er Neos standard eller satt med en grunn.
- **Navn og tekst** er norsk bokmål og klarspråk, etter skrivereglene i `organisasjon/4-design/` og mønstrene for
  navn og skriving.
- **Ingen hemmeligheter** i konfigen.

## Ferdig når

Hvert krav har fått det det blir, hver fil står i `spor.yaml`, gapene står med krav, og sjekkene er grønne.
