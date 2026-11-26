---
name: 05-build-config
description: Bygger konfigen til en løsning som filer i Neos eget format, fra kravene, designet, mønstrene for god konfig og skjemaet fra Neo - sakstypen med statusene, feltene og KI-oppsettet, saksdatamalene, veiviseren, oppgavene, flytene, instruksene, malene, innboksen og visningene - og skriver på hvert krav hva det ble (blir). En fil uten krav bak seg lages ikke. Bruk når designet er godkjent, og når funn fra en testrunde skal rettes i konfigen.
---

# Konfigen

Konfigen er løsningen slik Neo skal ha den, i filene Neo selv leser og skriver. Den bygges fra kravene med mønstrene,
aldri ved å kopiere dagens prosess eller et annet oppsett, og hvert krav sier hva det ble.

**Inn:** kravene, designet og `losning.yaml`, det som er felles i `felles/`, mønstrene for god konfig i
`${CLAUDE_PLUGIN_ROOT}/docs/monstre/`, og skjemaet fra Neo. **Ut:** filene i `oppsett/` i løsningen, det som er felles i
`felles/oppsett/`, og `blir` på hvert krav.

## Formatet

- **Skjemaet er Neos, og hentes:** manifestet på `GET <neo.url>/api/config/schema` gir typene, mappa per type,
  feltene nøkkelen er laget av, regelen for filnavnet og rekkefølgen filene skrives i;
  `GET <neo.url>/api/config/schema/<type>.schema.json` gir feltene i hver type. Adressen gir
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/config.mjs"`. Skjemaet kopieres aldri inn i repoet.
- **Én fil per objekt,** i mappa for typen, med filnavnet manifestet sier: `oppsett/case-types/hc-parkering.yaml`. Hver
  fil har `apiVersion`, `kind` og `spec`. Stien Neo får, er stien under `oppsett/`; om den stemmer, sier Neo i
  planen.
- **Pekere står som navn eller slug,** aldri som id. I en flyt står de som token (`ref:caseType:hc-parkering`).
- **Formen på et objekt som finnes,** gir `export_config` fra Neo. Bruk den når skjemaet alene ikke viser hvordan et
  felt fylles.
- **Det felles** står i `felles/oppsett/`: felt uten sakstype, statussett og innboks-tagger flere løsninger bruker.
  Samme objekt to steder er en feil: ett objekt i Neo, én fil.
- **Det formatet ikke har ennå,** og det som er miljø og ikke konfig (team, roller, tilgang), står i designet som et
  steg et menneske gjør i Neo, på kravet det oppfyller (`blir: { steg, hvorfor }`).

## Mønstrene

- **Grunnreglene går foran alt.** Les `grunnregler.md` først. En regel per flate som går imot dem, er feil.
- **Beslutningstabellene** øverst i hver flate avgjør de vanlige valgene (felt eller saksdata, status eller oppgave,
  flyt eller agent). Følg dem, og les regelen tabellen viser til når valget ikke er åpenbart.
- **Bryter du en regel,** skriv avviket i `design/` med regelens id og grunnen. Mangler en regel, eller er den feil,
  si det i PR-en; ikke rett den i farten.

## Slik gjør du det

1. **For hvert krav:** hvem skal lese eller handle på det, og med hvilken evne (vise, filtrere, flette, telle, bruke som
   kilde)? Hvor kan det stå så den leseren får det? Hvem skriver det der (et menneske, agenten, en flyt), og hva starter
   skrivingen? Når det finnes flere veier, avgjør mønstrene.
2. **Bygg i bølger,** fordi den neste leser det den forrige har laget. Hver type er sin egen fil, og Neo skriver dem i
   rekkefølgen manifestet gir (`applyOrder`):
   - **Først det sakstypen viser til:** saksdatamalene (`caseDataTemplate`), feltene i org-en og statussettene.
   - **Så sakstypen:** variantene, statusene, feltene og KI-oppsettet.
   - **Så resten:** oppgavemal-settene, flytene og hendelsestypene, instruksene, malene, innboks-taggene og
     relasjonsvisningene. Disse kan bygges i parallell, av hver sin agent med hver sin type, når de leser de samme
     nøklene.
   - **Sist veiviseren** (`caseWizard`): den viser til sakstypen og feltene, og skrives etter dem.
3. **Hendelsene planlegges med flytene.** Det innsikten skal telle over tid, må en flyt skrive når det skjer; en hendelse
   som ikke ble skrevet, kan ikke telles i ettertid.
4. **KI-oppsettet per sakstype** er en del av sakstypen: modellen og verktøyene agenten har (`defaultAgentModelId`,
   `defaultAgentToolIds`), KI-reglene (`aiCapabilityRules`), behandlingsregelen og saksdatainstruksene den kobler, og
   feltene der KI-en foreslår en verdi (`aiSuggestions`), hvert med et kriterium (`extractionCriterion`) for hva den skal
   se etter. Det som gjelder hele org-en (bryterne, de tillatte modellene, modellpolicyen), står i
   `felles/design/`. Et bytte av modell endrer hva saksbehandlerne får foreslått: si hva som må testes.
5. **`blir` på hvert krav:** fila i `oppsett/` (eller `felles/oppsett/`), et steg et menneske gjør i Neo, eller et ønske
   til Neo når produktet ikke har det, de to siste med hvorfor:

   ```yaml
   blir:
     - fil: oppsett/case-types/hc-parkering.yaml
     - fil: felles/oppsett/custom-fields/case-gnr.yaml
     - steg: Teamet «Parkering» settes opp i Neo
       hvorfor: Team er miljø, ikke konfig
   ```
6. **Kjør sjekken** til alt er grønt, og les det som er gult. Den validerer hver fil mot skjemaet fra Neo, ser at samme
   objekt ikke står to steder og at hver fil i `blir` finnes, og kjører mønstrene:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/sjekk.mjs" --base origin/main
   ```

## Regler

- **Hver ting har en jobb.** En fil uten krav bak seg lages ikke. Omfanget følger kravene, og et krav fra hjemmelen
  tas aldri bort for å forenkle.
- **Ikke spekuler i Neo.** Bruk bare felt og verdier skjemaet tar imot. Det Neo ikke kan, står som et gap med kravet og
  det som mangler, ikke som en vei rundt.
- **Ferdig konfigurert:** hver innstilling er Neos standard eller satt med en grunn.
- **Navn og tekst** er norsk bokmål og klarspråk, etter skrivereglene i `felles/design/` og mønstrene for navn og
  skriving.
- **Ingen hemmeligheter** i konfigen.

## Ferdig når

Hvert krav har `blir`, hver fil i `oppsett/` er det et krav ble, gapene står som ønsker til Neo på kravene, og sjekken
er grønn.
