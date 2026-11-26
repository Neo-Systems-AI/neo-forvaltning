# Altinn

Neo henter innsendingene fra kundens skjemaer i Altinn, og kan sende vedtak og meldinger. Kunden er tjenesteeier, og
alt i Altinn Studio er kundens. Forvalteren bistår.

Neo henter selv appene i organisasjonen, abonnerer på hendelsene og leser innsendingene. Det kunden gjør, er å bli
tjenesteeier, gi Altinn-klienten scopene og ha appene i sin egen organisasjon.

Altinn bruker kundens Altinn-klient i [Maskinporten](../../maskinporten/docs/maskinporten.md). Lag den først.

## Oppgavene

### Bli tjenesteeier i Altinn

Kunden er tjenesteeier, med en organisasjon i Altinn Studio. Er kunden ikke det, følg Digdirs veiledning «Bli
tjenesteeier i Altinn». Dette har egen behandlingstid hos Digdir. Start med en gang.

Ferdig når kunden har en organisasjon i Altinn Studio.

### Legg scopene på Altinn-klienten

Legg disse på Altinn-klienten i Maskinporten, i test og produksjon:

- `altinn:serviceowner/instances.read`
- `altinn:serviceowner/instances.write`
- `altinn:serviceowner/events`
- `altinn:events.subscribe`

Ferdig når «Hent status» i Neo viser at scopene er på klienten.

### Gjør klar til å sende vedtak og meldinger

Bare når prosessene sender vedtak eller meldinger i Altinn:

1. Legg også `altinn:serviceowner` og `altinn:correspondence.write` på Altinn-klienten.
2. Lag en meldingstjeneste i Ressursregisteret, med kunden som kompetent myndighet.

Ferdig når scopene er på klienten, og meldingstjenesten finnes i Ressursregisteret.

### Flytt appene inn i kundens organisasjon

Appene forvalteren har laget, må inn i kundens organisasjon i Altinn Studio. Velg én av to veier:

- **Kunden gir forvalterens utviklere tilgang** i organisasjonen. De lager en kopi med kundens organisasjon som eier.
  Altinn Studio lar en bruker bare kopiere til sin egen konto eller til en organisasjon brukeren er medlem av.
- **Kunden kloner appen selv** fra forvalterens organisasjon. Appene i en offentlig organisasjon kan klones uten
  innlogging.

En app får ny ID i kundens organisasjon. Det som peker på den i Neo, må pekes om.

Ferdig når hver app ligger i kundens organisasjon.

### Gi organisasjonen tilgang til innsendingene

Hver app gir kundens organisasjon tilgang til innsendingene i tilgangspolicyen (`[ORG]`).

Ferdig når tilgangspolicyen i hver app har regelen.

### Publiser appene

Publiser hver app i tt02, og i produksjon før produksjonsstart.

Ferdig når hver app svarer i tt02, og i produksjon når den skal i drift.

## Det som legges i hvelvet

Klient-ID-ene til Altinn-klienten, se [Maskinporten](../../maskinporten/docs/maskinporten.md#det-som-legges-i-hvelvet):
`maskinporten-altinn-test-client-id` og `maskinporten-altinn-prod-client-id`.

## Det forvalteren gjør i Neo

1. Registrerer Altinn-klienten i Neo, se [Maskinporten](../../maskinporten/docs/maskinporten.md#det-forvalteren-gjør-i-neo).
2. Peker det som viste til appene i forvalterens organisasjon, om til appene i kundens organisasjon.

## Slik prøves det

Ferdig når Neo viser appene i kundens organisasjon, og hver app svarer.
