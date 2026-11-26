# Maskinporten

Maskinporten gir Neo tilgang til de offentlige API-ene på vegne av kunden. Hver integrasjon har sin egen klient hos
kunden, i test og i produksjon:

- én for [Altinn](../../altinn/docs/altinn.md);
- én for [KS Fiks](../../fiks/docs/fiks.md);
- én for [Kontakt- og reservasjonsregisteret](../../krr/docs/krr.md).

Da får hver klient bare de scopene integrasjonen trenger, og et scope som mangler, stopper ikke de andre
integrasjonene.

Neo lager nøkkelparet for hver klient, og den private nøkkelen forlater aldri Neo. Ingen Maskinporten-tilgang
delegeres til forvalteren. Kunden eier klientene.

## Oppgavene

### Bli med i Samarbeidsportalen

Er kunden ikke i Digdirs samarbeidsportal: send informasjonsskjemaet, og signer bruksvilkårene for offentlige kunder.
Dette har egen behandlingstid hos Digdir. Start med en gang.

Ferdig når kunden har tilgang til Samarbeidsportalen, og bruksvilkårene er signert.

### Gi rettigheten til å lage klienter

Hovedadministratoren i Altinn gir den som skal lage klientene, rettigheten «Selvbetjening av klienter i
ID-porten/Maskinporten». I produksjon logger den personen inn med Ansattporten.

Ferdig når personen kan lage klienter på kundens organisasjonsnummer.

### Lag klientene

Lag én klient per integrasjon og per miljø, på kundens organisasjonsnummer. Legg klient-ID-ene i hvelvet.

Ferdig når klient-ID-ene står i hvelvet under navnene [under](#det-som-legges-i-hvelvet).

### Legg den offentlige nøkkelen på klienten

Når forvalteren har registrert klienten i Neo, viser Neo den offentlige nøkkelen. Legg den til på klienten.

Ferdig når hver klient har nøkkelen fra Neo.

### Legg scopene på klienten

Legg scopene for integrasjonen på klienten når eierne av API-ene har gitt kunden tilgang. Scopene står i oppskriften
for hver integrasjon.

Ferdig når «Hent status» i Neo ikke viser noen av de to feilene under [Slik prøves det](#slik-prøves-det).

## Det som legges i hvelvet

| Navn | Verdien |
|---|---|
| `maskinporten--<integrasjon>-test-client-id` | Klient-ID-en i testmiljøet |
| `maskinporten--<integrasjon>-prod-client-id` | Klient-ID-en i produksjon |

`<integrasjon>` er `altinn`, `fiks` eller `krr`, for eksempel `maskinporten--fiks-prod-client-id`. Nøkkelen legges ikke
i hvelvet: den private nøkkelen blir i Neo.

## Det forvalteren gjør i Neo

1. Registrerer hver klient i Neo med klient-ID og miljø.
2. Gir kunden den offentlige nøkkelen Neo viser.
3. Trykker «Hent status» når scopene er lagt på.

## Slik prøves det

«Hent status» i Neo viser status for hvert scope på klienten. To av dem betyr at noe mangler:

| Status | Betyr | Rettes med |
|---|---|---|
| «Ikke lagt på klienten» | Scopet mangler på klienten | [Legg scopet på klienten](#legg-scopene-på-klienten) |
| «Virksomheten har ikke tilgang» | Eieren av API-et har ikke gitt kunden tilgang | Be eieren om tilgang, se oppskriften for integrasjonen |
