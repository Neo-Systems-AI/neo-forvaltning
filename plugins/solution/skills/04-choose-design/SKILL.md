---
name: 04-choose-design
description: Gjør de store valgene for en løsning fra kravene - hva den bygger på (egen eller en standard fra Neo), variantene, kanalene inn og ut, hvordan saksbehandleren ledes, hvilke integrasjoner den bruker, og hva som er felles for hele kunden - og legger dem fram med anbefaling. Valgene skrives som tilstand. Bruk når kravene er godkjent, og før oppsettet bygges.
---

# Designet

Designet er de få valgene som former alt oppsettet etterpå. Tas de underveis i byggingen, tas de ett objekt om gangen
og blir ulike. Tas de her, med personen, bygges alt etter de samme.

**Inn:** kravene, forståelsen, det som er felles, oppskriftene i `${CLAUDE_PLUGIN_ROOT}/docs/oppskrifter/` (hvordan
klossene i Neo settes sammen for behov man kjenner igjen), og mønstrene for god konfig i
`${CLAUDE_PLUGIN_ROOT}/docs/monstre/` (les `grunnregler.md` og beslutningstabellene øverst i flatene). **Ut:** `design/` i
løsningen, valgene som gjelder på tvers i `felles/design/`, og `losning.yaml` (hva løsningen bygger på og hvilke
integrasjoner den bruker).

## Valgene

| Valget | Spørsmålet |
|---|---|
| Grunnlaget | Bygger løsningen på en standardløsning fra Neo med versjon, som tilpasses, eller bygges den fra bunnen? |
| Sakene og variantene | Hva er én sak, og hva skiller variantene: én sakstype med et variantfelt, eller flere sakstyper? |
| Kanalene | Hvordan kommer saken inn (skjema, e-post, Altinn, et annet system), og hvordan går svar og dialog ut? |
| Ledingen | Hvordan ledes saksbehandleren gjennom saken: veiviseren, oppgavene, statusene? |
| Delingen av arbeidet | Hva gjør flyten, hva forbereder agenten, og hva avgjør et menneske? |
| Integrasjonene | Hvilke systemer løsningen snakker med, og hva den trenger fra hvert |
| Det felles | Hva som hører hjemme i `felles/` fordi flere løsninger bruker det: felt, statussett, innboks-tagger, KI for hele org-en, team og roller, tilgang, skrivereglene, innsikten |

## Slik gjør du det

1. **Les kravene som en helhet.** Hvilke krav trekker i hver sin retning, og hvilke valg avgjør mange krav samtidig?
2. **Finn oppskriftene som passer.** Gå gjennom «Når den passer» i oppskriftene mot kravene, og skriv i `design/` hvilke
   løsningen bygger på og hvorfor. «Grunnoppsettet for en sakstype» gjelder alltid. Et krav ingen oppskrift dekker, er
   et valg du legger fram selv. En kombinasjon som virker, og som ingen oppskrift har, foreslås som en ny oppskrift etter
   testen.
3. **Sjekk det som finnes.** Finnes en standardløsning fra Neo for prosessen, er den utgangspunktet: tilpass den, og
   bygg bare det som skiller kunden. En løsning som bygger på en standard, er en full kopi av filene med versjonen
   notert: Neo krever hele fila. Finnes noe i `felles/` alt, brukes det.
4. **Team og roller er miljø, ikke konfig.** Designet sier hvilke som trengs og hva de skal kunne; et menneske setter
   dem opp i Neo.
5. **Legg fram hvert valg** med alternativene, hvilke krav hvert av dem dekker og hva det koster (for saksbehandleren,
   for kunden og for oppsettet), og anbefalingen. Et valg som bryter en grunnregel, sier hvorfor.
6. **Skriv valgene som tilstand** i `design/`: valget, hvorfor, og kravene det dekker. Det som er avgjort, står der det
   gjelder; diskusjonen står i PR-en. **Et avvik fra en regel i mønstrene** er et item med regelens id og grunnen, så
   sjekken ikke melder det på nytt:

   ````markdown
   ## to-sakstyper To sakstyper med samme navn i overgangen

   ```yaml
   avvik: navn-er-nokkelen
   fil: case-types/parkering.yaml     # når avviket gjelder én fil i oppsett/
   grunn: Den gamle og den nye står side om side til de gamle sakene er avsluttet.
   ```
   ````
7. **Oppdater `losning.yaml`** med grunnlaget (`bygger-pa`: egen, eller en standardløsning med versjon) og
   integrasjonene. Grunnlaget kreves når løsningen går ut av `utkast`. En integrasjon løsningen bruker, får sin mappe i
   `integrasjoner/` om den ikke finnes.

## Regler

- **Fra kravene, ikke fra dagens prosess.** Et valg som bare gjenskaper hvordan det gjøres i dag, trenger et krav bak
  seg.
- **I et repo for standardløsninger** er det ingen kunde: `felles/` er det flere standardløsninger deler, og har ikke
  `kilder/` eller `forstaelse/`. Et felles valg bygger på kravene i `felles/krav/`, som viser til forståelsen i en
  løsning.
- **Neos standard holder** der kravene ikke sier noe annet. Et avvik fra standarden er et valg som skal begrunnes.
- **Det som ikke har en form i Neo, finnes ikke i repoet.** Et steg et menneske gjør i Neo, står i kravet det
  oppfyller (`blir: { steg, hvorfor }`), ikke i en egen fil.
- **Ikke spekuler i hva Neo kan.** Er du usikker på om Neo har noe, sjekk det i miljøet eller dokumentasjonen, eller
  skriv valget med forbeholdet.

## Personen avgjør

Designvalgene. Ett om gangen eller samlet, nummerert, med anbefalingen først.

## Ferdig når

Hvert valg i tabellen er tatt eller sagt at ikke gjelder, hvert krav er dekket av valgene eller står åpent med en grunn,
og `losning.yaml` sier hva løsningen bygger på og hvilke integrasjoner den bruker.
