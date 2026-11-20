# Hvelvet

Kundens Azure Key Vault er kanalen for verdiene mellom kunden og forvalteren. Hemmeligheter og ID-er legges i hvelvet i
det øyeblikket kunden lager dem. Ingen verdi går på e-post, i en chat eller i et dokument.

## Slik virker det

- **Kunden legger verdien i hvelvet** under navnet oppskriften oppgir. Navnet starter med systemet verdien hører til,
  for eksempel `entra-sso-client-secret`.
- **Neo får verdien på én av to måter.** Kunden legger den inn selv under integrasjonene i Neo og tester tilkoblingen
  der, eller forvalteren henter den fra hvelvet og gjør det.
- **Kopien i hvelvet** brukes når noe skal byttes, settes opp på nytt eller feilsøkes.
- **Utløpsdatoen settes på hemmeligheten i hvelvet,** ikke i et dokument. Da ser begge parter når den må byttes.
- **Kundens repo viser bare til navnet,** i formen `azure-keyvault:<hvelv>/<navn>`. Verdien står aldri i en fil.

## Oppgavene

### Lag hvelvet

Lag et Azure Key Vault i kundens Azure, med tilgangsmodellen Azure RBAC.

Ferdig når hvelvet finnes med Azure RBAC som tilgangsmodell, og kunden har gitt forvalteren navnet på det.

### Inviter forvalterens personer

Inviter forvalterens personer som gjestebrukere i kundens Entra ID. Forvalteren oppgir hvem.

Ferdig når hver av dem har godtatt invitasjonen.

### Gi forvalteren rollen på hvelvet

Gi gjestebrukerne rollen Key Vault Secrets Officer på hvelvet. Rollen lar dem lese og legge inn verdier. Den lar dem
ikke endre tilgangene. Kunden kan fjerne rollen når som helst.

Ferdig når forvalteren har lest og lagt inn en verdi i hvelvet.

## Navnene

| Navn | System |
|---|---|
| `entra-tenant-id`, `entra-sso-client-id`, `entra-sso-client-secret`, `entra-domene`, `entra-scim-token` | [Entra ID](./entra.md#det-som-legges-i-hvelvet) |
| `exchange-client-id`, `exchange-client-secret` | [Exchange Online](./exchange.md#det-som-legges-i-hvelvet) |
| `documaster-api-url`, `documaster-client-id`, `documaster-client-secret`, `documaster-scope` | [Documaster](./documaster.md#det-som-legges-i-hvelvet) |
| `maskinporten-<integrasjon>-test-client-id`, `maskinporten-<integrasjon>-prod-client-id` | [Maskinporten](./maskinporten.md#det-som-legges-i-hvelvet) |
| `fiks-integrasjon-id`, `fiks-integrasjon-passord`, `fiks-svarut-konto-ider`, `fiks-folkeregister-rolle-id`, `fiks-svarinn-mottakersystem-id`, `fiks-svarinn-service-passord`, `fiks-svarinn-sertifikat` | [KS Fiks](./fiks.md#det-som-legges-i-hvelvet) |
