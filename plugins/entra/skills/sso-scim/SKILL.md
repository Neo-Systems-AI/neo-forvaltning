---
name: sso-scim
description: Setter opp innlogging med Microsoft Entra ID (SSO) og automatisk brukerprovisjonering (SCIM) for en organisasjon i Neo, med grupper i Entra koblet til jobbroller og tilgangsgrupper. Dekker hele løpet i rekkefølgen Neo krever, med az-kommandoene, hva bare et menneske gjør, kontrollen etter hvert steg og feilene som pleier å komme. Last når SSO eller SCIM skal settes opp, prøves på testbrukere eller feilsøkes.
---

# SSO og SCIM mot Entra ID

Løpet kobler organisasjonens Entra-tenant til Neo: medlemmene logger inn med Microsoft-kontoen sin, Entra oppretter
og deaktiverer dem i Neo, og gruppene i Entra gir jobbroller og tilgangsgrupper.

**Hva som er prøvd:** del 1–6 er kjørt mot en Entra-tenant 2026-11-17, med `az`-kommandoene slik de står: SSO med
innlogging, «Kun SSO», SCIM og to grupper koblet til hver sin jobbrolle og tilgangsgruppe. Etter første syklus var tre
testbrukere medlemmer med riktig rolle og tilgangsgruppe, en bruker som alt hadde logget inn med SSO ble koblet på og
ikke opprettet på nytt, og tilgangsnivået i Neo sto urørt. Flytting mellom grupper og deaktivering i del 7 er også
kjørt, og kom inn i Neo i neste syklus. Portal-stegene i del 5 og gjenoppretting av en deaktivert bruker er ikke kjørt. Feilene under «Feil som pleier å komme» er de som kom underveis, pluss de Neo
selv melder.

## 0. Hvem gjør hva

| Steg | Agent | Menneske |
|---|---|---|
| Gi kommandoene, lese utdataene, finne feilen | ✅ | |
| Kjøre `az` mot tenanten | | ✅ med sin egen innlogging |
| Client secret og SCIM-token | ❌ ser dem aldri | ✅ kopierer rett fra kilden til målet |
| Lagre oppsettet i Neo, slå på «Kun SSO» og SCIM | | ✅ som administrator i organisasjonen |
| TXT-posten i DNS | | ✅ |
| Logge inn som en testbruker | ❌ | ✅ |

Client secret og SCIM-tokenet limes aldri inn i chatten, i en fil eller i config. Kommandoen som lager en client
secret, skriver den ut i terminalen; den kjøres av mennesket.

## Det du trenger

- **I Entra:** en konto som kan opprette apper, gi administratorsamtykke og tildele grupper til en app, for eksempel
  Cloud Application Administrator. Skal du lage testbrukere og grupper, trengs også User Administrator.
- **I Neo:** administrator i organisasjonen, med organisasjonen som aktiv.
- **I DNS:** noen som kan legge inn en TXT-post på e-postdomenet.
- **Lisens:** Neo oppgir at det å tildele grupper (ikke bare enkeltbrukere) til en app krever Entra ID P1 eller P2. I
  prøven gikk tildelingen med kommandoen i del 2 gjennom i en tenant uten lisens, så kommandoen stopper deg ikke.
  Avklar lisensen med Microsoft før gruppene tas i bruk for de ansatte.
- **Azure CLI**, logget inn som deg selv i tenanten. `az account show --query user` skal vise `"type": "user"`.

Sidene i Neo ligger under organisasjonens administrasjon, fanen **SSO**. Den viser redirect-URI-en, TXT-posten,
Tenant URL for SCIM og de samme stegene som her.

### Om kommandoene

- Kjør alt i **samme terminal**. Variablene lever bare i skallet de ble satt i.
- Verdier du skal fylle inn, står som `LIM-INN-…`. Skriv aldri `<…>` i en kommando: zsh leser vinkelparenteser som
  omdirigering og svarer `parse error`.
- `-o table` skjuler kolonnen `id`. Hent en ID med `-o tsv`.

```bash
az login --allow-no-subscriptions
```

```bash
TENANT=$(az account show --query tenantId -o tsv); echo "$TENANT"
```

## 1. Prøv på testbrukere først (valgfritt)

Vil du prøve løpet uten å røre de ansatte, bruk et underdomene og egne testbrukere. Et underdomene av et domene
tenanten alt har verifisert, blir verifisert i Entra uten ny DNS-post.

```bash
DOMENE=neotest.kommune.example
```

```bash
az rest --method POST --url https://graph.microsoft.com/v1.0/domains --body "{\"id\":\"$DOMENE\"}" --query isVerified
```

Svaret skal være `true`. Sett et passord for testbrukerne; `read -s` viser ingenting mens du skriver, og er ferdig
når du trykker Enter.

```bash
read -s "PASSORD?Passord for testbrukerne: "
```

```bash
for n in 1 2 3; do az ad user create --display-name "Neo Test $n" --user-principal-name "neotest$n@$DOMENE" --password "$PASSORD" --force-change-password-next-sign-in false --query userPrincipalName; done
```

To sikkerhetsgrupper, med brukerne som **direkte** medlemmer. Nestede grupper telles ikke med.

```bash
G1=$(az ad group create --display-name "Neo test – Saksbehandler" --mail-nickname neotest-saksbehandler --query id -o tsv); G2=$(az ad group create --display-name "Neo test – Leder" --mail-nickname neotest-leder --query id -o tsv); echo "$G1 $G2"
```

```bash
for n in 1 2; do az ad group member add --group "$G1" --member-id "$(az ad user show --id "neotest$n@$DOMENE" --query id -o tsv)"; done; az ad group member add --group "$G2" --member-id "$(az ad user show --id "neotest3@$DOMENE" --query id -o tsv)"
```

De to ID-ene `echo` skrev ut, er gruppenes Object ID. Det er dem du kobler til roller i del 6.

Setter du opp for de ansatte, hopper du over denne delen: `DOMENE` er da e-postdomenet deres, og gruppene er de
dere lager for Neo.

## 2. Appen i Entra

Appen lages fra Microsofts mal for egne apper. Det er malen som gir fanen Provisioning, som SCIM trenger i del 5; en
app laget bare som appregistrering har den ikke.

```bash
az rest --method POST --url https://graph.microsoft.com/v1.0/applicationTemplates/8adf8e6e-67b2-4cf2-a259-e3dc5476c621/instantiate --body '{"displayName":"Neo"}' --query "{appId:application.appId, spId:servicePrincipal.id}"
```

```bash
APP_ID=LIM-INN-appId; SP_ID=LIM-INN-spId
```

Det samme i portalen: Enterprise applications → New application → Create your own application → «Integrate any
other application you don't find in the gallery».

Gjør appen single tenant og legg det valgfrie claimet `upn` på ID-tokenet. Neo leser hvem som logger inn, fra `upn`.
Svarer kommandoen at appen ikke finnes, vent et halvt minutt: en ny app bruker litt tid på å bli synlig.

```bash
az ad app update --id "$APP_ID" --sign-in-audience AzureADMyOrg --optional-claims '{"idToken":[{"name":"upn","essential":false}]}'
```

```bash
az ad app show --id "$APP_ID" --query "{audience:signInAudience, claims:optionalClaims.idToken[].name}"
```

Svaret skal vise `AzureADMyOrg` og `upn`.

**Administratorsamtykke.** Neo ber om `openid` og `profile` ved innlogging, og ikke noe mer. I en tenant der brukerne
ikke får samtykke selv, må en administrator godkjenne de to for alle:

```bash
GRAPH_SP=$(az ad sp show --id 00000003-0000-0000-c000-000000000000 --query id -o tsv)
```

```bash
az rest --method POST --url https://graph.microsoft.com/v1.0/oauth2PermissionGrants --body "{\"clientId\":\"$SP_ID\",\"consentType\":\"AllPrincipals\",\"resourceId\":\"$GRAPH_SP\",\"scope\":\"openid profile\"}" --query "{scope:scope, type:consentType}"
```

**Tildel gruppene til appen.** En app fra malen har «Assignment required» slått på, så ingen kommer inn før de er
tildelt. Det er samme liste SCIM provisjonerer i del 5.

```bash
ROLLE=$(az ad sp show --id "$SP_ID" --query "appRoles[?displayName=='User'].id | [0]" -o tsv); echo "$ROLLE"
```

```bash
for g in "$G1" "$G2"; do az rest --method POST --url "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/appRoleAssignedTo" --body "{\"principalId\":\"$g\",\"resourceId\":\"$SP_ID\",\"appRoleId\":\"$ROLLE\"}" --query principalDisplayName; done
```

Svaret skal være de to gruppenavnene.

**Client secret.** Mennesket kjører denne og kopierer `password` rett inn i Neo. Den vises én gang.

```bash
az ad app credential reset --id "$APP_ID" --display-name neo --years 1
```

## 3. SSO i Neo

1. Åpne fanen **SSO** i organisasjonens administrasjon.
2. Fyll inn «Directory (tenant) ID» (`$TENANT`), «Application (client) ID» (`$APP_ID`), «Client secret» og
   «E-postdomene» (`$DOMENE`). Underdomener av domenet er inkludert.
3. Velg «Lagre og fortsett». Siden viser nå redirect-URI-en og TXT-posten.
4. Legg redirect-URI-en inn i Entra, tegn for tegn slik siden viser den:

```bash
az ad app update --id "$APP_ID" --web-redirect-uris "LIM-INN-redirect-URI-en-fra-siden"
```

5. Legg TXT-posten inn i DNS med navnet og verdien siden viser. Verdien er gyldig i 7 døgn.
6. Velg «Verifiser domenet». Statusen skal gå fra «Venter på domeneverifisering» til «Aktiv».

**Prøv innloggingen nå, før SCIM slås på.** Uten SCIM blir en bruker i domenet medlem første gang hen logger inn. Med
SCIM på avvises alle Entra ikke har provisjonert, så en feil i SSO-oppsettet er lettere å finne her.

1. Åpne innloggingssiden til Neo i et inkognitovindu.
2. Velg «Logg inn med SSO» og skriv e-postadressen til en bruker i domenet.
3. Logg inn hos Microsoft.

Brukeren skal lande i Neo som medlem av organisasjonen.

## 4. Kun SSO

«Kun SSO» stenger passordinnlogging for domenet. Roller og tilgangsgrupper fra Entra gis bare mens det er på: ellers
kunne noen logge inn med passord og beholde en rolle fra en gruppe de er tatt ut av.

Neo slår det ikke på før disse to holder, så ingen låser seg ute:

- **Du er selv logget inn med organisasjonens Entra ID** i økten du slår det på fra.
- **Minst én administrator har logget inn med Entra ID.**

I praksis: gi en bruker i domenet tilgangsnivået Administrator i medlemslista i Neo, logg inn som den med SSO, og slå
på bryteren på kortet «Kun SSO» i den økten. Sjekklista på kortet viser hvilket krav som mangler.

## 5. SCIM

I Neo: velg «Slå på SCIM» på SSO-siden. Dialogen «Kopier tokenet nå» viser tokenet én gang, og kortet viser
«Tenant URL». Resten gjøres i Entra, i portalen eller med `az`.

### I portalen

1. Enterprise applications → appen → Provisioning → «Automatic».
2. Lim inn «Tenant URL» fra siden i Neo og tokenet som «Secret Token», og velg «Test connection».
3. Mappings → Users: map `userPrincipalName` til både `userName` og `emails[type eq "work"].value`. Neo bruker UPN
   som e-post ved innlogging. Er de to ulike, blir brukeren opprettet to ganger.
4. Mappings → Groups: la standardmappingen `objectId` → `externalId` stå. Det er nøkkelen koblingene i Neo slår opp
   på.
5. Kontroller under Users and groups at gruppene fra del 2 står der, og slå på provisjoneringen.

### Med az

Kommandoene bruker `jq`. Mennesket leser tokenet inn i en variabel uten å vise det:

```bash
read -s "SCIM_TOKEN?SCIM-token: "
```

```bash
SCIM_URL="LIM-INN-Tenant-URL-fra-siden"
```

Lag provisjoneringsjobben fra malen `scim`. ID-en du får tilbake, begynner med `scim.`:

```bash
JOB_ID=$(az rest --method POST --url "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/synchronization/jobs" --body '{"templateId":"scim"}' --query id -o tsv); echo "$JOB_ID"
```

Test tilkoblingen og lagre den. Ingen av de to gir utdata når de går bra:

```bash
az rest --method POST --url "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/synchronization/jobs/$JOB_ID/validateCredentials" --body "{\"credentials\":[{\"key\":\"BaseAddress\",\"value\":\"$SCIM_URL\"},{\"key\":\"SecretToken\",\"value\":\"$SCIM_TOKEN\"}]}"
```

```bash
az rest --method PUT --url "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/synchronization/secrets" --body "{\"value\":[{\"key\":\"BaseAddress\",\"value\":\"$SCIM_URL\"},{\"key\":\"SecretToken\",\"value\":\"$SCIM_TOKEN\"}]}"
```

Bytt kilden for e-posten fra `[mail]` til `[userPrincipalName]`. `userName` hentes alt fra UPN i malen.

```bash
az rest --method GET --url "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/synchronization/jobs/$JOB_ID/schema" > schema.json
```

```bash
jq '(.synchronizationRules[].objectMappings[] | select(.sourceObjectName=="User") | .attributeMappings[] | select(.targetAttributeName=="emails[type eq \"work\"].value") | .source) = {"expression":"[userPrincipalName]","name":"userPrincipalName","type":"Attribute","parameters":[]}' schema.json > schema-ny.json
```

```bash
az rest --method PUT --url "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/synchronization/jobs/$JOB_ID/schema" --body @schema-ny.json
```

Les tilbake det Entra har lagret. Begge linjene skal peke på `[userPrincipalName]`:

```bash
az rest --method GET --url "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/synchronization/jobs/$JOB_ID/schema" | jq -r '.synchronizationRules[].objectMappings[] | select(.sourceObjectName=="User") | .attributeMappings[] | select(.targetAttributeName=="userName" or (.targetAttributeName|startswith("emails"))) | "\(.targetAttributeName) <- \(.source.expression)"'
```

Prøv én bruker før jobben startes. Svaret er én tekststreng med JSON inni, så den pakkes ut med `jq`:

```bash
REGEL=$(jq -r '.synchronizationRules[0].id' schema.json); BRUKER=$(az ad user show --id "neotest2@$DOMENE" --query id -o tsv)
```

```bash
az rest --method POST --url "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/synchronization/jobs/$JOB_ID/provisionOnDemand" --body "{\"parameters\":[{\"ruleId\":\"$REGEL\",\"subjects\":[{\"objectId\":\"$BRUKER\",\"objectTypeName\":\"User\"}]}]}" --query value -o tsv | jq -r '.[].provisioningSteps[] | "\(.type): \(.status) \(.description)"'
```

Stegene er import, treff i Neo, omfang og eksport. Står eksporten som `Skipped` med «already match», er brukeren alt
lik i Entra og Neo.

**Start jobben.** En prøve for én bruker sender ikke gruppene, og en ny jobb står stille til den er startet:

```bash
az rest --method POST --url "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/synchronization/jobs/$JOB_ID/start"
```

```bash
az rest --method GET --url "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_ID/synchronization/jobs/$JOB_ID" --query "status.{kode:code, sist:lastExecution.state, startet:lastExecution.timeBegan, feil:lastExecution.error.message, karantene:quarantine.reason}"
```

En jobb som aldri har kjørt, viser `Paused` og `Failed` med tidspunktet `0001-01-01`. Det er standardverdiene, ikke
en feil. Etter start går `kode` til `Active`, og den første syklusen sender brukerne og gruppene i løpet av noen
minutter.

```bash
rm schema.json schema-ny.json; unset SCIM_TOKEN
```

### Etter at SCIM er på

Entra synker i sykluser, så en endring er ikke i Neo med en gang. «Provision on demand» synker én bruker straks.

Med SCIM på gjelder dette:

- En bruker som ikke er provisjonert, kommer ikke inn med SSO.
- En bruker som deaktiveres eller fjernes fra appen i Entra, mister tilgangen til Neo med en gang.
- Et medlem Entra styrer, fjernes i Entra, ikke i Neo.
- Tenant, domene og SSO-oppsettet kan ikke endres før SCIM er slått av.

## 6. Grupper til jobbroller og tilgangsgrupper

Under «Roller og tilgangsgrupper fra Entra» på SSO-siden:

1. Velg «Koble gruppe».
2. Lim inn gruppens Object ID som «Gruppe-ID (Object ID)». Det er ID-en, ikke gruppenavnet.
3. Gi koblingen en etikett, og velg jobbrollene og tilgangsgruppene gruppen skal gi.

Tilgangsnivået (eier, administrator, medlem) styres alltid i Neo, aldri fra Entra. Med SCIM på slår en endring inn
med en gang for brukerne Entra har provisjonert; uten SCIM ved brukerens neste innlogging.

Bruker organisasjonen roller fra grupper **uten** SCIM, må gruppene også komme i ID-tokenet: Token configuration →
Add groups claim → «Groups assigned to the application», med formatet «Group ID». Ikke «Security groups» eller «All
groups»: de sender alle gruppene brukeren er i. Med SCIM på leses ikke claimet.

## 7. Kontroll

Prøv hvert av disse, og se etter resultatet i medlemslista i Neo:

| Handling i Entra | Forventet i Neo |
|---|---|
| En ny bruker legges i en tildelt gruppe | Brukeren blir medlem, med jobbrollene og tilgangsgruppene gruppen gir |
| En bruker flyttes fra én gruppe til en annen | Rollene og tilgangsgruppene fra den første fjernes, de fra den andre gis |
| En bruker tas ut av alle tildelte grupper | Medlemskapet revokeres |
| En bruker deaktiveres | Medlemskapet revokeres, og øktene avsluttes |
| Brukeren aktiveres igjen | Medlemskapet gjenopprettes |

En rolle eller tilgangsgruppe gitt for hånd i Neo står, også når gruppen som ga den samme, tas bort.

## Feil som pleier å komme

| Feil | Årsak | Rettes med |
|---|---|---|
| `AADSTS50105` ved innlogging | Appen har «Assignment required», og brukeren er ikke tildelt | Tildel gruppen til appen (del 2). Det kan ta et minutt før det slår inn |
| «… trenger tillatelse … som bare en administrator kan godkjenne» | Tenanten krever administratorsamtykke | Samtykket for `openid` og `profile` (del 2) |
| `AADSTS50011` | Redirect-URI-en i Entra er ikke lik den Neo sender | Kopier den på nytt fra SSO-siden |
| «Identitetsleverandøren sendte ikke brukernavnet (UPN)» | Claimet `upn` mangler på ID-tokenet | `--optional-claims` i del 2 |
| «Microsoft-brukernavnet ditt (UPN) hører ikke til domenet …» | Brukerens UPN ligger utenfor det verifiserte domenet | Endre UPN-en, eller verifiser riktig domene |
| «Du er ikke tildelt Neo i organisasjonens katalog» | SCIM er på, og brukeren er ikke provisjonert | Legg brukeren i en tildelt gruppe og vent på neste syklus |
| «Fant ikke TXT-posten med riktig verdi» | DNS er ikke oppdatert ennå, eller posten har feil navn | Vent noen minutter. Navnet skal ha med underdomenet |
| «Sett opp SSO og verifiser domenet før du slår på SCIM» | Domenet er ikke verifisert | Del 3 |
| Kortet for roller viser «Krever Kun SSO», og koblingene kan ikke endres | «Kun SSO» er av for organisasjonen | Del 4: slå det på med bryteren på SSO-siden, og last siden på nytt |
| Brukerne er i Neo, men ingen har fått roller fra gruppene | Jobben er ikke startet, så gruppene er ikke sendt | «Start jobben» i del 5 |
| Brukeren finnes to ganger i Neo | SCIM-e-posten er en annen enn UPN-en | Mappingen i del 5, steg 4 |
| Medlemmene i en gruppe får ikke rollen | Gruppen er nestet, eller ikke en sikkerhetsgruppe | Legg brukerne inn som direkte medlemmer av en sikkerhetsgruppe |

## Rydde etter en prøve

Slå av SCIM og «Kun SSO» og koble fra SSO i Neo først, i den rekkefølgen. Slett så det som ble laget i Entra:

```bash
az ad app delete --id "$APP_ID"
```

```bash
for g in "$G1" "$G2"; do az ad group delete --group "$g"; done; for n in 1 2 3; do az ad user delete --id "neotest$n@$DOMENE"; done
```

```bash
az rest --method DELETE --url "https://graph.microsoft.com/v1.0/domains/$DOMENE"
```
