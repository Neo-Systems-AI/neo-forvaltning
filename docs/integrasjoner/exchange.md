# Exchange Online: felles postbokser

E-post til en felles postboks, som postmottak@, kommer inn i innboksen i Neo. Neo kan også sende fra postboksen. En
felles postboks har ingen innlogging, så Neo leser den med en egen app. Tilgangen til appen avgrenses i Exchange til
nettopp de felles postboksene.

## Det kunden trenger

- **Exchange Online i tenanten.** En tenant med bare Entra ID kan verken lage postboksen eller gi rollene.
- **Rettighetene:** en konto i Entra som kan opprette apper, for eksempel Application Administrator, og en
  administrator i Exchange Online, for eksempel Exchange Administrator.
- **Ligger e-posten hos en annen leverandør,** må den felles postboksen ha en adresse i tenantens
  `onmicrosoft.com`-domene.

## Oppgavene

### Lag appen

Lag en app i Entra ID, kun for egen organisasjon (single tenant).

Ferdig når appen finnes, og kunden har klient-ID-en og objekt-ID-en til tjenesteprinsipalen. Exchange trenger begge.

### Gi appen tillatelsene

Gi appen de delegerte e-posttillatelsene forvalteren oppgir, og gi administratorsamtykke.

Gi appen ingen e-posttillatelser (`Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `MailboxSettings.Read`) som
applikasjonstillatelser i Entra ID. De ville gjelde alle postboksene i tenanten, i tillegg til avgrensningen i
Exchange.

Ferdig når samtykket er gitt, og appen ikke har noen e-posttillatelse som applikasjonstillatelse.

### Lag client secret

Lag én client secret på appen. Legg den i hvelvet som `exchange-client-secret`, og sett utløpsdatoen på hemmeligheten
i hvelvet.

Ferdig når hemmeligheten og utløpsdatoen står i hvelvet, sammen med `exchange-client-id`.

### Lag de felles postboksene

Lag de felles postboksene hvis de ikke finnes. Neo kobler bare til felles postbokser. En brukers egen postboks
avvises, så den ikke blir synlig for hele organisasjonen.

Ferdig når hver postboks Neo skal bruke, finnes som felles postboks.

### Avgrens tilgangen i Exchange

1. Registrer appen som tjenesteprinsipal i Exchange Online, med klient-ID-en og objekt-ID-en.
2. Lag et omfang (management scope) med bare de felles postboksene Neo skal bruke.
3. Gi appen rollene `Application Mail.Read` og `Application MailboxSettings.Read` i omfanget. Neo bruker den siste til
   å sjekke at postboksen er felles.
4. Skal Neo sende fra postboksene, gi også `Application Mail.ReadWrite` og `Application Mail.Send` i omfanget.

Rollene slår ikke inn med en gang i Exchange.

Ferdig når en test av appens tilgang viser at rollene gjelder hver felles postboks i omfanget, og ingen andre.

### Kontroller avgrensningen

Når forvalteren har koblet postboksene til i Neo:

1. Send en e-post til en postboks i omfanget, gjerne med et vedlegg.
2. Send en e-post til en postboks utenfor omfanget.

Ferdig når bare den første kommer inn i innboksen i Neo, med avsender, emne, tekst og vedlegg.

## Det som legges i hvelvet

| Navn | Verdien |
|---|---|
| `exchange-client-id` | Application (client) ID til appen |
| `exchange-client-secret` | Client secret, med utløpsdato |

Tenant-ID-en er `entra-tenant-id`, se [Entra ID](./entra.md#det-som-legges-i-hvelvet).

## Det forvalteren gjør i Neo

1. Legger til integrasjonen Microsoft 365 under organisasjonens integrasjoner, med klient-ID, client secret og
   tenant-ID. Tenant-ID-en kan ikke stå blank.
2. Legger til hver felles postboks under «Felles postbokser». Neo henter et token, prøver å lese innboksen og sjekker
   at postboksen er felles før den lagres.
3. Synker innboksen og kontrollerer at e-posten fra kontrollen har kommet inn. Neo synker hvert femte minutt.

## Når postboksen er i drift

- En postboks som mister tilgangen, går til feil i Neo og tar seg inn igjen av seg selv når rollene er rettet.
- En postboks som fjernes i Neo, henter ikke ny e-post. Henvendelsene som alt er hentet, står igjen. Kunden tar så
  postboksen ut av omfanget i Exchange.
- Client secret byttes før utløpsdatoen.

## Feil som pleier å komme

| Feilen i Neo | Årsaken | Rettes med |
|---|---|---|
| `MICROSOFT_TENANT_REQUIRED` | Integrasjonen står uten tenant-ID | Forvalteren setter tenant-ID-en |
| `MICROSOFT_APP_TOKEN_REJECTED` | Feil eller utløpt client secret, eller feil tenant | [Ny client secret](#lag-client-secret) |
| `MAILBOX_NOT_FOUND` | Adressen finnes ikke i Microsoft 365 | Sjekk adressen |
| `MAILBOX_ACCESS_DENIED` | Appen har ikke `Application Mail.Read` for postboksen | [Rollene og omfanget](#avgrens-tilgangen-i-exchange). Vent til rollene har slått inn |
| `MAILBOX_PURPOSE_FORBIDDEN` | Appen har ikke `Application MailboxSettings.Read` i samme omfang | [Rollene og omfanget](#avgrens-tilgangen-i-exchange) |
| `MAILBOX_NOT_SHARED` | Adressen er en brukers egen postboks | Bruk en felles postboks |
| `MAILBOX_ON_OTHER_INTEGRATION` | Adressen er koblet til gjennom en annen Microsoft-integrasjon i Neo | Fjern den der først |
