# krr

Oppslag i Kontakt- og reservasjonsregisteret (KRR), slik registeret selv svarer, for feilsøk av varslingen i Neo.
Bare lesing; personnummeret maskeres (de seks første sifrene og `*****`).

| Skill | Hva |
|---|---|
| `krr:krr` | `person`: kontaktinformasjon, reservasjon og varslingsstatus for én eller flere personer |
| `krr:env` | Config-fila slik pluginen leser den |

`scripts/krr.mjs` har kommandoen, uten avhengigheter. Miljøene er `test` (test.kontaktregisteret.no) og
`produksjon` (kontaktregisteret.no). Oppslaget går mot `POST /rest/v1/personer` (eller v2 med `--v2`).

## Config

```json
"krr": { "environments": ["test", "produksjon"], "defaultEnv": "test", "klient": "krr" }
```

**Klienten hentes fra `maskinporten`-delen** (`maskinporten.byEnv.<miljø>.klienter.<klient>`, standard `krr`), ikke
fra egne nøkler her. Det er det enkleste: klienten, nøkkelen og scopet står ett sted, og
`/maskinporten:maskinporten token krr` prøver nøyaktig den klienten KRR-oppslaget bruker. Står ingen scopes på
klienten, brukes `krr:global/kontaktinformasjon.read`. Pluginen `maskinporten` trenger ikke være installert; bare
delen i config-fila.

## Det kunden må ha selv

- **En egen Maskinporten-klient** med scopet `krr:global/kontaktinformasjon.read`, i hvert miljø.
- **Et eget virksomhetssertifikat** eller en egen nøkkel på klienten, i kundens hvelv.
- **Bruksvilkårene for KRR** hos Digdir er godtatt av kunden, og kunden har hjemmel for oppslagene.

Kunden eier klientene og nøklene; vi eier koden.
