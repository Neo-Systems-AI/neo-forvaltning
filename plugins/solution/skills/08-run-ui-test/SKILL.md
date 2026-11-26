---
name: 08-run-ui-test
description: Kjører en testrunde for en løsning i Neo, i UI, med personen som observatør - riggen gjort klar og nullpunktet skrevet, så punkt for punkt med bevis, det saksbehandleren møter på skjermen og det Neo gjør i bakgrunnen, innsatsen per steg, hypotesene, og personens egne observasjoner ført ordrett. Resultatet og funnene skrives i runden. Bruk når testplanen er klar og konfigen ligger i testmiljøet.
---

# Testrunden

En runde er bare verdt noe hvis den kan sammenlignes med neste, og hvis det som ikke ble sett, er sagt. Personen ser
på og noterer sine egne funn; det hen ser og sier, teller like mye som det skjermen viser.

**Inn:** testplanen, testcasene og personaene i `test/personaer/`. **Ut:** en ny runde i `test/runder/` i løsningen,
med resultatene og funnene. En runde som er kjørt, endres ikke; neste runde er en ny.

## 1. Gjør klar

- **Konfigen:** miljøet runden kjører i, og at konfigen der er lik repoet på commiten testplanen er skrevet mot: ta et
  snapshot av sandkassen (`/forvaltning:snapshot`), og se at `git diff` er tom for løsningens filer. Er den ikke
  lik, er det et funn før runden starter.
- **Neo:** versjonen miljøet viser, så runden kan sammenlignes med neste.
- **Testcasene:** lagt inn og slik testplanen sier, sjekket i Neo, ikke i en logg.
- **Personaene:** innlogget, hver i sin egen nettleserkontekst, med rollen testplanen sier og identitetene i fila
  deres. Agenten oppretter ingen kontoer og ber aldri om et passord; det gjør personen.
- **Integrasjonene** runden går gjennom, svarer: prøv hver av dem før start.
- **Det som overvåkes:** kjøringene av flytene og agentene i Neo, og konsollen og nettverket i nettleseren. Det som ikke
  kan sees fra der runden kjører, sies før start og regnes aldri som grønt.
- **Miljøet holdes stille:** ingen endring i konfigen under runden.

Skriv nullpunktet øverst i runden, og si hva som er klart, hva som ikke kan måles, og hvilke punkter som krever
personen. Vent på «start test».

## 2. Kjør

- **Punkt for punkt,** etter testplanen. Ta beviset testplanen sier, i det øyeblikket det skjer.
- **Skjermen:** det saksbehandleren må lese før første handling, om noe må letes etter eller rulles til, og
  tilbakemeldingene mens de vises. En påstand om at noe mangler, sjekkes mot skjermen før den føres.
- **Bakgrunnen:** kjøringen av flyten eller agenten et punkt starter, med stegene, tiden og feilen.
- **Innsatsen per steg:** handlinger, bytter av sted, venting og leting.
- **Hypotesene:** det som skjedde der vi var usikre.

## Personens observasjoner

Det personen skriver under runden, er en observasjon med mindre hen sier noe annet. Den føres ordrett som et funn med
personen som kilde, med steget og tiden, og beviset tas i samme øyeblikk. Den tolkes og diskuteres ikke under runden.

## Resultatene

- **Øverst:** hvem, miljøet, tiden, versjonene, og dommen over akseptkriteriet.
- **Per punkt:** resultatet (bestått, bestått med avvik og funnet, ikke bestått), beviset og tiden.
- **Ikke prøvd,** med grunnen for hvert punkt.
- **Innsatsen** per steg, mot forrige runde.
- **Funnene:** hvert avvik med kilden, steget, beviset og hvor alvorlig det er. Et funn som ble lukket uten endring
  sist, sjekkes nå.

## Regler

- **Konfigen endres ikke under runden.** En åpenbar retting skrives i funnet.
- **Det som ble satt opp, ryddes ikke underveis**; det kan være forutsetningen for neste punkt.
- **Mister runden nullpunktet** (konfigen endres, testcasene legges inn på nytt), er den avbrutt fra det tidspunktet.
  Det som kom etter, kjøres igjen.
- **Testdata er syntetiske.** Kommer ekte personopplysninger inn i miljøet, stopp og si det.

## Personen avgjør

Observasjonene sine: de står ordrett, og hen sier om noe ikke skal føres.

## Ferdig når

Hvert punkt i testplanen har et resultat eller en grunn til at det ikke er prøvd, og hvert avvik er et funn med bevis.
