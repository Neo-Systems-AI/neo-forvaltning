---
name: 04-choose-design
description: Gjør de store valgene for en løsning fra kravene - hva den bygger på (egen eller en standard fra Neo), variantene, kanalene inn og ut, hvordan saksbehandleren ledes, hvilke integrasjoner den bruker, og hva som er felles for hele kunden - og legger dem fram med anbefaling. Valgene skrives som tilstand. Bruk når kravene er godkjent, og før oppsettet bygges.
---

# Designet

Designet er de få valgene som former alt oppsettet etterpå. Tas de underveis i byggingen, tas de ett objekt om gangen
og blir ulike. Tas de her, med personen, bygges alt etter de samme.

**Inn:** kravene, forståelsen, det som gjelder hele kunden, og mønstrene for god konfig i
`${CLAUDE_PLUGIN_ROOT}/docs/monstre/` (les `grunnregler.md` og beslutningstabellene øverst i flatene). **Ut:** `4-design/`
i løsningen, valgene som gjelder på tvers i `organisasjon/4-design/`, og `losning.yaml` (hva løsningen bygger på og
hvilke integrasjoner den bruker).

## Valgene

| Valget | Spørsmålet |
|---|---|
| Grunnlaget | Bygger løsningen på en standardløsning fra Neo med versjon, som tilpasses, eller bygges den fra bunnen? |
| Sakene og variantene | Hva er én sak, og hva skiller variantene: én sakstype med et variantfelt, eller flere sakstyper? |
| Kanalene | Hvordan kommer saken inn (skjema, e-post, Altinn, et annet system), og hvordan går svar og dialog ut? |
| Ledingen | Hvordan ledes saksbehandleren gjennom saken: veiviseren, oppgavene, statusene? |
| Delingen av arbeidet | Hva gjør flyten, hva forbereder agenten, og hva avgjør et menneske? |
| Integrasjonene | Hvilke systemer løsningen snakker med, og hva den trenger fra hvert |
| Det felles | Hva som hører hjemme i `organisasjon/` fordi flere løsninger bruker det: felt, statussett, innboks-tagger, KI for hele org-en, team og roller, tilgang, skrivereglene, innsikten |

## Slik gjør du det

1. **Les kravene som en helhet.** Hvilke krav trekker i hver sin retning, og hvilke valg avgjør mange krav samtidig?
2. **Sjekk det som finnes.** Finnes en standardløsning fra Neo for prosessen, er den utgangspunktet: tilpass den, og
   bygg bare det som skiller kunden. Finnes noe i `organisasjon/` alt, brukes det.
3. **Team og roller er miljø, ikke konfig.** Designet sier hvilke som trengs og hva de skal kunne; et menneske setter
   dem opp i Neo.
4. **Legg fram hvert valg** med alternativene, hvilke krav hvert av dem dekker og hva det koster (for saksbehandleren,
   for kunden og for oppsettet), og anbefalingen. Et valg som bryter en grunnregel, sier hvorfor.
5. **Skriv valgene som tilstand** i `4-design/`: valget, hvorfor, og kravene det dekker. Det som er avgjort, står der
   det gjelder; diskusjonen står i PR-en.
6. **Oppdater `losning.yaml`** med grunnlaget (`bygger-pa`: egen, eller en standardløsning med versjon) og
   integrasjonene. Grunnlaget kreves når løsningen går ut av `utkast`. En integrasjon løsningen bruker, får sin mappe i
   `integrasjoner/` om den ikke finnes.

## Regler

- **Fra kravene, ikke fra dagens prosess.** Et valg som bare gjenskaper hvordan det gjøres i dag, trenger et krav bak
  seg.
- **Neos standard holder** der kravene ikke sier noe annet. Et avvik fra standarden er et valg som skal begrunnes.
- **Ikke spekuler i hva Neo kan.** Er du usikker på om Neo har noe, sjekk det i miljøet eller dokumentasjonen, eller
  skriv valget med forbeholdet.

## Personen avgjør

Designvalgene. Ett om gangen eller samlet, nummerert, med anbefalingen først.

## Ferdig når

Hvert valg i tabellen er tatt eller sagt at ikke gjelder, hvert krav er dekket av valgene eller står åpent med en grunn,
og `losning.yaml` sier hva løsningen bygger på og hvilke integrasjoner den bruker.
