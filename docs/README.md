# Dokumentasjonen

Dokumentasjonen står i pluginen som bruker den, i `docs/` i plugin-mappa, så den følger pluginens versjon når den
installeres. Her er inngangen.

## Mønstrene for god konfig

[Mønstrene](../plugins/solution/docs/monstre/README.md) i pluginen `solution`: grunnreglene, og reglene per flate med
beslutningstabellene. Det som kan sjekkes maskinelt, sjekker `scripts/sjekk.mjs` i samme plugin, med samme id.

## Integrasjonene

Slik settes hvert system opp for Neo. Oppskriften er lik for alle kunder. Hver av dem sier hva kunden gjør i sitt eget
system og i hvilken rekkefølge, når det er ferdig, hva som legges i hvelvet, hva forvalteren gjør i Neo, og hvordan
det prøves. Hvor langt én kunde er kommet, står i kundens eget repo (`integrasjoner/<system>/`), ikke her.

| System | Hva det er | Hva Neo bruker det til | Må kunden gjøre noe? |
|---|---|---|---|
| [Hvelvet](../plugins/solution/docs/hvelvet.md) | Azure Key Vault | Kanalen for hemmeligheter og ID-er mellom kunden og forvalteren | Ja, først av alt |
| [Entra ID](../plugins/entra/docs/entra.md) | Microsofts katalog for brukere og grupper | Innlogging (SSO) og brukerne, rollene og tilgangsgruppene (SCIM) | Ja |
| [Exchange Online](../plugins/entra/docs/exchange.md) | Microsofts e-post | Felles postbokser inn i innboksen, og sending fra dem | Ja, når Neo skal lese e-post |
| [Documaster](../plugins/documaster/docs/documaster.md) | Arkivsystem (Noark 5) | Arkivering i bakgrunnen og søk, visning og arkivering for saksbehandlerne | Ja, når kunden arkiverer i Documaster |
| [Maskinporten](../plugins/maskinporten/docs/maskinporten.md) | Digdirs tjeneste for maskin-til-maskin-tilgang | Tilgangen til Altinn, KS Fiks og Kontakt- og reservasjonsregisteret | Ja, for hver av dem |
| [Altinn](../plugins/altinn/docs/altinn.md) | Digdirs plattform for skjemaer og meldinger | Innsendingene fra skjemaene, og vedtak og meldinger til innbyggere og virksomheter | Ja, når kunden har skjemaer i Altinn |
| [KS Fiks](../plugins/fiks/docs/fiks.md) | KS sine fellestjenester: SvarUt, SvarInn og Fiks folkeregister | Sende og motta brev, digital post til innbyggere, og oppslag i Folkeregisteret | Ja |
| [Kontakt- og reservasjonsregisteret](../plugins/krr/docs/krr.md) | Digdirs register over kontaktinformasjon og reservasjoner | Varsling til innbyggere | Ja |
| [eSignering](../plugins/solution/docs/esignering.md) | Digdirs tjeneste for elektronisk signering | Signering av dokumenter | Ja |
| Enhetsregisteret | Brønnøysundregistrenes register over virksomheter, åpne data | Oppslag på organisasjonsnumre | Nei, API-et er åpent |

### Rekkefølgen

- **Hvelvet først.** Alle de andre oppgavene legger verdiene sine der.
- **Avtalene først.** Avtalene med KS, Digdir og Skatteetaten har egen behandlingstid. Start dem med en gang; fristene
  regnes fra signeringen.
- **Maskinporten før Altinn, KS Fiks og Kontakt- og reservasjonsregisteret.** De tre bruker hver sin
  Maskinporten-klient.
- **Prøv ett ledd før det neste slås på,** for eksempel innloggingen før brukerprovisjoneringen.

### Hvem gjør hva

Kunden eier sin egen systemadministrasjon. Oppskriftene sier hva kunden gjør, hvor og i hvilken rekkefølge, og når det
er ferdig. Kunden velger selv verktøyet. Forvalteren setter opp Neo, henter verdiene fra hvelvet og prøver
tilkoblingene.

Oppskriftene spør ikke om det Neo henter selv, eller om valg som legges inn i Neo, som appene i Altinn-organisasjonen,
meldingstjenestene, forsendelsestypene, postboksene og standard avsender. De valgene tas i arbeidsmøtene.
