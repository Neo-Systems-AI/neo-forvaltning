---
name: felles-postboks
description: Kobler en felles postboks i Exchange Online (postmottak@ og lignende) til innboksen i Neo, med app-tilgang avgrenset til de felles postboksene. Dekker appen i Entra, rollene i Exchange, oppsettet i Neo, kontrollen av at e-post kommer inn, og feilkodene. Last når en felles postboks skal kobles til, prøves eller feilsøkes.
---

# Felles postboks fra Exchange til innboksen

E-post til en felles postboks kommer inn i innboksen i Neo og synkroniseres automatisk. Alle med tilgang til innboksen
ser henvendelsene. En felles postboks har ingen innlogging, så Neo leser den med appens egen tilgang, og den tilgangen
avgrenses i Exchange til nettopp de felles postboksene.

**Hva som er prøvd:** stegene er skrevet etter oppsettet Neo selv viser på Microsoft-integrasjonens side, og er ikke
kjørt ende til ende her. Stemmer ikke et steg med det siden viser, er det siden som gjelder.

## 0. Hvem gjør hva

| Steg | Agent | Menneske |
|---|---|---|
| Gi kommandoene, lese utdataene, finne feilen | ✅ | |
| Kjøre `az` og Exchange Online PowerShell | | ✅ med sin egen innlogging |
| Client secret | ❌ ser den aldri | ✅ kopierer rett fra terminalen til Neo |
| Lagre integrasjonen og legge til postboksen i Neo | | ✅ som administrator i organisasjonen |
| Sende en prøve-e-post | | ✅ |

## Det du trenger

- **I Entra:** en konto som kan opprette apper, for eksempel Application Administrator.
- **I Exchange Online:** en administrator som kan kjøre `New-ManagementRoleAssignment`, for eksempel Exchange
  Administrator, og modulen `ExchangeOnlineManagement` i PowerShell.
- **I Neo:** administrator i organisasjonen.
- **En felles postboks.** Neo kobler bare til postbokser av typen `shared`. En brukers egen postboks avvises, så den
  ikke blir synlig for hele organisasjonen.

Verdier du skal fylle inn, står som `LIM-INN-…`. Skriv aldri `<…>` i en kommando i zsh.

## 1. Appen i Entra

```bash
MAIL_APP=$(az ad app create --display-name "Neo innboks" --sign-in-audience AzureADMyOrg --query appId -o tsv); MAIL_SP=$(az ad sp create --id "$MAIL_APP" --query id -o tsv); echo "$MAIL_APP $MAIL_SP"
```

`MAIL_APP` er klient-ID-en, og `MAIL_SP` er objekt-ID-en til tjenesteprinsipalen. Exchange trenger begge.

**Gi ikke appen `Mail.Read`, `Mail.ReadWrite`, `Mail.Send` eller `MailboxSettings.Read` som applikasjonstillatelse i
Entra.** De gjelder alle postboksene i tenanten, og de gjelder i tillegg til avgrensningen i Exchange. Tilgangen gis
bare med rollene i del 2.

Mennesket lager client secret og kopierer `password` rett inn i Neo i del 3:

```bash
az ad app credential reset --id "$MAIL_APP" --display-name neo --years 1
```

## 2. Rollene i Exchange

Har dere ikke postboksen fra før, lag den:

```powershell
Connect-ExchangeOnline
New-Mailbox -Shared -Name "Postmottak" -PrimarySmtpAddress postmottak@kommune.example
```

Registrer appen i Exchange, lag omfanget og gi rollene. Siden i Neo viser de samme linjene under «Vis rollene og
PowerShell-linjene», med klient-ID-en fylt inn.

```powershell
# Appens tjenesteprinsipal i Exchange
New-ServicePrincipal -AppId <klient-id> -ObjectId <tjenesteprinsipal-objekt-id> -DisplayName "Neo innboks"

# Omfanget: bare de felles postboksene Neo skal lese
New-ManagementScope -Name "Neo felles postbokser" -RecipientRestrictionFilter "PrimarySmtpAddress -eq 'postmottak@kommune.example'"

# Lese e-posten
New-ManagementRoleAssignment -App <klient-id> -Role "Application Mail.Read" -CustomResourceScope "Neo felles postbokser"

# Lese postboks-innstillingene: Neo sjekker at adressen er en felles postboks før den kobles til
New-ManagementRoleAssignment -App <klient-id> -Role "Application MailboxSettings.Read" -CustomResourceScope "Neo felles postbokser"
```

Flere postbokser legges i samme omfang med `-or PrimarySmtpAddress -eq '…'`.

Bare når organisasjonen også skal **sende** fra postboksen:

```powershell
New-ManagementRoleAssignment -App <klient-id> -Role "Application Mail.ReadWrite" -CustomResourceScope "Neo felles postbokser"
New-ManagementRoleAssignment -App <klient-id> -Role "Application Mail.Send" -CustomResourceScope "Neo felles postbokser"
```

Kontroller at rollene gjelder postboksen. Alle skal stå med `InScope = True`:

```powershell
Test-ServicePrincipalAuthorization -Identity <klient-id> -Resource postmottak@kommune.example
```

Rollene slår ikke inn med en gang i Exchange. Avviser Neo postboksen rett etter at de er gitt, vent og prøv igjen.

## 3. Integrasjonen i Neo

1. Under organisasjonens integrasjoner: «Legg til» → Microsoft 365.
2. Fyll inn klient-ID, client secret og **tenant-ID**. Tenant-ID-en kan ikke stå blank: en felles postboks leses med
   appens egen tilgang, og den krever én bestemt tenant.
3. Velg «Koble til Microsoft 365».
4. Åpne integrasjonen → «Felles postbokser» → skriv adressen i «Adressen til den felles postboksen» → «Legg til».

Neo henter et token for appen, prøver å lese innboksen og sjekker at postboksen er felles, alt før noe lagres. Går
det bra, står postboksen i lista med meldingen «… er koblet til. Synkroniseringen har startet.»

## 4. Kontroll

1. Send en e-post til postboksen fra en annen konto, gjerne med et vedlegg.
2. Vent på neste synk (hvert femte minutt), eller velg «Synk nå» i innboksen.
3. Henvendelsen skal stå i innboksen, med avsender, emne, tekst og vedlegg.

Send også en e-post til en postboks **utenfor** omfanget, og kontroller at den ikke kommer inn. Det er beviset på at
avgrensningen i Exchange virker.

## Feilkodene

| Kode | Årsak | Rettes med |
|---|---|---|
| `MICROSOFT_TENANT_REQUIRED` | Integrasjonen står uten tenant-ID | Sett tenant-ID-en på integrasjonen (del 3) |
| `MICROSOFT_APP_TOKEN_REJECTED` | Entra avviste appen: feil eller utløpt client secret, eller feil tenant | Lag ny client secret og lagre den i Neo |
| `MAILBOX_NOT_FOUND` | Adressen finnes ikke i Microsoft 365 | Sjekk adressen |
| `MAILBOX_ACCESS_DENIED` | Appen har ikke «Application Mail.Read» for postboksen | Rollen og omfanget i del 2. Vent til rollene har slått inn |
| `MAILBOX_PURPOSE_FORBIDDEN` | Appen har ikke «Application MailboxSettings.Read» i samme omfang | Den fjerde linja i del 2 |
| `MAILBOX_NOT_SHARED` | Adressen er en brukers egen postboks | Bruk en felles postboks |
| `MAILBOX_ON_OTHER_INTEGRATION` | Adressen er koblet til gjennom en annen Microsoft-integrasjon i organisasjonen | Fjern den der først |

En postboks som mister tilgangen etter at den er koblet til, går til feil i Neo og tar seg inn igjen av seg selv når
rollene er rettet. Den trenger ingen ny tilkobling.

## Fjerne en postboks

I Neo: «Fjern» på postboksen under «Felles postbokser». Ny e-post kommer ikke lenger inn, og henvendelsene som alt er
hentet, står igjen. Ta så postboksen ut av omfanget i Exchange, så appen ikke lenger kan lese den.
