---
name: set-up-sso
description: Setter opp innlogging med Microsoft Entra ID (SSO) og automatisk brukerprovisjonering (SCIM) for en organisasjon i Neo, med grupper i Entra koblet til jobbroller og tilgangsgrupper. Dekker hele løpet i rekkefølgen Neo krever, med az-kommandoene, hva agenten gjør i Neo over MCP, hva bare et menneske gjør, kontrollen etter hvert steg og feilene som pleier å komme. Last når SSO eller SCIM skal settes opp, prøves på testbrukere eller feilsøkes.
---

# SSO og SCIM mot Entra ID

Løpet kobler organisasjonens Entra-tenant til Neo: medlemmene logger inn med Microsoft-kontoen sin, Entra oppretter
og deaktiverer dem i Neo, og gruppene i Entra gir jobbroller og tilgangsgrupper.

**Oppskriften står i `${CLAUDE_PLUGIN_ROOT}/docs/entra.md`:** hva kunden gjør og i hvilken rekkefølge, hva som legges i
hvelvet, hva forvalteren gjør i Neo, kontrollrunden, hvordan det er i drift, og feilene som pleier å komme. Les den
først. Her står hvordan stegene gjøres med `az` og over MCP, og hvem som gjør hva; oppskriften gjentas ikke.

**Det som ikke er prøvd mot en Entra-tenant:** portal-stegene i del 5, å gjenopprette en deaktivert bruker, og
stegene agenten gjør i Neo over MCP (merket **Agenten** under). Resten er kjørt med `az`-kommandoene slik de står.
Feilene under «Feil som pleier å komme» er de som kommer underveis, pluss de Neo selv melder.

## 0. Hvem gjør hva

| Steg | Agent | Menneske |
|---|---|---|
| Gi kommandoene, lese utdataene, finne feilen | ✅ | |
| Kjøre `az` mot tenanten | | ✅ med sin egen innlogging |
| Client secret og SCIM-token | ❌ ser dem aldri | ✅ kopierer rett fra kilden til målet |
| Lagre SSO-oppsettet i Neo (med client secret) | ❌ | ✅ i nettleseren, som administrator |
| Lese redirect-URI, TXT-post, Tenant URL og status fra Neo | ✅ over MCP | eller leser dem av SSO-siden |
| Verifisere domenet i Neo | ✅ over MCP | eller «Verifiser domenet» |
| TXT-posten i DNS | | ✅ |
| Gi en bruker tilgangsnivået Administrator | ❌ | ✅ i nettleseren |
| Slå på «Kun SSO» | ❌ | ✅ i nettleseren, innlogget med Entra |
| Slå på SCIM og kopiere tokenet | ❌ | ✅ i nettleseren |
| Lage tilgangsgrupper og koble Entra-grupper til roller | ✅ over MCP | eller «Koble gruppe» |
| Slå av SCIM og «Kun SSO», koble fra SSO, slette | ❌ | ✅ i nettleseren |
| Logge inn som en testbruker | ❌ | ✅ |

Client secret og SCIM-tokenet limes aldri inn i chatten, i en fil eller i config. Kommandoen som lager en client
secret, skriver den ut i terminalen; den kjøres av mennesket.

### Verktøyene i Neo

Er Neo koblet til Claude Code som MCP-server, gjør agenten stegene merket **Agenten** selv. Ellers gjør mennesket
dem i nettleseren, slik de også står beskrevet. Løpet er det samme.

| Verktøy | Hva |
|---|---|
| `get_sso_setup` | Oppsettet: tenant, klient-ID, domene, redirect-URI, TXT-posten, om domenet er verifisert, om «Kun SSO» er på |
| `verify_sso_domain` | Ber Neo slå opp TXT-posten i DNS |
| `get_scim_status` | Tenant URL, om SCIM er på, antall provisjonerte brukere, og når hvert token sist ble brukt |
| `list_access_groups`, `create_access_group` | Tilgangsgruppene med medlemmer, og en ny, tom gruppe |
| `list_entra_group_mappings`, `create_entra_group_mapping`, `update_entra_group_mapping` | Entra-gruppene koblet til jobbroller og tilgangsgrupper |

For at verktøyene skal finnes:

- **Tilkoblingen må gjelde organisasjonen SSO settes opp i.** Det er produksjonsorganisasjonen, ikke sandkassen:
  SSO og SCIM finnes ikke der. Sjekk hvilken MCP-server som er koblet til, før du skriver noe.
- **Personen må være eier eller administrator** i organisasjonen. Andre får avslag på hvert av verktøyene.
- **Tilkoblingen må være laget etter at Neo fikk verktøyene.** «Koble til Claude» gir tilkoblingen tilgangene som
  fantes da den ble laget. Mangler verktøyene i en eldre tilkobling, lager en administrator en ny under
  API-klienter i Neo.

#### Koble til produksjonsorganisasjonen

Hopp over dette når verktøyene alt finnes for riktig organisasjon.

1. **Mennesket**, i Neo, som eier eller administrator i organisasjonen SSO settes opp i: Administrasjon →
   API-klienter → «Koble til Claude» → Claude Code. Neo viser en kommando med klient-ID-en fylt inn. Klient-ID-en er
   ikke en hemmelighet.
2. **Mennesket** kjører kommandoen i repoet. Har repoet en `.claude/neo.config.json`, bruk navnet den har for miljøet (`neo-produksjon`) og `--scope project`, så de andre pluginene finner samme
   server:

```bash
claude mcp add --scope project --transport http --client-id LIM-INN-klient-ID neo-produksjon LIM-INN-adresse/api/mcp
```

3. **Mennesket** logger inn med `/mcp` og velger serveren. Det kan ikke gjøres for dem. Start Claude Code på nytt.
4. **Agenten:** `get_sso_setup`. Svaret har `organizationId`; kontroller med mennesket at det er riktig
   organisasjon før noe skrives.

Et repo er som standard koblet til sandkassen. Den tilkoblingen kan ikke brukes her.

Det agenten skriver i Neo, gjelder med en gang. En gruppe koblet til en rolle gir rollen til medlemmene straks når
SCIM er på. Si hva du skal skrive, og få et ja, før `create_access_group`, `create_entra_group_mapping` og
`update_entra_group_mapping`.

## Det du trenger

- **I Entra:** en konto som kan opprette apper, gi administratorsamtykke og tildele grupper til en app, for eksempel
  Cloud Application Administrator. Skal du lage testbrukere og grupper, trengs også User Administrator.
- **I Neo:** administrator i organisasjonen, med organisasjonen som aktiv.
- **I DNS:** noen som kan legge inn en TXT-post på e-postdomenet.
- **Lisens:** Neo oppgir at det å tildele grupper (ikke bare enkeltbrukere) til en app krever Entra ID P1 eller P2.
  Tildelingen med kommandoen i del 2 går gjennom også i en tenant uten lisens, så kommandoen stopper deg ikke.
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

1. **Mennesket:** åpne fanen **SSO** i organisasjonens administrasjon.
2. **Mennesket:** fyll inn «Directory (tenant) ID» (`$TENANT`), «Application (client) ID» (`$APP_ID`), «Client
   secret» og «E-postdomene» (`$DOMENE`). Underdomener av domenet er inkludert.
3. **Mennesket:** velg «Lagre og fortsett». Siden viser nå redirect-URI-en og TXT-posten.
4. **Agenten:** `get_sso_setup`. Kontroller at `entraTenantId`, `clientId` og `domain` er de som ble satt i del 2,
   og gi kommandoen under med `redirectUri` fylt inn, tegn for tegn. Uten MCP: mennesket kopierer den fra siden.

```bash
az ad app update --id "$APP_ID" --web-redirect-uris "LIM-INN-redirect-URI-en-fra-siden"
```

5. **Mennesket:** legg TXT-posten inn i DNS. Navnet og verdien står i `verificationRecord` (`name`, `value`), og på
   siden. Verdien er gyldig i 7 døgn (`expiresAt`).
6. **Agenten:** `verify_sso_domain`. Svaret skal ha `domainVerified: true`. Finner Neo ikke posten ennå, vent noen
   minutter og prøv igjen; endre ingenting. Uten MCP: mennesket velger «Verifiser domenet», og statusen skal gå fra
   «Venter på domeneverifisering» til «Aktiv».

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

Alt i denne delen gjør **mennesket** i nettleseren. Neo slår det ikke på fra en tilkobling, fordi kravet er økten
du er innlogget i. **Agenten** bekrefter etterpå med `get_sso_setup`: `ssoOnly` skal være `true`.

Slås «Kun SSO» på fra en økt som ikke er en Entra-innlogging, skjer det ikke. Men en tilkobling til Claude som ble
godkjent fra en passord-økt, slutter å virke i det «Kun SSO» slås på. Logg da inn i Claude Code på nytt med `/mcp`,
denne gangen med Entra.

## 5. SCIM

**Mennesket**, i Neo: velg «Slå på SCIM» på SSO-siden. Dialogen «Kopier tokenet nå» viser tokenet én gang, og
kortet viser «Tenant URL». Resten gjøres i Entra, i portalen eller med `az`.

**Agenten:** `get_scim_status` før mennesket begynner. `ssoReady` skal være `true`, ellers er del 3 ikke ferdig.
Etterpå skal `state` være `active`, og `tenantUrl` er adressen til `SCIM_URL` under.

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

Agenten fyller inn `tenantUrl` fra `get_scim_status`. Tokenet leser mennesket inn selv, med linja over.

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

**Agenten:** `get_scim_status` når syklusen har gått. `lastUsedAt` på tokenet skal ha fått et tidspunkt (Entra har
nådd Neo), og `provisionedUsers.active` skal være antallet brukere i de tildelte gruppene.

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

Avklar med mennesket først hvilke jobbroller og tilgangsgrupper hver gruppe i Entra skal gi. Det er en beslutning
om hvem som får gjøre hva, og den er organisasjonens.

**Agenten**, over MCP:

1. `list_entra_group_mappings`. `ssoOnly` skal være `true` (del 4), og gruppen skal ikke stå der fra før.
2. `list_access_groups` for `id`-ene til tilgangsgruppene. Mangler en, lag den med `create_access_group`. En ny
   gruppe er tom og begrenser ingen saker før en administrator velger den på en sakstype i Neo.
3. `create_entra_group_mapping` per gruppe, med `externalGroupId` (Object ID-en, `$G1` og `$G2` fra del 1),
   `label`, `roleCodes` og `teamIds`. Begge listene sendes, og minst én av dem har innhold. Hvilke jobbroller som
   finnes, står i beskrivelsen av verktøyet.
4. `appliesAt` i svaret sier når det slår inn: `NOW` med SCIM på, `NEXT_SYNC` ved medlemmenes neste innlogging.

En kobling endres med `update_entra_group_mapping`. Den erstatter begge settene, så send alt gruppen skal gi, også
det som skal stå. En kobling slettes i nettleseren.

**Uten MCP**, under «Roller og tilgangsgrupper fra Entra» på SSO-siden:

1. Velg «Koble gruppe».
2. Lim inn gruppens Object ID som «Gruppe-ID (Object ID)». Det er ID-en, ikke gruppenavnet.
3. Gi koblingen en etikett, og velg jobbrollene og tilgangsgruppene gruppen skal gi.

Tilgangsnivået (eier, administrator, medlem) styres alltid i Neo, aldri fra Entra. Med SCIM på slår en endring inn
med en gang for brukerne Entra har provisjonert; uten SCIM ved brukerens neste innlogging.

Bruker organisasjonen roller fra grupper **uten** SCIM, må gruppene også komme i ID-tokenet: Token configuration →
Add groups claim → «Groups assigned to the application», med formatet «Group ID». Ikke «Security groups» eller «All
groups»: de sender alle gruppene brukeren er i. Med SCIM på leses ikke claimet.

## 7. Kontroll

Kjør kontrollrunden i oppskriften (handlingene i Entra og det som skal skje i Neo), og se etter resultatet i
medlemslista i Neo. **Agenten** kan bekrefte to ting over MCP: tilgangsgruppene (`list_access_groups` viser
medlemmene, med `fromEntra` for dem Entra har gitt) og antallet provisjonerte brukere (`get_scim_status`). Jobbrollene
til et medlem ser bare mennesket, i medlemslista.

## Feil i verktøyene

Feilene i innloggingen, domenet og provisjoneringen står i oppskriften, med årsaken og rettingen. Her står de som
kommer når agenten gjør stegene over MCP:

| Feil | Årsak | Rettes med |
|---|---|---|
| Verktøyene finnes ikke i Claude Code | Tilkoblingen er eldre enn verktøyene, eller gjelder en annen organisasjon | Lag en ny tilkobling under API-klienter i Neo, for organisasjonen SSO settes opp i |
| Verktøyene svarer med avslag (403) | Personen er ikke eier eller administrator | Få tilgangsnivået av en administrator, eller la en administrator gjøre steget |
| `SSO_ONLY_REQUIRED` fra et verktøy | «Kun SSO» er av for organisasjonen | Del 4: slå det på med bryteren på SSO-siden |
| `GROUP_EXISTS` fra `create_entra_group_mapping` | Gruppen er alt koblet | Vis mennesket den eksisterende koblingen (`list_entra_group_mappings`). Oppdater først når hen har sagt hva som skal stå: `update_entra_group_mapping` erstatter begge settene |
| Verktøyene sluttet å virke da «Kun SSO» ble slått på | Tilkoblingen ble godkjent fra en passord-økt | Logg inn på nytt med `/mcp`, med Entra |

## Rydde etter en prøve

Slå av SCIM og «Kun SSO» og koble fra SSO i Neo først, i den rekkefølgen. Det gjør mennesket i nettleseren, og
sletter der også koblingene og tilgangsgruppene fra prøven. Slett så det som ble laget i Entra:

```bash
az ad app delete --id "$APP_ID"
```

```bash
for g in "$G1" "$G2"; do az ad group delete --group "$g"; done; for n in 1 2 3; do az ad user delete --id "neotest$n@$DOMENE"; done
```

```bash
az rest --method DELETE --url "https://graph.microsoft.com/v1.0/domains/$DOMENE"
```
