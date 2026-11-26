---
name: 05-build-config
description: Bygger konfigen til en løsning som filer i Neos eget format i oppsett/, i rekkefølgen Neo gir, fra kravene, designet, mønstrene for god konfig og skjemaet fra Neo - sakstypen med statusene, feltene og KI-oppsettet, saksdatamalene, veiviseren, oppgavene, flytene, instruksene, malene, innboksen og visningene - og skriver på hvert krav hva det ble (blir). En fil uten krav bak seg lages ikke. Bruk når designet er godkjent, og når funn fra en testrunde skal rettes i konfigen.
---

# Konfigen

Konfigen er løsningen slik Neo skal ha den, i filene Neo selv leser og skriver. Den bygges fra kravene med mønstrene,
aldri ved å kopiere dagens prosess eller et annet oppsett, og hvert krav sier hva det ble.

**Inn:** kravene, designet og `losning.yaml`, det som er felles i `felles/`, mønstrene for god konfig i
`${CLAUDE_PLUGIN_ROOT}/docs/monstre/`, skjemaet fra Neo, og det som alt står i `oppsett/`. **Ut:** filene i `oppsett/`
i roten av repoet, og `blir` på hvert krav.

## Formatet

- **Skjemaet er Neos, og hentes:** manifestet på `GET <url>/api/config/schema` gir typene, mappa per type, feltene
  nøkkelen er laget av, regelen for filnavnet og rekkefølgen filene skrives i (`applyOrder`);
  `GET <url>/api/config/schema/<type>.schema.json` gir feltene i hver type. Adressen til sandkassen gir
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/neo-config.mjs" --get url`. Skjemaet kopieres aldri inn i repoet.
- **Konfigen står i `oppsett/` i roten,** som Neo eksporterer den: én fil per objekt, i mappa for typen, med filnavnet
  manifestet sier: `oppsett/case-types/hc-parkering.yaml`. Hver fil har `apiVersion: neo-config/v1`, `kind` og `spec`.
  Stien Neo får, er stien under `oppsett/`; om den stemmer, sier Neo i planen. En løsning har ingen egen `oppsett/`.
- **Pekere står som navn eller slug,** aldri som id. I en flyt står de som token (`ref:caseType:hc-parkering`).
- **Formen på et objekt som finnes,** står i snapshotet av sandkassen (`snapshots/sandkasse/`). Bruk det når
  skjemaet alene ikke viser hvordan et felt fylles.
- **Det flere løsninger bruker** (felt uten sakstype, statussett, innboks-tagger) er én fil i `oppsett/`, og kravene i
  `felles/krav/` peker på den. Ett objekt i Neo, én fil.
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
2. **Skriv filene i rekkefølgen Neo gir** (`applyOrder` i manifestet), fordi en fil peker på det som står før den i
   rekkefølgen, og Neo planlegger og skriver dem i den rekkefølgen. Hent rekkefølgen fra manifestet hver gang; den er
   ikke kopiert hit. Typer som ikke peker på hverandre, kan bygges i parallell, av hver sin agent med hver sin type,
   når de leser de samme nøklene. En fil som peker på noe som ikke er i `oppsett/` og ikke finnes i sandkassen, kan
   ikke planlegges.
3. **Hendelsene planlegges med flytene.** Det innsikten skal telle over tid, må en flyt skrive når det skjer; en hendelse
   som ikke ble skrevet, kan ikke telles i ettertid.
4. **KI-oppsettet per sakstype** er en del av sakstypen: modellen og verktøyene agenten har (`defaultAgentModelId`,
   `defaultAgentToolIds`), KI-reglene (`aiCapabilityRules`), behandlingsregelen og saksdatainstruksene den kobler, og
   feltene der KI-en foreslår en verdi (`aiSuggestions`), hvert med et kriterium (`extractionCriterion`) for hva den skal
   se etter. Det som gjelder hele org-en (bryterne, de tillatte modellene, modellpolicyen), står i
   `felles/design/`. Et bytte av modell endrer hva saksbehandlerne får foreslått: si hva som må testes.
5. **`blir` på hvert krav:** fila i `oppsett/`, fra roten, et steg et menneske gjør i Neo, eller et ønske til Neo når
   produktet ikke har det, de to siste med hvorfor. Det Neo ikke skriver som fil ennå, er et steg, og beskrives i
   `oppsett/manuelt/`:

   ```yaml
   blir:
     - fil: oppsett/case-types/hc-parkering.yaml
     - fil: oppsett/custom-fields/case-gnr.yaml
     - steg: Teamet «Parkering» settes opp i Neo
       hvorfor: Team er miljø, ikke konfig
   ```
6. **Kjør sjekken av repoet** (`check` i `.claude/method.json`) til alt er grønt, og les det som er gult. Den ser at
   hver fil i `oppsett/` er Neos fil og at hver fil i `blir` finnes. Om innholdet er gyldig, sier Neo i planen.

## Regler

- **Hver ting har en jobb.** En fil uten krav bak seg lages ikke. Omfanget følger kravene, og et krav fra hjemmelen
  tas aldri bort for å forenkle.
- **Ikke spekuler i Neo.** Bruk bare felt og verdier Neo tar imot: sjekk mot konfigen som kjører i miljøet, eller mot
  formen i repoets regler. Det Neo ikke kan, står som et gap med kravet og det som mangler, ikke som en vei rundt.
- **Integrasjonene og postboksene en flyt bruker,** hentes fra Neo, aldri gjettet:
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/uttrekk.mjs" <mappe>` skriver `config_environment.json` med tokenet ferdig
  skrevet (`ref:integration:<app>/<navn>` i `integrationId` på noden, `ref:mailbox:<leverandør>/<adresse>` i
  `sender.integrationId`). Finnes ikke den løsningen trenger, er det noe kunden må sette opp i Neo, og det står som et
  gap.
- **Ferdig konfigurert:** hver innstilling er Neos standard eller satt med en grunn.
- **Navn og tekst** er norsk bokmål og klarspråk, etter skrivereglene i `felles/design/` og mønstrene for navn og
  skriving.
- **Ingen hemmeligheter** i konfigen.

## Ferdig når

Hvert krav har `blir`, hver fil løsningen har i `oppsett/` er det et krav ble, gapene står som ønsker til Neo på
kravene, og sjekken er grønn.
