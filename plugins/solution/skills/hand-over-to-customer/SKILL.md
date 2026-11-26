---
name: hand-over-to-customer
description: Gir en testet løsning til kunden - hva løsningen gjør og for hvem, hvordan saksbehandleren bruker den, kravene og hvordan de er prøvd, det som står åpent (funn og ønsker til Neo), det kunden selv må gjøre i sine systemer, og hvordan en endring gjøres etterpå - samlet i én PR kunden godkjenner. Bruk når testrundene er ferdige og funnene er avgjort.
---

# Overleveringen

Kunden eier løsningen etter overleveringen: prosesseieren skal forstå hva den gjør, saksbehandlerne skal kunne bruke
den, og den som godkjenner endringer, skal vite hva de godkjenner. Overleveringen er én PR i kunderepoet, skrevet for
prosesseieren, ikke for den som bygget.

**Inn:** løsningen (formålet i `losning.yaml`, kravene, designet, konfigen), siste testrunde med funnene og pakkene, og
integrasjonene. **Ut:** en PR med overleveringen, godkjent av godkjenneren i `.github/CODEOWNERS`.

## Det som skal med

1. **Hva løsningen gjør:** formålet, hvem som bruker den, og saken fra den kommer inn til den er avsluttet, i
   prosesseierens ord.
2. **Slik brukes den:** reisen for hver rolle, med det som skiller den fra i dag. Det som gjøres av en flyt, det agenten
   forbereder, og det et menneske avgjør, sies hver for seg.
3. **Kravene og prøven:** hvor mange krav, hvordan de er prøvd (runden og datoen), og hvilke som holder. Et krav som
   ikke holder, står med hvorfor og hva som skjer med det.
4. **Det som står åpent:** funnene som ikke er rettet, og ønskene til Neo, med hva de betyr for saksbehandleren til de
   er løst.
5. **Det kunden selv må gjøre:** oppgavene i kundens egne systemer, fra `integrasjoner/<system>/hos-kunden.md`. Lista
   lages av sjekken av repoet (`sjekk.mjs hos-kunden`), den skrives ikke for hånd; ta den med i PR-en, og si hvilke
   oppgaver som stopper bruken.
6. **Endringer etterpå:** hvordan en endring foreslås, hvem som godkjenner, og at testene kjøres igjen.

## Slik gjør du det

1. Sjekk at det som skal overleveres, er ferdig: hvert krav har et bestått punkt eller et avvik personen har godtatt,
   og sjekken er grønn.
2. Sett statusen i `losning.yaml` til `i-bruk` i overleveringen. Statusene er `utkast` (mens den researches og
   designes), `i-test` (konfigen er i sandkassen og testes), `i-bruk` (kunden har tatt den i bruk) og `avviklet`. En
   løsning går ikke fra `utkast` rett til `i-bruk`.
3. Skriv PR-beskrivelsen etter punktene over, kort og uten interne ord. Spør personen om hva kunden allerede vet, så
   overleveringen ikke gjentar det.
4. Be godkjenneren i `.github/CODEOWNERS` om review.

## Personen avgjør

Hva som overleveres og når: om de åpne funnene stopper overleveringen, og hva kunden skal få vite om dem.

## Ferdig når

PR-en har alt over, sjekken er grønn, og godkjenneren hos kunden har godkjent den.
