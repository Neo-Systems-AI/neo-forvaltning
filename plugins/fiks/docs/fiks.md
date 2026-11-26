# KS Fiks

Neo bruker tre av KS sine fellestjenester:

- **SvarUt** til å sende brev, og digital post til innbyggere.
- **SvarInn** til å motta forsendelser.
- **Fiks folkeregister** til oppslag i Folkeregisteret.

SvarUt og Fiks folkeregister bruker kundens KS Fiks-klient i [Maskinporten](../../maskinporten/docs/maskinporten.md). SvarInn bruker et eget
mottakersystem med service-passord og sertifikat.

Avtalene med KS og Skatteetaten har egen behandlingstid. Start dem med en gang.

## Oppgavene

### Signer avtalen med KS Digital

Signer hovedavtalen med KS Digital, med tjenestevedleggene for SvarUt, SvarInn og Fiks folkeregister.

Ferdig når avtalen og de tre vedleggene er signert.

### Be Skatteetaten om tilgang til Folkeregisteret

Be Skatteetaten om tilgang til Folkeregisteret, og godkjenn vilkårene.

Ferdig når Skatteetaten har gitt tilgangen.

### Få tilgang til `ks:fiks`

1. Be KS om tilgang til `ks:fiks` for kundens organisasjonsnummer, i test og produksjon, på fiks@ksdigital.no.
2. Legg `ks:fiks` på KS Fiks-klienten i Maskinporten når tilgangen er gitt.

Ferdig når «Hent status» i Neo viser at `ks:fiks` er på klienten.

### Sett opp organisasjonen og SvarUt-kontoen

I Fiks forvaltning:

1. Sett opp organisasjonen.
2. Lag en SvarUt-konto. Legg ID-en i hvelvet som `fiks--svarut-konto-ider`.

Ferdig når kontoen finnes, og ID-en står i hvelvet.

### Lag integrasjonen

I Fiks forvaltning:

1. Lag integrasjonen på SvarUt-kontoen, med kundens organisasjonsnummer som autorisert organisasjon og KS Fiks-klienten.
2. Gi integrasjonen tilgang til å sende.
3. Legg ID-en og passordet i hvelvet som `fiks--integrasjon-id` og `fiks--integrasjon-passord`.

Ferdig når integrasjonen kan sende fra kontoen, og verdiene står i hvelvet.

### Sett opp Fiks folkeregister

Under Fiks register i Fiks forvaltning:

1. Sett opp Fiks folkeregister.
2. Lag en rolle med hjemmel, og bare de opplysningene som trengs.
3. Gi integrasjonen tilgang til rollen.
4. Legg ID-en til rollen i hvelvet som `fiks--folkeregister-rolle-id`.

Hvilke opplysninger rollen skal ha, avgjøres i arbeidsmøtene.

Ferdig når integrasjonen har tilgang til rollen, og ID-en står i hvelvet.

### Deleger Folkeregisteret til KS

Deleger i Altinn, under Maskinportenadministrasjon, til KS (971 032 146) for Folkeregister-API-et «på vegne av». Den
som delegerer, trenger tilgangspakken «Delegerbare Maskinporten scopes».

Hvilket API som delegeres, med eller uten hjemmel, avklares med KS først.

Ferdig når delegeringen står i Altinn.

### Bestill mottakersystemet for SvarInn

1. Bestill et mottakersystem for SvarInn hos KS. Legg ID-en i hvelvet som `fiks--svarinn-mottakersystem-id`.
2. Lag service-passordet. Legg det i hvelvet som `fiks--svarinn-passord`.
3. Last opp sertifikatet Neo lager, på fanen Service.

Ferdig når mottakersystemet har service-passordet og sertifikatet, og verdiene står i hvelvet.

## Digital post til innbyggere

Uten disse stegene sender SvarUt til Altinn i stedet for til innbyggerens digitale postkasse.

### Gjør klar til digital post

1. Send skjemaet til Digdir, og godkjenn bruksvilkårene i Samarbeidsportalen.
2. Deleger i Altinn til KS (971 032 146): «Delegere rettighet til å sende DPI-meldinger på vegne av virksomheten».
3. Slå på «Digital postkasse til innbyggere» for SvarUt-kontoen i Fiks forvaltning.
4. Gjennomfør en ROS-analyse.

Ferdig når alle fire er gjort.

## Det som legges i hvelvet

| Navn | Verdien | Hemmelig |
|---|---|---|
| `fiks--integrasjon-id` | ID-en til integrasjonen i Fiks forvaltning | Nei |
| `fiks--integrasjon-passord` | Passordet til integrasjonen | Ja |
| `fiks--svarut-konto-ider` | ID-ene til SvarUt-kontoene | Nei |
| `fiks--folkeregister-rolle-id` | ID-en til rollen i Fiks register | Nei |
| `fiks--svarinn-mottakersystem-id` | ID-en til mottakersystemet for SvarInn | Nei |
| `fiks--svarinn-passord` | Service-passordet til mottakersystemet | Ja |
| `fiks--svarinn-sertifikat` | Sertifikatet for mottak | Ja |

Klient-ID-ene til KS Fiks-klienten er `maskinporten--fiks-test-client-id` og `maskinporten--fiks-prod-client-id`, se
[Maskinporten](../../maskinporten/docs/maskinporten.md#det-som-legges-i-hvelvet).

## Det forvalteren gjør i Neo

1. Registrerer KS Fiks-klienten i Neo, se [Maskinporten](../../maskinporten/docs/maskinporten.md#det-forvalteren-gjør-i-neo).
2. Lager sertifikatet for SvarInn, og gir det til kunden.
3. Legger inn integrasjonen, SvarUt-kontoen, rollen i Fiks register og mottakersystemet med verdiene fra hvelvet.

## Slik prøves det

Hvordan hver tjeneste prøves fra Neo, er ikke beskrevet ennå. Det avklares med forvalteren.
