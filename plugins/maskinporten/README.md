# maskinporten

Maskinporten slik den selv svarer, for feilsøk av kall Neo gjør mot KRR, Fiks og Altinn. Bare lesing; tokenet
skrives aldri ut.

| Skill | Hva |
|---|---|
| `maskinporten:api` | `well-known` for miljøet, og `token` for en klient: bedt om, innvilget, utløp og claims |

`scripts/maskinporten.mjs` har kommandoene, uten avhengigheter. Miljøene er `test` (test.maskinporten.no) og
`produksjon` (maskinporten.no).

## Config

I `.claude/neo.config.json`: standardklienten per miljø, og navngitte klienter som arver det de ikke har selv. Andre
plugins (`krr`, `fiks` …) peker på klienten med navnet. Nøkkelen står bare som en referanse, aldri med verdi.

```json
"maskinporten": {
  "environments": ["test", "produksjon"],
  "defaultEnv": "test",
  "byEnv": {
    "test": {
      "clientId": "<klient-ID fra selvbetjeningen>",
      "kid": "<valgfri>",
      "nokkel": { "$env": "MASKINPORTEN_KEY_FILE" },
      "klienter": {
        "krr": { "scopes": ["krr:global/kontaktinformasjon.read"] },
        "fiks": { "clientId": "<en annen klient>", "nokkel": { "$env": "MASKINPORTEN_FIKS_KEY_FILE" }, "scopes": ["ks:fiks"] }
      }
    }
  }
}
```

Nøkkelen står bare med navnet på variabelen. Referansen til hvelvet står i
`integrasjoner/maskinporten/hemmeligheter.yaml` i kunderepoet, og med `fil: true` der henter `/config:show-secrets` nøkkelen
til en PEM-fil i `.keys/`, og variabelen er stien til den; ellers er den selve PEM-en. Sjekk oppsettet med `/config:check-setup`. Uten `kid` brukes thumbprinten av nøkkelen (RFC 7638).

## Det kunden må ha selv

Oppsettet hos kunden, steg for steg, står i [`docs/maskinporten.md`](./docs/maskinporten.md).

- **En egen Maskinporten-klient** per miljø, registrert i Digdirs selvbetjening, med scopene tjenestene krever.
- **Et eget virksomhetssertifikat** eller en egen nøkkel registrert på klienten, i kundens hvelv.
- **Bruksvilkårene** hos Digdir for Maskinporten og for hver tjeneste (for eksempel KRR) er godtatt av kunden.

Kunden eier klientene og nøklene; vi eier koden.
