# Hvelvet

Azure Key Vault er kanalen for verdiene mellom kunden og forvalteren. Hemmeligheter og ID-er legges i hvelvet i det
øyeblikket de lages. Ingen verdi går på e-post, i en chat eller i et dokument.

Verdien ligger i hvelvet til den som eier den: kundens hvelv for kundens systemer, og forvalterens hvelv for
testorganisasjonene og testidentitetene forvalteren bygger med.

## Slik virker det

- **Kunden legger verdien i hvelvet** under navnet oppskriften oppgir. Navnet starter med systemet verdien hører til,
  for eksempel `entra-sso-client-secret`.
- **Neo får verdien på én av to måter.** Kunden legger den inn selv under integrasjonene i Neo og tester tilkoblingen
  der, eller forvalteren henter den fra hvelvet og gjør det.
- **Kopien i hvelvet** brukes når noe skal byttes, settes opp på nytt eller feilsøkes.
- **Utløpsdatoen settes på hemmeligheten i hvelvet,** ikke i et dokument. Da ser begge parter når den må byttes.
- **Repoet har bare referansen,** der den brukes. Verdien står aldri i en fil. Se [Referansene i repoet](#referansene-i-repoet).

## Referansene i repoet

En referanse sier hvor verdien ligger. Verdien står aldri i en fil. For et system står referansene ved siden av
oppsettet av systemet i `.claude/neo.config.json`, under `<system>.hemmeligheter`:

```json
"fiks": {
  "miljo": "test",
  "hemmeligheter": {
    "svarinn-passord": { "kilde": "azure-keyvault:<hvelv>/fiks-svarinn-service-passord" }
  }
},
"maskinporten": {
  "klienter": { "fiks": { "clientId": "<klient-ID>" } },
  "hemmeligheter": {
    "fiks-nokkel": { "kilde": "azure-keyvault:<hvelv>/<navn>", "fil": true }
  }
}
```

For en persona står de under `hemmeligheter` i personaen i `test/personaer/`:

```yaml
hemmeligheter:
  passord: { kilde: azure-keyvault:<hvelv>/<navn> }
```

- **Hvor:** under `<system>.hemmeligheter` i config-fila for systemene, og under `hemmeligheter` i hver persona. Ingen
  andre steder. Navnet til venstre er det pluginen ser etter; README-en til hver plugin sier hvilke den trenger.
- **`kilde`:** `azure-keyvault:<hvelv>/<navn>`. Key Vault er den eneste kilden.
- **`fil: true`:** verdien er en fil, for eksempel en nøkkel (PEM).

**Skriptene henter verdien fra hvelvet ved hvert kall,** med personens egen innlogging (`az login`), og den ligger
aldri på disk: en fil lastes ned til en midlertidig mappe for kallet og slettes etterpå. Ingen verdi skrives ut. Hvilke
referanser repoet har, og om du når dem, viser `vis-hemmeligheter.mjs` i pluginen `solution`; den spør bare om
hemmeligheten finnes og er slått på, aldri etter verdien.

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
| `entra-tenant-id`, `entra-sso-client-id`, `entra-sso-client-secret`, `entra-domene`, `entra-scim-token` | [Entra ID](../../entra/docs/entra.md#det-som-legges-i-hvelvet) |
| `exchange-client-id`, `exchange-client-secret` | [Exchange Online](../../entra/docs/exchange.md#det-som-legges-i-hvelvet) |
| `documaster-api-url`, `documaster-client-id`, `documaster-client-secret`, `documaster-scope` | [Documaster](../../documaster/docs/documaster.md#det-som-legges-i-hvelvet) |
| `maskinporten-<integrasjon>-test-client-id`, `maskinporten-<integrasjon>-prod-client-id` | [Maskinporten](../../maskinporten/docs/maskinporten.md#det-som-legges-i-hvelvet) |
| `fiks-integrasjon-id`, `fiks-integrasjon-passord`, `fiks-svarut-konto-ider`, `fiks-folkeregister-rolle-id`, `fiks-svarinn-mottakersystem-id`, `fiks-svarinn-service-passord`, `fiks-svarinn-sertifikat` | [KS Fiks](../../fiks/docs/fiks.md#det-som-legges-i-hvelvet) |
