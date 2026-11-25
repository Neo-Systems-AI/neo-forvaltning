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

En referanse sier hvilken variabel verdien leses fra, og hvor den ligger:

```yaml
# integrasjoner/fiks/hemmeligheter.yaml
svarinn-passord:
  $env: FIKS_SVARINN_PASSORD
  kilde: azure-keyvault:<hvelv>/fiks-svarinn-service-passord
maskinporten-nokkel: { $env: FIKS_MASKINPORTEN_NOKKEL, kilde: azure-keyvault:<hvelv>/<navn>, fil: true }
```

- **Hvor:** `integrasjoner/<system>/hemmeligheter.yaml` for systemene, og under `hemmeligheter` i hver persona i
  `test/personaer/`. `.claude/neo.config.json` har ingen; der står bare navnet på variabelen (`{ "$env": … }`) når en
  plugin trenger verdien til et kall.
- **`kilde`:** `azure-keyvault:<hvelv>/<navn>`, eller `manuell` når personen skriver verdien selv.
- **`fil: true`:** verdien er en nøkkelfil. Den hentes til `.keys/`, og variabelen er stien til fila.

**Hentingen** gjør et menneske, med sin egen innlogging mot hvelvet (`az login`), til `.env.local` og `.keys/` i
repoet. Begge står i `.gitignore` og committes aldri. Agenten leser dem aldri; vakten i pluginen `config` stopper det.

```bash
node <pluginen config>/scripts/hent-hemmeligheter.mjs --sjekk   # navnene, hvor de står, og om de er satt
node <pluginen config>/scripts/hent-hemmeligheter.mjs --hent    # henter verdiene; kjøres av mennesket selv
```

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
