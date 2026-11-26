---
name: 05-build-config
description: Bygger konfigen til en løsning fra kravene, designet og mønstrene for god konfig - sakstypen, statusene, feltene og saksdataene, oppgavene, flytene, instruksene, malene, skjemaene, visningene og innsikten, og KI-oppsettet per sakstype - med sporingen fra hvert objekt til kravene det oppfyller. Et objekt uten krav bak seg lages ikke. Bruk når designet er godkjent, og når funn fra en testrunde skal rettes i konfigen.
---

# Konfigen

Konfigen er løsningen slik Neo skal ha den. Den bygges fra kravene med mønstrene, aldri ved å kopiere dagens prosess
eller et annet oppsett, og hvert objekt sier hvilke krav det er der for.

**Inn:** kravene, designet og `losning.yaml`, det som er felles i `organisasjon/`, og mønstrene for god konfig (stien
gir `node "${CLAUDE_PLUGIN_ROOT}/scripts/docs.mjs" monstre`). **Ut:** `5-oppsett/` i løsningen, og det som er felles i
`organisasjon/`, i formen repoets regler sier (`.claude/rules/`).

## Mønstrene

- **Grunnreglene går foran alt.** Les `grunnregler.md` først. En regel per flate som går imot dem, er feil.
- **Beslutningstabellene** øverst i hver flate avgjør de vanlige valgene (felt eller saksdata, status eller oppgave,
  flyt eller agent). Følg dem, og les regelen tabellen viser til når valget ikke er åpenbart.
- **Bryter du en regel,** si hvorfor i sporingen. Mangler en regel, eller er den feil, si det i PR-en; ikke rett den i
  farten.

## Slik gjør du det

1. **For hvert krav:** hvem skal lese eller handle på det, og med hvilken evne (vise, filtrere, flette, telle, bruke som
   kilde)? Hvor kan det stå så den leseren får det? Hvem skriver det der (et menneske, agenten, en flyt), og hva starter
   skrivingen? Når det finnes flere veier, avgjør mønstrene, og valget står i sporingen.
2. **Bygg i to bølger,** fordi den andre leser det den første har laget:
   - **Først sakstypen:** variantene, statusløpet, veiviseren, feltene og saksdatamalene.
   - **Så resten:** oppgavene, flytene og hendelsene, instruksene, malene, skjemaene og innboksen, visningene, innsikten
     og tilgangen. Disse kan bygges i parallell, av hver sin agent med hver sin flate, når de leser de samme nøklene.
3. **Hendelsene planlegges med flytene.** Det innsikten skal telle over tid, må en flyt skrive når det skjer; en hendelse
   som ikke ble skrevet, kan ikke telles i ettertid.
4. **KI-oppsettet per sakstype** er en del av løsningen: modellen og verktøyene agenten har, behandlingsregelen, KI-reglene
   for sakstypen, saksdatainstruksene, og feltene der KI-en foreslår en verdi eller henter den ut, hvert med et kriterium
   for hva den skal se etter. Det som gjelder hele kunden (bryterne, de tillatte modellene, modellpolicyen, innstillingene
   for metadata), står i `organisasjon/ki/`. Et bytte av modell endrer hva saksbehandlerne får foreslått: si hva som må
   testes.
5. **Sporingen:** hvert objekt sier hvilke krav det oppfyller, og hvorfor det er bygget slik når et mønster gir flere
   veier. Hvert krav får fylt ut hva det blir: objektet, eller et ønske til Neo når produktet ikke har det.
6. **Kjør repoets sjekk** til den er grønn, og les det den sier er gult.

## Regler

- **Hver ting har en jobb.** Et objekt uten krav bak seg lages ikke. Omfanget følger kravene, og et krav fra hjemmelen
  tas aldri bort for å forenkle.
- **Ikke spekuler i Neo.** Bruk bare felt og verdier Neo tar imot: sjekk mot konfigen som kjører i miljøet, eller mot
  formen i repoets regler. Det Neo ikke kan, står som et gap med kravet og det som mangler, ikke som en vei rundt.
- **Integrasjonene og postboksene en flyt bruker,** hentes fra Neo, aldri gjettet:
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/uttrekk.mjs" <mappe>` skriver `config_environment.json` med tokenet ferdig
  skrevet (`ref:integration:<app>/<navn>` i `integrationId` på noden, `ref:mailbox:<leverandør>/<adresse>` i
  `sender.integrationId`). Finnes ikke den løsningen trenger, er det noe kunden må sette opp i Neo, og det står som et
  gap.
- **Ferdig konfigurert:** hver innstilling er Neos standard eller satt med en grunn.
- **Navn og tekst** er norsk bokmål og klarspråk, etter skrivereglene i `organisasjon/skriveregler/` og mønstrene for
  navn og skriving.
- **Ingen hemmeligheter** i konfigen. En nøkkel eller et passord står som referanse til kundens hvelv.

## Ferdig når

Hvert krav har fått det det blir, hvert objekt har sporing til et krav, gapene står med krav, og sjekken er grønn.
