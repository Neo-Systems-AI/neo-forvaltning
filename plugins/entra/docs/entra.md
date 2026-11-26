# Entra ID: innlogging og brukere

De ansatte logger inn i Neo med Microsoft-kontoen sin (SSO). Entra oppretter, endrer og deaktiverer dem i Neo (SCIM),
og gruppene i Entra gir jobbroller og tilgangsgrupper i Neo.

## Det kunden trenger

- **Rettighetene i Entra:** Cloud Application Administrator, eller rettigheter til å opprette en app, gi
  administratorsamtykke og tildele grupper til appen.
- **Lisensen:** å tildele grupper til en app krever Entra ID P1 eller P2. Avklar lisensen med Microsoft før gruppene
  tas i bruk for de ansatte.
- **DNS:** noen som kan legge inn en TXT-post på e-postdomenet.
- **En administrator i Neo** som logger inn med Entra ID. Se [Slå på «Kun SSO»](#slå-på-kun-sso).

## Oppgavene

Ta dem i denne rekkefølgen. Innloggingen prøves før provisjoneringen slås på.

### Lag appen fra Microsofts mal

Lag appen under Enterprise applications, med «Create your own application» og «Integrate any other application you
don't find in the gallery». Malen gir automatisk provisjonering (SCIM). En app laget bare som appregistrering har det
ikke.

Ferdig når appen har fanen Provisioning.

### Gjør appen klar til innlogging

1. Sett appen til kun egen organisasjon (single tenant).
2. Legg det valgfrie claimet `upn` på ID-tokenet. Neo leser hvem som logger inn, fra `upn`.
3. Gi administratorsamtykke for `openid` og `profile`. Neo ber ikke om noe mer.

Ferdig når appen er single tenant, ID-tokenet har `upn`, og samtykket gjelder alle brukerne.

### Lag gruppene og tildel dem til appen

Lag sikkerhetsgruppene for Neo. Legg brukerne inn som direkte
medlemmer: nestede grupper telles ikke. Tildel gruppene til appen. Appen krever tildeling, så ingen kommer inn før de
er tildelt.

Hvilke jobbroller og tilgangsgrupper hver gruppe skal gi, avgjøres i arbeidsmøtene.

Ferdig når gruppene står under Users and groups på appen, og kunden har gitt forvalteren Object ID-en til hver gruppe.

### Lag client secret

Lag én client secret på appen. Legg den i hvelvet som `entra-sso-client-secret`, og sett utløpsdatoen på hemmeligheten
i hvelvet.

Ferdig når hemmeligheten og utløpsdatoen står i hvelvet, sammen med `entra-tenant-id`, `entra-sso-client-id` og
`entra-domene`.

### Legg inn redirect-adressen og TXT-posten

Forvalteren gir redirect-adressen og TXT-posten når SSO er registrert i Neo.

1. Legg redirect-adressen inn på appen under Web, tegn for tegn.
2. Legg TXT-posten inn i DNS for domenet. Verdien gjelder i 7 døgn.

Ferdig når forvalteren har verifisert domenet i Neo.

### Prøv innloggingen

Logg inn med én bruker i domenet: åpne Neo i et inkognitovindu, velg «Logg inn med SSO», skriv e-postadressen og logg
inn hos Microsoft.

Ferdig når brukeren lander i Neo som medlem av organisasjonen. Uten SCIM blir en bruker i domenet medlem første gang
hen logger inn.

### Slå på «Kun SSO»

«Kun SSO» stenger passordinnlogging for domenet. Rollene og tilgangsgruppene fra Entra gjelder bare når det er på.

En administrator hos kunden gjør det i Neo:

1. Forvalteren gir en bruker i domenet tilgangsnivået Administrator i Neo.
2. Administratoren logger inn i Neo med Entra ID.
3. I samme økt slår administratoren på bryteren på kortet «Kun SSO».

Neo slår det bare på når den som gjør det, er logget inn med Entra ID, og minst én administrator har logget inn med
Entra ID. Sjekklista på kortet viser hvilket krav som mangler.

Ferdig når kortet viser at «Kun SSO» er på.

### Slå på provisjoneringen

Forvalteren slår på SCIM i Neo, legger tokenet i hvelvet som `entra-scim-token` og gir Tenant URL.

1. Under Provisioning på appen: sett den til «Automatic».
2. Lim inn Tenant URL og tokenet fra hvelvet, og test tilkoblingen.
3. Mappingene for brukere: hent både `userName` og e-posten (`emails[type eq "work"].value`) fra
   `userPrincipalName`. Er de ulike, blir brukeren opprettet to ganger.
4. Mappingene for grupper: la standardmappingen `objectId` til `externalId` stå. Den kobler gruppene til rollene i Neo.

Ferdig når testen av tilkoblingen går gjennom, og mappingene står som over.

### Prøv én bruker og start provisjoneringen

1. Prøv én bruker med «Provision on demand». Stegene skal gå gjennom til eksporten.
2. Start provisjoneringen. En prøve for én bruker sender ikke gruppene, og provisjoneringen står stille til den er
   startet.

Ferdig når den første syklusen har gått, og brukerne i de tildelte gruppene står i Neo med rollene gruppene gir.

### Kjør kontrollrunden

Gjør hver handling i Entra. Forvalteren kontrollerer resultatet i Neo etter neste syklus.

| Handling i Entra | Forventet i Neo |
|---|---|
| En ny bruker legges i en tildelt gruppe | Brukeren blir medlem, med jobbrollene og tilgangsgruppene gruppen gir |
| En bruker flyttes til en annen gruppe | Rollene fra den første gruppen fjernes, og rollene fra den andre gis |
| En bruker tas ut av alle de tildelte gruppene | Medlemskapet fjernes |
| En bruker deaktiveres | Medlemskapet fjernes, og øktene avsluttes |
| Brukeren aktiveres igjen | Medlemskapet kommer tilbake |

Ferdig når alle fem gir det som står i tabellen.

## Valgfritt: testbrukere

Kunden kan prøve løpet på testbrukere i et testunderdomene før de ansatte. Et underdomene av et domene som alt er
verifisert i Entra, trenger ingen ny DNS-post.

Kunden kan også lage to medlemsbrukere i domenet for forvalteren. Gjestebrukere virker ikke, fordi Neo krever at UPN
er i domenet. Med dem prøver forvalteren innloggingen og slår på «Kun SSO» selv. Kunden bestemmer MFA og
tilgangsreglene for dem, og deaktiverer dem når prosjektet er ferdig.

## Det som legges i hvelvet

| Navn | Verdien | Hvem |
|---|---|---|
| `entra-tenant-id` | Directory (tenant) ID | Kunden |
| `entra-sso-client-id` | Application (client) ID til appen | Kunden |
| `entra-sso-client-secret` | Client secret, med utløpsdato | Kunden |
| `entra-domene` | Domenet de ansatte logger inn med | Kunden |
| `entra-scim-token` | Tokenet for provisjoneringen | Forvalteren |

`entra-tenant-id` brukes også av [Exchange Online](exchange.md) og [Documaster](../../documaster/docs/documaster.md).

## Det forvalteren gjør i Neo

1. Registrerer SSO under organisasjonens administrasjon, fanen SSO: tenant-ID, klient-ID, client secret og domenet.
   Underdomener av domenet er med.
2. Gir kunden redirect-adressen og TXT-posten.
3. Verifiserer domenet når TXT-posten er lagt inn.
4. Slår på SCIM når «Kun SSO» er på, legger tokenet i hvelvet og gir kunden Tenant URL.
5. Kobler hver gruppe (Object ID) til jobbrollene og tilgangsgruppene som er avgjort.
6. Kontrollerer kontrollrunden i Neo.

## Når innloggingen er i drift

- En bruker som ikke er provisjonert, kommer ikke inn.
- En bruker som deaktiveres eller tas ut av appen, mister tilgangen med en gang.
- Medlemmer Entra styrer, fjernes i Entra, ikke i Neo.
- Tilgangsnivået i Neo (eier, administrator, medlem) settes i Neo, aldri fra Entra.
- En rolle gitt for hånd i Neo står, også når gruppen som ga den samme rollen, tas bort.
- Tenant, domene og innloggingsoppsettet kan ikke endres før provisjoneringen er slått av.
- Client secret byttes før utløpsdatoen.
- Entra synker i sykluser, så en endring er ikke i Neo med en gang. «Provision on demand» synker én bruker straks.

## Feil som pleier å komme

| Feilen | Årsaken | Rettes med |
|---|---|---|
| `AADSTS50105` ved innlogging | Brukeren er ikke tildelt appen | [Tildel gruppen](#lag-gruppene-og-tildel-dem-til-appen). Det kan ta et minutt før det slår inn |
| «… trenger tillatelse … som bare en administrator kan godkjenne» | Administratorsamtykket mangler | [Samtykket](#gjør-appen-klar-til-innlogging) for `openid` og `profile` |
| `AADSTS50011` | Redirect-adressen i Entra er ikke lik den Neo sender | Kopier den på nytt fra forvalteren |
| «Identitetsleverandøren sendte ikke brukernavnet (UPN)» | Claimet `upn` mangler på ID-tokenet | [Legg på claimet](#gjør-appen-klar-til-innlogging) |
| «Microsoft-brukernavnet ditt (UPN) hører ikke til domenet …» | UPN-en ligger utenfor det verifiserte domenet | Endre UPN-en, eller verifiser riktig domene |
| «Du er ikke tildelt Neo i organisasjonens katalog» | Brukeren er ikke provisjonert | Legg brukeren i en tildelt gruppe, og vent på neste syklus |
| «Fant ikke TXT-posten med riktig verdi» | DNS er ikke oppdatert, eller posten har feil navn | Vent noen minutter. Navnet skal ha med underdomenet |
| «Sett opp SSO og verifiser domenet før du slår på SCIM» | Domenet er ikke verifisert | [Legg inn TXT-posten](#legg-inn-redirect-adressen-og-txt-posten), og la forvalteren verifisere domenet |
| Brukerne er i Neo, men ingen har fått roller | Provisjoneringen er ikke startet, så gruppene er ikke sendt | [Start provisjoneringen](#prøv-én-bruker-og-start-provisjoneringen) |
| Brukeren finnes to ganger i Neo | E-posten i provisjoneringen er en annen enn UPN-en | [Mappingene](#slå-på-provisjoneringen) |
| Medlemmene i en gruppe får ikke rollen | Gruppen er nestet, eller ikke en sikkerhetsgruppe | Legg brukerne inn som direkte medlemmer av en sikkerhetsgruppe |
| Koblingene til roller kan ikke endres, og kortet viser «Krever Kun SSO» | «Kun SSO» er av | [Slå på «Kun SSO»](#slå-på-kun-sso) |
