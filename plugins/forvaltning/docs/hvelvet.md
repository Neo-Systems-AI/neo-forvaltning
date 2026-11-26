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

En referanse sier hva verdien heter lokalt (`$env`) og hvor den ligger (`kilde`). Verdien står aldri i en fil. For et
system står referansene ved siden av oppsettet av systemet i `.claude/neo.config.json`, under `<system>.hemmeligheter`,
og for maskinklienten mot Neo under `neo.byEnv.sandkasse.apiClient.clientSecret`:

```json
"fiks": {
  "miljo": "test",
  "hemmeligheter": {
    "svarinn-passord": { "$env": "FIKS_SVARINN_SERVICE_PASSORD", "kilde": "azure-keyvault:<hvelv>/fiks-svarinn-service-passord" }
  }
},
"maskinporten": {
  "klienter": { "fiks": { "clientId": "<klient-ID>" } },
  "hemmeligheter": {
    "fiks-nokkel": { "$env": "MASKINPORTEN_FIKS_NOKKEL", "kilde": "azure-keyvault:<hvelv>/<navn>", "fil": true }
  }
}
```

For en persona står de under `hemmeligheter` i personaen i `test/personaer/`:

```yaml
hemmeligheter:
  passord: { $env: <NAVN>, kilde: azure-keyvault:<hvelv>/<navn> }
```

- **Hvor:** under `<system>.hemmeligheter` i config-fila for systemene, under `apiClient` for maskinklienten, og under
  `hemmeligheter` i hver persona. Navnet til venstre er det pluginen ser etter; README-en til hver plugin sier hvilke
  den trenger.
- **`$env`:** navnet verdien har i `.env.local` lokalt, og i jobbens hemmeligheter i GitHub.
- **`kilde`:** `azure-keyvault:<hvelv>/<navn>` er standarden. `1password:op://…` og `manuell` finnes for en kunde
  uten Key Vault.
- **`fil: true`:** verdien er en fil, for eksempel en nøkkel (PEM). Den hentes til `.keys/`, og `$env` peker på fila.

**Et menneske henter verdiene** fra hvelvet til `.env.local` og `.keys/` med sin egen innlogging
(`hent-hemmeligheter.mjs --hent`), og skriptene leser dem derfra uten å skrive dem ut. Begge står i `.gitignore`, og
agenten leser dem aldri: vakten i `forvaltning` stopper det. Hva som er satt, viser `hent-hemmeligheter.mjs --sjekk`,
bare med navn. Personaenes referanser er for personen som logger inn; ingen skript henter dem.

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
