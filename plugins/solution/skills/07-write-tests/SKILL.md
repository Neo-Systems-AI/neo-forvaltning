---
name: 07-write-tests
description: Skriver testene for en løsning fra kravene - testcasene (syntetiske saker med det som skal skje), personaene som tester, lista over det et menneske lager i sandkassen før runden, og testplanen for en runde i UI - med reisen fra start til mål per persona, et punkt per krav, det som beviser hvert punkt, situasjonene der opplevelsen kan svikte, og hypotesene. Testene kjøres senere. Bruk når konfigen er bygget, og når testplanen skal skrives om etter en runde.
---

# Testene

Testen er første gang løsningen møter et menneske. Den viser at kravene holder i Neo, slik saksbehandleren møter dem,
og den leter etter stedene der det blir kronglete. Testplanen skrives så en annen kan kjøre runden uten å spørre.

**Inn:** kravene, designet, konfigen og forrige runde når den finnes. **Ut:** testcasene og testplanen i `test/` i
løsningen, og personaene i `test/personaer/` i roten. Formen står i repoets regler (`.claude/rules/`).

## Testcasene

Syntetiske saker som prøver løsningen, og som kan brukes til demo. Ingen ekte personer eller virksomheter: navn,
fødselsnumre og organisasjonsnumre er oppdiktede eller fra testmiljøene (Tenor, testorganisasjonene i Altinn).

- **Én testcase viser ett utfall** og det som kan gå galt på veien: en mangel, et brudd på en regel, en frist som
  går ut, en part som klager.
- **Det som skal skje** står i testcasen: utfallet, det kontrollen skal fange, brevene som skal sendes, og kravene den
  prøver. Sammen dekker testcasene alle variantene og alle utfallene.
- **Saken slik den kommer inn**, i samme form som kanalen leverer den.

## Personaene

Testbrukerne, én fil per persona i `test/personaer/`, med rolle og team i Neo og de eksterne identitetene de trenger:
testbrukere i Altinn (tt02) og ID-porten (Tenor), test-organisasjonsnumre, og testkontoer i arkivet og Entra. Passord og
nøkler står ikke i personaen; personen logger inn selv. Personaene er testdata, ikke konfig. Samme persona
brukes i alle løsningene; lag en ny bare når en rolle mangler. Et team eller en rolle personaen trenger, og som ikke
finnes i Neo, setter et menneske opp der.

## Det et menneske lager i sandkassen

Neo har ikke et API for å legge inn testcaser eller lage brukere, så et menneske gjør det i sandkassen før runden.
Skriv lista øverst i riggen i testplanen, så det er ett steg og ikke et gjett: hver testcase som skal legges inn (fila,
kanalen den kommer inn gjennom, og hva den skal ha når den er inne), og hver persona som skal finnes (rollen, teamet og
identitetene). Et punkt er ferdig når det er sjekket i Neo, ikke når noen har sagt det er gjort.

## Testplanen

- **Øverst:** akseptkriteriet for runden, versjonen av konfigen den er skrevet mot (commiten), og hva den *ikke*
  beviser.
- **Riggen:** punktene som gjør runden klar og lik hver gang: lista over det et menneske lager i sandkassen, konfigen i
  miljøet er lik repoet, testcasene er lagt inn,
  personaene kan logge inn med riktig rolle, integrasjonene svarer, og hva som overvåkes. Hvert punkt er en sjekk med et
  bevis, ikke en påstand.
- **Reisene:** én seksjon per persona, med reisen fra start til mål som en tabell (steget, det personaen gjør, det som
  skal skje, når steget er ferdig), og punktene for reisen under.
- **Et punkt:** id og tittel, kravene det prøver, oppsettet (persona, testcase og skjermbredde), det som skal skje med
  navnene Neo bruker på knapper og felt, og beviset: det som står etter en ny lasting, en rad i historikken, et brev i
  saken, en kjøring av flyten. At en knapp svarte, er ikke et bevis. Når noe skal skje utenfor Neo (et brev i Altinn,
  en journalpost i arkivet), sier punktet hvor det sees.
- **Sporingen:** hvert krav har minst ett punkt. Har kunden sin egen liste over hva som skal prøves, har hvert punkt i
  den også et punkt i testplanen.

## Det som gjør testen til mer enn en sjekkliste

- **Situasjonene der opplevelsen kan svikte:** skjønner saksbehandleren neste steg, hva systemet gjorde, og om noe er
  lagret, venter eller feilet? Hva skjer med mange saker, etter et avbrudd, med feil i det som kom inn, for en rolle med
  mindre tilgang, på en smal skjerm? Hver av dem får et punkt som oppsøker den med vilje.
- **Innsatsen per steg:** handlinger, bytter av sted, venting og leting, så runder kan sammenlignes.
- **Hypotesene,** skrevet før runden: hva vi tror, hva som viser det, og når den er truffet eller bommet.

## Når testplanen skrives om

Etter en runde står prioriteten først: reisen, det nye som ikke er prøvd, at funnene som er rettet holder, og at det
som var riktig, står fast. Testplanen er gjeldende tilstand; resultatene står i runden.

## Ferdig når

Hvert krav har et punkt, testcasene dekker variantene og utfallene, personaene finnes for hver rolle, og testplanen er
lest mot kravene og miljøet: funksjonene den antar er på, er på, og rollene har tilgangen punktene trenger. Legg så fram
reisene, situasjonene og hypotesene for personen, som kan legge til.
