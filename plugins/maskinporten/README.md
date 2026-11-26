# maskinporten

Maskinporten slik den selv svarer, for feilsøk av kall Neo gjør mot KRR, Fiks og Altinn. Bare lesing; tokenet
skrives aldri ut.

| Skill | Hva |
|---|---|
| `maskinporten:api` | `well-known` for miljøet, og `token` for en klient: bedt om, innvilget, utløp og claims |

`scripts/maskinporten.mjs` har kommandoene, uten avhengigheter. Miljøene er `test` (test.maskinporten.no) og
`produksjon` (maskinporten.no).

## Config

Klientene beskrives ett sted, i `.claude/neo.config.json`, med navn. `altinn`, `fiks` og `krr` viser til en klient med
navnet (`altinn.klient`, `fiks.klient`, `krr.klient`), så Maskinporten-pluginen prøver nøyaktig den klienten de bruker.

```json
"maskinporten": {
  "miljo": "test",
  "klienter": {
    "krr": { "clientId": "<klient-ID fra selvbetjeningen>", "scopes": ["krr:global/kontaktinformasjon.read"] },
    "fiks": { "clientId": "<en annen klient>", "kid": "<valgfri>", "scopes": ["ks:fiks"] }
  },
  "hemmeligheter": {
    "krr-nokkel": { "$env": "MASKINPORTEN_KRR_NOKKEL", "kilde": "azure-keyvault:<hvelv>/<navn>", "fil": true },
    "fiks-nokkel": { "$env": "MASKINPORTEN_FIKS_NOKKEL", "kilde": "azure-keyvault:<hvelv>/<navn>", "fil": true }
  }
}
```

- **`miljo`:** miljøet klientene er registrert i, `test` eller `produksjon`. Et system i et annet miljø enn klientene
  stopper med en feil, så test og produksjon aldri blandes.
- **Nøkkelen** til hver klient er referansen `<navn>-nokkel` under `hemmeligheter`, med `fil: true`: en PEM i
  hvelvet. Skriptet henter den for kjøringen, med personens egen innlogging, holder den i minnet og
  skriver den aldri ut.
- **Uten `kid`** brukes thumbprinten av nøkkelen (RFC 7638), slik selvbetjeningen gjør.

## Det kunden må ha selv

Oppsettet hos kunden, steg for steg, står i [`docs/maskinporten.md`](./docs/maskinporten.md).

- **En egen Maskinporten-klient** per miljø, registrert i Digdirs selvbetjening, med scopene tjenestene krever.
- **Et eget virksomhetssertifikat** eller en egen nøkkel registrert på klienten, i kundens hvelv.
- **Bruksvilkårene** hos Digdir for Maskinporten og for hver tjeneste (for eksempel KRR) er godtatt av kunden.

Kunden eier klientene og nøklene; vi eier koden.
