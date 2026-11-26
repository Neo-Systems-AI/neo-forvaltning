---
name: set-up-sso
description: Setter opp innlogging med Microsoft Entra ID (SSO) og automatisk brukerprovisjonering (SCIM) for en organisasjon i Neo, med grupper i Entra koblet til jobbroller og tilgangsgrupper - i rekkefølgen Neo krever, med hvem som gjør hva, kontrollen etter hvert steg og feilene som pleier å komme. Kommandoene mot Entra er et skript et menneske kjører med sin egen innlogging; agenten gjør det trygge i Neo over MCP. Last når SSO eller SCIM skal settes opp, prøves på testbrukere eller feilsøkes.
---

# SSO og SCIM mot Entra ID

**Oppskriften står i `${CLAUDE_PLUGIN_ROOT}/docs/entra.md`:** hva kunden trenger, oppgavene i rekkefølge med når hver
er ferdig, hva som legges i hvelvet, hva forvalteren gjør i Neo, kontrollrunden, driften og feilene. Les den først.
Her står hvem som gjør hva, hvilket steg i skriptet som gjør hver oppgave, og hva du kontrollerer før neste.

Kommandoene mot Entra er `node "${CLAUDE_PLUGIN_ROOT}/scripts/entra.mjs" <steg>`, kjørt av **mennesket** i sin egen
terminal etter `az login --allow-no-subscriptions`. Hvert steg skriver ut det neste trenger (appId, spId, jobben).
Steg som leser en hemmelighet (SCIM-tokenet, passordet til testbrukerne), leser den skjult fra terminalen og stopper
når de ikke kjøres i en terminal.

## Hvem gjør hva

| Steg | Agent | Menneske |
|---|---|---|
| Gi kommandoen, lese utdataene, finne feilen | ✅ | |
| Kjøre skriptet mot tenanten | | ✅ med sin egen innlogging |
| Client secret og SCIM-token | ❌ ser dem aldri | ✅ rett fra kilden til målet |
| Lagre SSO-oppsettet i Neo (med client secret), slå på «Kun SSO» og SCIM | ❌ | ✅ i nettleseren, som administrator |
| Lese oppsettet og statusen fra Neo, verifisere domenet | ✅ over MCP | eller i nettleseren |
| Lage tilgangsgrupper og koble Entra-grupper til roller | ✅ over MCP, etter et ja | eller «Koble gruppe» |
| TXT-posten i DNS, og å logge inn som en testbruker | | ✅ |

**Verktøyene i Neo** (`get_sso_setup`, `verify_sso_domain`, `get_scim_status`, `list_access_groups`,
`create_access_group`, `list_entra_group_mappings`, `create_entra_group_mapping`, `update_entra_group_mapping`) finnes
bare når tilkoblingen gjelder **produksjonsorganisasjonen** (SSO og SCIM finnes ikke i sandkassen), personen er eier
eller administrator, og tilkoblingen er laget etter at Neo fikk verktøyene. Kjør `get_sso_setup` først, og kontroller
`organizationId` med mennesket før noe skrives. Det agenten skriver i Neo, gjelder med en gang: si hva, og få et ja.

## Rekkefølgen, med kontrollen

1. **(Valgfritt) Testbrukere:** `testbrukere --domene <underdomene>`. Lag så to sikkerhetsgrupper med brukerne som
   direkte medlemmer. *Kontroll:* `verifisert` er `true`.
2. **Appen:** `app`. *Kontroll:* `kontroller --app <appId>` gir exit 0.
3. **Gruppene til appen:** `tildel --sp <spId> --gruppe <Object ID> …`. *Kontroll:* svaret er gruppenavnene.
4. **Client secret:** mennesket kjører `az ad app credential reset --id <appId> --display-name neo --years 1` og kopierer
   `password` rett inn i Neo. Den vises én gang.
5. **SSO i Neo:** mennesket fyller inn tenant, appId, client secret og domenet. **Agenten:** `get_sso_setup`;
   kontroller at `entraTenantId`, `clientId` og `domain` er de fra steg 2, og gi `redirect --app <appId> --uri
   <redirectUri>`. Mennesket legger TXT-posten (`verificationRecord`) i DNS. **Agenten:** `verify_sso_domain` til
   `domainVerified: true`; finner Neo ikke posten, vent noen minutter og endre ingenting.
6. **Prøv innloggingen før SCIM:** en bruker i domenet logger inn med SSO i et inkognitovindu og lander som medlem.
   Uten SCIM blir en bruker i domenet medlem ved første innlogging; med SCIM avvises alle Entra ikke har provisjonert,
   så en feil i SSO er lettere å finne nå.
7. **«Kun SSO»:** mennesket, i nettleseren, innlogget med Entra som administrator. Neo slår det bare på fra en
   Entra-økt, og når minst én administrator har logget inn med Entra. **Agenten:** `get_sso_setup` gir `ssoOnly: true`.
   En tilkobling godkjent fra en passord-økt slutter å virke nå: logg inn på nytt med `/mcp`, med Entra.
8. **SCIM:** **Agenten:** `get_scim_status`, `ssoReady` skal være `true`. Mennesket slår på SCIM i Neo og kjører
   `scim-tilkobling --sp <spId> --url <tenantUrl>` med tokenet fra dialogen, så `scim-mapping`, så
   `scim-prov --bruker <upn>`, og til sist `scim-start`. *Kontroll:* `scim-mapping` gir exit 0; `scim-prov` går
   gjennom til eksporten; `scim-status` gir `kode: Active` etter start. **Agenten:** `get_scim_status` etter første
   syklus: `lastUsedAt` har et tidspunkt, og `provisionedUsers.active` er antallet i de tildelte gruppene.
9. **Grupper til roller:** avklar med mennesket hvilke jobbroller og tilgangsgrupper hver gruppe skal gi; det er
   organisasjonens beslutning. **Agenten:** `list_entra_group_mappings` (`ssoOnly` er `true`, og gruppen står ikke der
   fra før), `list_access_groups`, `create_access_group` for det som mangler, og `create_entra_group_mapping` med
   `externalGroupId` (Object ID), `label`, `roleCodes` og `teamIds`, minst én av listene med innhold. `appliesAt` sier
   når det slår inn. `update_entra_group_mapping` erstatter begge settene: send alt gruppen skal gi.
10. **Kontrollrunden** i oppskriften. **Agenten** kan bekrefte tilgangsgruppene (`list_access_groups`, med `fromEntra`)
    og antallet provisjonerte (`get_scim_status`); jobbrollene ser bare mennesket, i medlemslista.

Bruker organisasjonen roller fra grupper **uten** SCIM, må gruppene også komme i ID-tokenet: Token configuration → Add
groups claim → «Groups assigned to the application», med formatet «Group ID».

## Feil i verktøyene og skriptet

Feilene i innloggingen, domenet og provisjoneringen står i oppskriften. Her står de som kommer underveis:

| Feil | Årsak | Rettes med |
|---|---|---|
| Verktøyene finnes ikke i Claude Code | Tilkoblingen er eldre enn verktøyene, eller gjelder en annen organisasjon | En ny tilkobling under API-klienter i Neo, for produksjonsorganisasjonen |
| Verktøyene svarer med avslag (403) | Personen er ikke eier eller administrator | En administrator gjør steget, eller gir tilgangsnivået |
| `SSO_ONLY_REQUIRED` | «Kun SSO» er av | Steg 7 |
| `GROUP_EXISTS` | Gruppen er alt koblet | Vis den eksisterende koblingen; oppdater først når mennesket har sagt hva som skal stå |
| `scim-status` viser `Paused` og `Failed` med `0001-01-01` | Jobben har ikke kjørt ennå: standardverdiene, ikke en feil | `scim-start` |
| Skriptet sier at tokenet leses fra terminalen | Det kjøres uten terminal, for eksempel av agenten | Mennesket kjører det selv |

## Rydde etter en prøve

Mennesket slår av SCIM og «Kun SSO» og kobler fra SSO i Neo først, i den rekkefølgen, og sletter koblingene og
tilgangsgruppene der. Så: `rydd --app <appId> --gruppe <id> … --domene <underdomene>`.
