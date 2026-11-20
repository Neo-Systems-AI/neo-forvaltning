---
name: 04-choose-design
description: Gjør de store valgene for en løsning fra kravene - hva den bygger på (egen eller en standard fra Neo), variantene, kanalene inn og ut, hvordan saksbehandleren ledes, hvilke integrasjoner den bruker, og hva som er felles for hele kunden - og legger dem fram med anbefaling. Valgene skrives som tilstand. Bruk når kravene er godkjent, og før oppsettet bygges.
---

# Designet

Designet er de få valgene som former alt oppsettet etterpå. Tas de underveis i byggingen, tas de ett objekt om gangen
og blir ulike. Tas de her, med personen, bygges alt etter de samme.

**Inn:** kravene, forståelsen, det som gjelder hele kunden, og mønstrene for god konfig (stien gir
`node "${CLAUDE_PLUGIN_ROOT}/scripts/docs.mjs" monstre`; les `grunnregler.md` og beslutningstabellene øverst i
flatene). **Ut:** `4-design/` i løsningen, og `losning.yaml` (hva løsningen bygger på og hvilke integrasjoner den
bruker).

## Valgene

| Valget | Spørsmålet |
|---|---|
| Grunnlaget | Bygger løsningen på en standardløsning fra Neo med versjon, som tilpasses, eller bygges den fra bunnen? |
| Sakene og variantene | Hva er én sak, og hva skiller variantene: én sakstype med et variantfelt, eller flere sakstyper? |
| Kanalene | Hvordan kommer saken inn (skjema, e-post, Altinn, et annet system), og hvordan går svar og dialog ut? |
| Ledingen | Hvordan ledes saksbehandleren gjennom saken: veiviseren, oppgavene, statusene? |
| Delingen av arbeidet | Hva gjør flyten, hva forbereder agenten, og hva avgjør et menneske? |
| Integrasjonene | Hvilke systemer løsningen snakker med, og hva den trenger fra hvert |
| Det felles | Hva som hører hjemme i `organisasjon/` fordi flere løsninger bruker det: felt, maler, team og roller, innboksen, skrivereglene |

## Slik gjør du det

1. **Les kravene som en helhet.** Hvilke krav trekker i hver sin retning, og hvilke valg avgjør mange krav samtidig?
2. **Sjekk det som finnes.** Finnes en standardløsning fra Neo for prosessen, er den utgangspunktet: tilpass den, og
   bygg bare det som skiller kunden. Finnes noe i `organisasjon/` alt, brukes det.
3. **Legg fram hvert valg** med alternativene, hvilke krav hvert av dem dekker og hva det koster (for saksbehandleren,
   for kunden og for oppsettet), og anbefalingen. Et valg som bryter en grunnregel, sier hvorfor.
4. **Skriv valgene som tilstand** i `4-design/`: valget, hvorfor, og kravene det dekker. Det som er avgjort, står der
   det gjelder; diskusjonen står i PR-en.
5. **Oppdater `losning.yaml`** med grunnlaget og integrasjonene. En integrasjon løsningen bruker, får sin mappe i
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
