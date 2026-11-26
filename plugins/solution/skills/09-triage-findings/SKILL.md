---
name: 09-triage-findings
description: Sorterer funnene etter en testrunde i pakker personen kan avgjøre - runden holdt mot testplanen og akseptkriteriet, hvert funn sjekket mot konfigen og mot hvordan Neo virker, og delt i det som rettes i konfigen, det som er data eller test, og det som er et ønske til Neo med det Neo trenger for å gjenskape det. Bruk etter en testrunde, før noe rettes.
---

# Funnene

Etter en runde går vi til pakker, ikke rett til rettinger. Et funn kan ha årsaken i konfigen, i testen eller i
produktet, og rettingen er ulik for hver: konfigen rettes i repoet, testen i testplanen, og produktet av Neo.

**Inn:** runden med resultatene og funnene, testplanen, konfigen, og forrige runde. **Ut:** pakkene, med hvert funn
merket med pakken det hører til, og ønskene til Neo.

## 1. Hold runden mot testplanen

- Hvilke punkter som er bestått, ikke bestått eller ikke prøvd, og hvorfor.
- Om akseptkriteriet holder, og hvilke krav som nå holder.
- Hypotesene: truffet, bommet eller ikke avgjort, og det som ikke var forutsett.
- Innsatsen per steg mot forrige runde: hva som ble lettere, tyngre eller står stille.
- Funn som kommer tilbake fra en tidligere runde, merkes.

## 2. Finn årsaken til hvert funn

- **Konfigen:** står objektet i konfigen slik testen antok, og er det likt i miljøet? Følger det mønstrene? Er det
  endret siden runden? En årsak i konfigen er en innstilling, et objekt som mangler, eller et valg i designet.
- **Testen eller dataene:** var forventningen i testplanen riktig, og var testcasen slik den skulle?
- **Produktet:** gjør Neo noe annet enn dokumentasjonen sier, eller mangler Neo noe kravet trenger? Sjekk at det ikke
  kan løses i konfigen før det kalles produkt.
- **Riggen og metoden:** noe i måten runden ble kjørt på.

Et funn som bare er et inntrykk og ikke kan knyttes til noe, sies.

## 3. Pakkene

Per flate eller del av løsningen, ikke per funn. Hver pakke har funnene med signalene side om side (det personen gjorde
og sa, det skjermen viste, det Neo gjorde i bakgrunnen), og det som må til, med formålet: hva som skal bli annerledes
for den som står i skjermen.

- **Konfig:** rettingen i konfigen, med kravene og mønstrene den berører. Den bygges og testes på nytt.
- **Ønske til Neo:** skrevet så Neo kan gjenskape det uten oss: stegene, det som skulle skje, det som skjedde, beviset,
  og kravet det hindrer. Ingen personopplysninger, og ingen kundedata utover det som trengs. Ønsket står som et funn i
  runden, merket som ønske til Neo, og går til den som forvalter (i `kunde.yaml`), som tar det videre til Neo. Kravet
  får ønsket som det det ble (`blir: { onske, hvorfor }`), til produktet har det.
- **Test:** rettingen i testplanen eller testcasen.

Under pakkene: sammenhengene (hvilke pakker henger sammen eller må komme i en rekkefølge), og det personen avgjør.
Høy alvorlighet og det som har gått tilbake, først.

## Personen avgjør

Hva som er konfig, og hva som er produkt, og hvilke pakker som tas før neste runde. Legg fram om akseptkriteriet holder
(én setning), det som er bestått (kort), personens funn med formålet gjengitt, de andre funnene, hypotesene og
innsatsen, og pakkene.

## Ferdig når

Hvert funn hører til en pakke, hvert ønske til Neo kan gjenskapes uten oss, og personen har avgjort hva som tas.
