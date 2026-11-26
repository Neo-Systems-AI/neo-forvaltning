# Hvelvet

Azure Key Vault er kanalen for verdiene mellom kunden og forvalteren. Hemmeligheter og ID-er legges i hvelvet i det
øyeblikket de lages. Ingen verdi går på e-post, i en chat eller i et dokument.

Verdien ligger i hvelvet til den som eier den: kundens hvelv for kundens systemer, og forvalterens hvelv for
testorganisasjonene og testidentitetene forvalteren bygger med.

## Slik virker det

- **Kunden legger verdien i hvelvet** under navnet oppskriften oppgir, i formen `<system>--<navn>`, for eksempel
  `entra--sso-client-secret`.
- **Neo får verdien på én av to måter.** Kunden legger den inn selv under integrasjonene i Neo og tester tilkoblingen
  der, eller forvalteren henter den fra hvelvet og gjør det.
- **Kopien i hvelvet** brukes når noe skal byttes, settes opp på nytt eller feilsøkes.
- **Utløpsdatoen settes på hemmeligheten i hvelvet,** ikke i et dokument. Da ser begge parter når den må byttes.
- **Repoet sier bare hvilket hvelv.** Verdien står aldri i en fil. Se [Nøklene i repoet](#nøklene-i-repoet).

## Nøklene i repoet

Repoet sier bare hvilket hvelv nøklene ligger i, én gang, i `.claude/neo.config.json`:

```json
"hvelv": "kv-kunde"
```

- **Navnene er faste,** i formen `<system>--<navn>`, og pluginene bestemmer dem: hver plugin sier i nøkkelfila hvilke
  den trenger. Det eneste en person velger, er navnet på en Maskinporten-klient, og nøkkelen følger av det
  (`maskinporten--<klient>-nokkel`). README-en til hver plugin sier hvilke nøkler den bruker.
- **Én kommando legger dem inn:** `/forvaltning:nokler`. Den viser hva pluginene som er på, trenger, og om det står i
  hvelvet, og et menneske legger inn det som mangler uten at verdien vises. Når en plugin eller en klient kommer til,
  kjøres den samme kommandoen igjen.
- **Skriptene henter verdien fra hvelvet for kjøringen,** med personens egen innlogging (`az login`), én gang per
  kjøring. Verdien holdes i minnet, skrives aldri til disk og aldri ut, og er borte når skriptet er ferdig.
- **I CI** har jobbens hemmeligheter de samme navnene, med store bokstaver og `_` (`fiks--integrasjon-passord` →
  `FIKS_INTEGRASJON_PASSORD`), og da brukes de.
- **Personaene har ingen nøkler.** Personen logger inn selv.

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
| `entra--tenant-id`, `entra--sso-client-id`, `entra--sso-client-secret`, `entra--domene`, `entra--scim-token` | [Entra ID](../../entra/docs/entra.md#det-som-legges-i-hvelvet) |
| `exchange--client-id`, `exchange--client-secret` | [Exchange Online](../../entra/docs/exchange.md#det-som-legges-i-hvelvet) |
| `documaster--api-url`, `documaster--client-id`, `documaster--client-secret`, `documaster--scope` | [Documaster](../../documaster/docs/documaster.md#det-som-legges-i-hvelvet) |
| `maskinporten--<integrasjon>-test-client-id`, `maskinporten--<integrasjon>-prod-client-id` | [Maskinporten](../../maskinporten/docs/maskinporten.md#det-som-legges-i-hvelvet) |
| `fiks--integrasjon-id`, `fiks--integrasjon-passord`, `fiks--svarut-konto-ider`, `fiks--folkeregister-rolle-id`, `fiks--svarinn-mottakersystem-id`, `fiks--svarinn-passord`, `fiks--svarinn-sertifikat` | [KS Fiks](../../fiks/docs/fiks.md#det-som-legges-i-hvelvet) |
